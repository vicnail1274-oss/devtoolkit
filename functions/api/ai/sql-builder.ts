// POST /api/ai/sql-builder — AI SQL query builder (Pro only)
import type { Env } from '../_shared/types';
import { requirePro } from '../_shared/auth';

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  const result = await requirePro(request, env);
  if (result instanceof Response) return result;
  const user = result;

  const { prompt, schema, dialect } = await request.json() as {
    prompt: string;
    schema: string;
    dialect: string;
  };

  if (!prompt?.trim()) {
    return new Response(JSON.stringify({ error: 'Query description is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const dialectMap: Record<string, string> = {
    postgresql: 'PostgreSQL',
    mysql: 'MySQL',
    sqlite: 'SQLite',
    mssql: 'SQL Server (T-SQL)',
    oracle: 'Oracle SQL',
  };

  const dbDialect = dialectMap[dialect] || 'PostgreSQL';

  const systemPrompt = `You are a SQL expert. Generate an optimized ${dbDialect} query based on the user's natural language description.

${schema ? `Database schema:\n\`\`\`sql\n${schema}\n\`\`\`\n` : ''}
Requirements:
- Use proper ${dbDialect} syntax
- Optimize for performance (proper JOINs, indexes, etc.)
- Add brief SQL comments explaining complex parts
- If the schema is provided, use exact table/column names from it
- Output the SQL query in a code block, followed by a brief explanation

Output format:
1. The SQL query
2. Brief explanation of the approach
3. Performance notes (if relevant)`;

  const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': env.AI_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: env.AI_MODEL || 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
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
  const result2 = aiData.content[0]?.text || '';
  const tokensUsed = (aiData.usage?.input_tokens || 0) + (aiData.usage?.output_tokens || 0);

  await env.DB.prepare(
    'INSERT INTO usage_log (user_id, tool, tokens_used) VALUES (?, ?, ?)'
  ).bind(user.sub, 'sql-builder', tokensUsed).run();

  return new Response(JSON.stringify({ query: result2, tokensUsed }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
