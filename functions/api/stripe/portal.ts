// POST /api/stripe/portal — Create Stripe Billing Portal session
import type { Env } from '../_shared/types';
import { requireAuth } from '../_shared/auth';

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  const result = await requireAuth(request, env);
  if (result instanceof Response) return result;
  const user = result;

  // Get Stripe customer ID
  const sub = await env.DB.prepare(
    'SELECT stripe_customer_id FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1'
  ).bind(user.sub).first();

  if (!sub?.stripe_customer_id) {
    return new Response(JSON.stringify({ error: 'No subscription found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Create portal session
  const portalRes = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      customer: sub.stripe_customer_id as string,
      return_url: `${env.SITE_URL}/pricing`,
    }),
  });

  if (!portalRes.ok) {
    return new Response(JSON.stringify({ error: 'Failed to create portal session' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const portal = await portalRes.json() as { url: string };

  return new Response(JSON.stringify({ url: portal.url }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
