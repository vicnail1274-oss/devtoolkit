// GET /api/auth/me — Get current user info + subscription
import type { Env } from '../_shared/types';
import { getAuthUser } from '../_shared/auth';

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const user = await getAuthUser(request, env);

  if (!user) {
    return new Response(JSON.stringify({ authenticated: false }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get full user + subscription info
  const dbUser = await env.DB.prepare(
    'SELECT u.id, u.email, u.name, u.avatar_url, s.plan, s.status, s.trial_ends_at, s.current_period_end, s.cancel_at_period_end FROM users u LEFT JOIN subscriptions s ON s.user_id = u.id WHERE u.id = ? ORDER BY s.created_at DESC LIMIT 1'
  ).bind(user.sub).first();

  if (!dbUser) {
    return new Response(JSON.stringify({ authenticated: false }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({
    authenticated: true,
    user: {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      avatarUrl: dbUser.avatar_url,
      plan: dbUser.plan || 'free',
      subscriptionStatus: dbUser.status || 'active',
      trialEndsAt: dbUser.trial_ends_at,
      currentPeriodEnd: dbUser.current_period_end,
      cancelAtPeriodEnd: dbUser.cancel_at_period_end,
    },
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
