// GET /api/user/usage — Get current user's AI tool usage stats
import type { Env } from '../_shared/types';
import { requireAuth } from '../_shared/auth';

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const result = await requireAuth(request, env);
  if (result instanceof Response) return result;
  const user = result;

  // Get usage for current month
  const usage = await env.DB.prepare(
    `SELECT tool, COUNT(*) as count, SUM(tokens_used) as total_tokens
     FROM usage_log
     WHERE user_id = ? AND created_at >= datetime('now', 'start of month')
     GROUP BY tool`
  ).bind(user.sub).all();

  return new Response(JSON.stringify({
    month: new Date().toISOString().slice(0, 7),
    tools: usage.results || [],
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
