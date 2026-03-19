// POST /api/ai/code-review — AI-powered code review (Pro only)
import type { Env } from '../_shared/types';
import { requirePro, generateId } from '../_shared/auth';

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  const result = await requirePro(request, env);
  if (result instanceof Response) return result;
  const user = result;

  const { code, language } = await request.json() as { code: string; language: string };

  if (!code?.trim()) {
    return new Response(JSON.stringify({ error: 'Code is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (code.length > 50000) {
    return new Response(JSON.stringify({ error: 'Code too long (max 50,000 characters)' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const systemPrompt = `You are an expert code reviewer. Analyze the following ${language} code and provide a structured review with:
1. **Bugs & Issues** — potential bugs, logic errors, race conditions
2. **Security** — vulnerabilities, injection risks, auth issues
3. **Performance** — inefficiencies, unnecessary allocations, O(n) improvements
4. **Best Practices** — naming, structure, patterns, idiomatic usage
5. **Summary** — overall assessment with a quality score (1-10)

Be specific with line references. Be concise but thorough.`;

  const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': env.AI_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: env.AI_MODEL || 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{ role: 'user', content: `\`\`\`${language}\n${code}\n\`\`\`` }],
      system: systemPrompt,
    }),
  });

  if (!aiRes.ok) {
    return new Response(JSON.stringify({ error: 'AI service unavailable' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const aiData = await aiRes.json() as { content: Array<{ text: string }>; usage: { input_tokens: number; output_tokens: number } };
  const review = aiData.content[0]?.text || '';
  const tokensUsed = (aiData.usage?.input_tokens || 0) + (aiData.usage?.output_tokens || 0);

  // Log usage
  await env.DB.prepare(
    'INSERT INTO usage_log (user_id, tool, tokens_used) VALUES (?, ?, ?)'
  ).bind(user.sub, 'code-review', tokensUsed).run();

  return new Response(JSON.stringify({ review, tokensUsed }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
