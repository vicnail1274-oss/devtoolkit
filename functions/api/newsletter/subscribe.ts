import type { Env } from '../_shared/types';

interface SubscribeBody {
  email: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const body = await context.request.json() as SubscribeBody;
    const email = body.email?.trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email address' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Store in KV with email as key, metadata as value
    const existing = await context.env.NEWSLETTER_KV.get(email);
    const now = new Date().toISOString();

    if (existing) {
      // Re-subscribe: update record, clear unsubscribed flag
      const data = JSON.parse(existing);
      data.unsubscribed_at = null;
      data.resubscribed_at = now;
      await context.env.NEWSLETTER_KV.put(email, JSON.stringify(data));
    } else {
      // New subscriber
      await context.env.NEWSLETTER_KV.put(email, JSON.stringify({
        email,
        subscribed_at: now,
        unsubscribed_at: null,
      }));
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

// Handle CORS preflight
export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
