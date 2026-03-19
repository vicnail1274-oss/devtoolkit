// GET /api/auth/callback — Google OAuth callback, creates/updates user, sets session cookie
import type { Env, TokenPayload } from '../_shared/types';
import { signJWT, generateId } from '../_shared/auth';

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  token_type: string;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  name: string;
  picture: string;
}

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state') || '/';

  if (!code) {
    return new Response('Missing authorization code', { status: 400 });
  }

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${env.SITE_URL}/api/auth/callback`,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    return new Response('OAuth token exchange failed', { status: 500 });
  }

  const tokens: GoogleTokenResponse = await tokenRes.json();

  // Get user info
  const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userRes.ok) {
    return new Response('Failed to fetch user info', { status: 500 });
  }

  const googleUser: GoogleUserInfo = await userRes.json();

  // Upsert user in D1
  let user = await env.DB.prepare(
    'SELECT * FROM users WHERE google_id = ?'
  ).bind(googleUser.sub).first();

  if (!user) {
    // Check if email already exists (e.g. from a different auth method)
    user = await env.DB.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).bind(googleUser.email).first();

    if (user) {
      // Link Google ID to existing user
      await env.DB.prepare(
        'UPDATE users SET google_id = ?, name = ?, avatar_url = ?, updated_at = datetime(\'now\') WHERE id = ?'
      ).bind(googleUser.sub, googleUser.name, googleUser.picture, user.id).run();
    } else {
      // Create new user
      const userId = generateId();
      await env.DB.prepare(
        'INSERT INTO users (id, email, name, avatar_url, google_id) VALUES (?, ?, ?, ?, ?)'
      ).bind(userId, googleUser.email, googleUser.name, googleUser.picture, googleUser.sub).run();

      // Create free subscription
      await env.DB.prepare(
        'INSERT INTO subscriptions (id, user_id, plan, status) VALUES (?, ?, \'free\', \'active\')'
      ).bind(generateId(), userId).run();

      user = { id: userId, email: googleUser.email };
    }
  } else {
    // Update existing user's info
    await env.DB.prepare(
      'UPDATE users SET name = ?, avatar_url = ?, updated_at = datetime(\'now\') WHERE id = ?'
    ).bind(googleUser.name, googleUser.picture, user.id).run();
  }

  // Get subscription plan
  const sub = await env.DB.prepare(
    'SELECT plan, status FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1'
  ).bind(user.id).first();

  const plan = (sub?.status === 'active' || sub?.status === 'trialing') && sub?.plan === 'pro' ? 'pro' : 'free';

  // Create JWT session token (7 days)
  const now = Math.floor(Date.now() / 1000);
  const payload: TokenPayload = {
    sub: user.id as string,
    email: (user.email || googleUser.email) as string,
    plan,
    iat: now,
    exp: now + 7 * 24 * 60 * 60,
  };

  const token = await signJWT(payload, env.JWT_SECRET);

  // Set cookie and redirect
  const headers = new Headers();
  headers.set('Location', state);
  headers.set('Set-Cookie',
    `dt_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`
  );

  return new Response(null, { status: 302, headers });
};
