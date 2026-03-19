// POST /api/ai/doc-generator — AI documentation generator (Pro only)
import type { Env } from '../_shared/types';
import { requirePro } from '../_shared/auth';

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  const result = await requirePro(request, env);
  if (result instanceof Response) return result;
  const user = result;

  const { code, style } = await request.json() as { code: string; style: string };

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

  const styleMap: Record<string, string> = {
    jsdoc: 'JSDoc format with @param, @returns, @example tags',
    tsdoc: 'TSDoc format with @param, @returns, @example tags',
    python: 'Python docstrings (Google style) with Args, Returns, Examples sections',
    markdown: 'Markdown README with Overview, Installation, API Reference, Examples sections',
    openapi: 'OpenAPI 3.0 YAML specification',
  };

  const systemPrompt = `You are a documentation expert. Generate comprehensive documentation for the provided code in ${styleMap[style] || 'JSDoc format'}.

Requirements:
- Document all public functions, classes, and methods
- Include parameter types and descriptions
- Add return type descriptions
- Include usage examples
- Be thorough but concise

Output ONLY the documentation, no explanations.`;

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
      messages: [{ role: 'user', content: `Generate ${style} documentation for:\n\n\`\`\`\n${code}\n\`\`\`` }],
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
  const documentation = aiData.content[0]?.text || '';
  const tokensUsed = (aiData.usage?.input_tokens || 0) + (aiData.usage?.output_tokens || 0);

  await env.DB.prepare(
    'INSERT INTO usage_log (user_id, tool, tokens_used) VALUES (?, ?, ?)'
  ).bind(user.sub, 'doc-generator', tokensUsed).run();

  return new Response(JSON.stringify({ documentation, tokensUsed }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
