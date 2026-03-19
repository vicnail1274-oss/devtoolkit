// GET /api/analytics/query?days=7 — query aggregated analytics from KV
// Returns tool usage, CTA clicks, page views grouped by date

interface Env {
  ANALYTICS: KVNamespace;
  ANALYTICS_SECRET?: string; // optional: protect dashboard queries
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  if (!context.env.ANALYTICS) {
    return new Response(JSON.stringify({ ok: false, error: 'KV not configured' }), {
      status: 503,
      headers: corsHeaders,
    });
  }

  // Optional auth check
  const secret = context.env.ANALYTICS_SECRET;
  if (secret) {
    const authHeader = new URL(context.request.url).searchParams.get('key');
    if (authHeader !== secret) {
      return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
        status: 401,
        headers: corsHeaders,
      });
    }
  }

  const url = new URL(context.request.url);
  const days = Math.min(parseInt(url.searchParams.get('days') || '7', 10), 90);

  // Generate date range
  const dates: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }

  // List all KV keys matching the date range
  const eventTypes = ['tool_use', 'cta_click', 'page_view'];
  const results: Record<string, Record<string, Record<string, number>>> = {};
  const topTools: Record<string, number> = {};
  const topCtas: Record<string, number> = {};
  const dailyTotals: Record<string, Record<string, number>> = {};

  for (const date of dates) {
    dailyTotals[date] = { tool_use: 0, cta_click: 0, page_view: 0 };

    for (const eventType of eventTypes) {
      const prefix = `analytics:${date}:${eventType}:`;
      const listed = await context.env.ANALYTICS.list({ prefix });

      for (const key of listed.keys) {
        const value = parseInt((await context.env.ANALYTICS.get(key.name)) || '0', 10);
        const slug = key.name.replace(prefix, '');

        if (!results[date]) results[date] = {};
        if (!results[date][eventType]) results[date][eventType] = {};
        results[date][eventType][slug] = value;

        dailyTotals[date][eventType] += value;

        if (eventType === 'tool_use') {
          topTools[slug] = (topTools[slug] || 0) + value;
        }
      }
    }

    // Also get CTA labels
    const ctaPrefix = `analytics:${date}:cta_label:`;
    const ctaListed = await context.env.ANALYTICS.list({ prefix: ctaPrefix });
    for (const key of ctaListed.keys) {
      const value = parseInt((await context.env.ANALYTICS.get(key.name)) || '0', 10);
      const label = key.name.replace(ctaPrefix, '');
      topCtas[label] = (topCtas[label] || 0) + value;
    }
  }

  // Sort top tools/CTAs
  const sortedTools = Object.entries(topTools)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20);
  const sortedCtas = Object.entries(topCtas)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  return new Response(JSON.stringify({
    ok: true,
    days,
    dates: dates.reverse(), // chronological order
    dailyTotals,
    topTools: sortedTools,
    topCtas: sortedCtas,
    details: results,
  }, null, 2), {
    status: 200,
    headers: corsHeaders,
  });
};
