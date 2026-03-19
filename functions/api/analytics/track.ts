// POST /api/analytics/track — lightweight event tracking via CF Workers KV
// Events: tool_use, cta_click, page_view
// KV key format: analytics:{date}:{event}:{slug} → count (incremented)

interface Env {
  ANALYTICS: KVNamespace;
}

interface TrackPayload {
  event: string;   // tool_use | cta_click | page_view
  slug?: string;   // tool slug or page path
  label?: string;  // CTA label or extra context
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (!context.env.ANALYTICS) {
    return new Response(JSON.stringify({ ok: false, error: 'KV not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  let body: TrackPayload;
  try {
    body = await context.request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const { event, slug, label } = body;
  if (!event || !['tool_use', 'cta_click', 'page_view'].includes(event)) {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid event type' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const key = `analytics:${date}:${event}:${slug || 'unknown'}`;

  // Increment counter in KV
  const current = parseInt((await context.env.ANALYTICS.get(key)) || '0', 10);
  await context.env.ANALYTICS.put(key, String(current + 1), {
    // Auto-expire after 90 days
    expirationTtl: 90 * 24 * 60 * 60,
  });

  // Also store label-specific tracking for CTA clicks
  if (event === 'cta_click' && label) {
    const labelKey = `analytics:${date}:cta_label:${label}`;
    const labelCount = parseInt((await context.env.ANALYTICS.get(labelKey)) || '0', 10);
    await context.env.ANALYTICS.put(labelKey, String(labelCount + 1), {
      expirationTtl: 90 * 24 * 60 * 60,
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
};

// Handle CORS preflight
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
