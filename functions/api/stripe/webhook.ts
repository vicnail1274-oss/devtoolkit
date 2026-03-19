// POST /api/stripe/webhook — Handle Stripe webhook events
import type { Env } from '../_shared/types';

// Verify Stripe webhook signature using Web Crypto API
async function verifyStripeSignature(
  payload: string,
  sigHeader: string,
  secret: string
): Promise<boolean> {
  try {
    const parts = sigHeader.split(',').reduce((acc, part) => {
      const [key, val] = part.split('=');
      acc[key] = val;
      return acc;
    }, {} as Record<string, string>);

    const timestamp = parts['t'];
    const signature = parts['v1'];
    if (!timestamp || !signature) return false;

    // Tolerance: 5 minutes
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - parseInt(timestamp)) > 300) return false;

    const signedPayload = `${timestamp}.${payload}`;
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload));
    const expected = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');

    return expected === signature;
  } catch {
    return false;
  }
}

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  const payload = await request.text();
  const sigHeader = request.headers.get('stripe-signature');

  if (!sigHeader) {
    return new Response('Missing signature', { status: 400 });
  }

  const valid = await verifyStripeSignature(payload, sigHeader, env.STRIPE_WEBHOOK_SECRET);
  if (!valid) {
    return new Response('Invalid signature', { status: 400 });
  }

  const event = JSON.parse(payload);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const customerId = session.customer;
      const subscriptionId = session.subscription;

      // Update subscription record
      await env.DB.prepare(
        `UPDATE subscriptions SET
          stripe_subscription_id = ?,
          plan = 'pro',
          status = 'trialing',
          trial_ends_at = datetime('now', '+7 days'),
          updated_at = datetime('now')
        WHERE stripe_customer_id = ?`
      ).bind(subscriptionId, customerId).run();
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object;
      const status = sub.status; // active, trialing, past_due, canceled, unpaid
      const plan = sub.cancel_at_period_end ? 'pro' : 'pro'; // still pro until period ends
      const cancelAtPeriodEnd = sub.cancel_at_period_end ? 1 : 0;

      await env.DB.prepare(
        `UPDATE subscriptions SET
          status = ?,
          plan = ?,
          cancel_at_period_end = ?,
          current_period_end = datetime(?, 'unixepoch'),
          updated_at = datetime('now')
        WHERE stripe_subscription_id = ?`
      ).bind(status, plan, cancelAtPeriodEnd, sub.current_period_end, sub.id).run();
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      // Downgrade to free
      await env.DB.prepare(
        `UPDATE subscriptions SET
          plan = 'free',
          status = 'canceled',
          cancel_at_period_end = 0,
          updated_at = datetime('now')
        WHERE stripe_subscription_id = ?`
      ).bind(sub.id).run();
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      await env.DB.prepare(
        `UPDATE subscriptions SET
          status = 'past_due',
          updated_at = datetime('now')
        WHERE stripe_customer_id = ?`
      ).bind(invoice.customer).run();
      break;
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
