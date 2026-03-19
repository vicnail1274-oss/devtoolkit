// GET /api/auth/google — Redirect to Google OAuth consent screen
import type { Env } from '../_shared/types';

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const url = new URL(request.url);
  const redirectUri = `${env.SITE_URL}/api/auth/callback`;

  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
    state: url.searchParams.get('redirect') || '/',
  });

  return Response.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    302
  );
};
