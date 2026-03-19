// POST /api/stripe/checkout — Create Stripe Checkout session for Pro subscription
import type { Env } from '../_shared/types';
import { requireAuth } from '../_shared/auth';

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  const result = await requireAuth(request, env);
  if (result instanceof Response) return result;
  const user = result;

  // Get or create Stripe customer
  let sub = await env.DB.prepare(
    'SELECT stripe_customer_id FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1'
  ).bind(user.sub).first();

  let customerId = sub?.stripe_customer_id as string | null;

  if (!customerId) {
    // Create Stripe customer
    const customerRes = await fetch('https://api.stripe.com/v1/customers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: user.email,
        'metadata[user_id]': user.sub,
      }),
    });

    if (!customerRes.ok) {
      return new Response(JSON.stringify({ error: 'Failed to create Stripe customer' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const customer = await customerRes.json() as { id: string };
    customerId = customer.id;

    // Save customer ID
    await env.DB.prepare(
      'UPDATE subscriptions SET stripe_customer_id = ?, updated_at = datetime(\'now\') WHERE user_id = ?'
    ).bind(customerId, user.sub).run();
  }

  // Create Checkout Session with 7-day trial
  const sessionRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      customer: customerId,
      mode: 'subscription',
      'line_items[0][price]': env.STRIPE_PRICE_ID,
      'line_items[0][quantity]': '1',
      'subscription_data[trial_period_days]': '7',
      success_url: `${env.SITE_URL}/pricing?success=1`,
      cancel_url: `${env.SITE_URL}/pricing?canceled=1`,
    }),
  });

  if (!sessionRes.ok) {
    return new Response(JSON.stringify({ error: 'Failed to create checkout session' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const session = await sessionRes.json() as { url: string };

  return new Response(JSON.stringify({ url: session.url }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
