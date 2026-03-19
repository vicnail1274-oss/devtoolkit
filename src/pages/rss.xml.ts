import type { APIRoute } from 'astro';

const SITE = 'https://devplaybook.cc';

const posts = [
  {
    title: 'How to Validate JSON Schema: A Complete Developer Guide',
    description: 'Learn how to validate JSON Schema — types, required fields, nested objects, $ref, composition, and free tools to generate schemas instantly.',
    slug: 'how-to-validate-json-schema',
    date: '2026-03-19',
  },
  {
    title: 'Cron Expression Cheat Sheet & Examples',
    description: 'The ultimate cron expression reference — syntax breakdown, real-world examples, special characters, and scheduling patterns for every use case.',
    slug: 'cron-expression-cheat-sheet',
    date: '2026-03-19',
  },
  {
    title: 'REST API Testing Guide for Beginners',
    description: 'Learn how to test REST APIs — HTTP methods, status codes, headers, authentication, and hands-on examples with curl and online tools.',
    slug: 'rest-api-testing-guide',
    date: '2026-03-19',
  },
  {
    title: 'DevToolkit vs DevToys: Which Developer Utility Suite Is Better?',
    description: 'A detailed comparison of DevToolkit and DevToys — features, platform support, AI tools, and which is right for you.',
    slug: 'devtoolkit-vs-devtoys',
    date: '2026-03-19',
  },
  {
    title: 'DevToolkit vs CyberChef: Developer Tools Comparison',
    description: 'Compare DevToolkit and CyberChef — UX, tool coverage, AI capabilities, and modern developer workflow integration.',
    slug: 'devtoolkit-vs-cyberchef',
    date: '2026-03-19',
  },
  {
    title: 'DevToolkit vs Transform.tools: Online Dev Tools Head-to-Head',
    description: 'A head-to-head comparison of DevToolkit and Transform.tools — tool breadth, AI features, mobile experience, and pricing.',
    slug: 'devtoolkit-vs-transform-tools',
    date: '2026-03-19',
  },
  {
    title: 'Top 10 Free Online Developer Tools Every Programmer Needs',
    description: 'The top 10 free online developer tools for formatting, testing, encoding, and security — all browser-based, no signup.',
    slug: 'top-10-free-online-dev-tools',
    date: '2026-03-19',
  },
  {
    title: 'Essential AI-Powered Developer Tools in 2026',
    description: 'The essential AI developer tools for code review, documentation, SQL generation, and more in 2026.',
    slug: 'essential-ai-developer-tools-2026',
    date: '2026-03-19',
  },
  {
    title: 'Best Free Online Developer Tools in 2026',
    description: 'A curated list of the best free online developer tools for formatting, encoding, security, and AI-powered development.',
    slug: 'best-free-developer-tools-2026',
    date: '2026-03-18',
  },
  {
    title: 'JSON vs YAML vs TOML: Complete Comparison Guide',
    description: 'An in-depth comparison of JSON, YAML, and TOML configuration formats — syntax, use cases, strengths, and when to use each.',
    slug: 'json-vs-yaml-vs-toml',
    date: '2026-03-18',
  },
  {
    title: 'How to Generate Secure Passwords: A Developer Guide',
    description: 'Learn how to generate, store, and manage secure passwords using cryptographic best practices and modern tools.',
    slug: 'how-to-generate-secure-passwords',
    date: '2026-03-18',
  },
  {
    title: 'How to Minify JavaScript Without Build Tools',
    description: 'Learn how to minify JavaScript without webpack, Vite, or any build system. Techniques for quick minification.',
    slug: 'how-to-minify-javascript-without-build-tools',
    date: '2026-03-18',
  },
  {
    title: 'Base64 Encoding Explained: When and Why to Use It',
    description: 'A practical guide to Base64 encoding — what it is, how it works, when to use it, and common pitfalls.',
    slug: 'base64-encoding-explained',
    date: '2026-03-18',
  },
  {
    title: 'A Developer Guide to JSON Formatting and Validation',
    description: 'Everything you need to know about JSON formatting, validation, common errors, and best practices.',
    slug: 'guide-to-json-formatting-and-validation',
    date: '2026-03-18',
  },
  {
    title: 'CSS Minification: Why It Matters and How to Do It',
    description: 'Why CSS minification improves web performance, how minifiers work, and the best tools for minifying CSS.',
    slug: 'css-minification-why-it-matters',
    date: '2026-03-18',
  },
  {
    title: 'Understanding Unix File Permissions: A Practical Guide',
    description: 'Master Unix file permissions — chmod, octal notation, symbolic notation, and common permission patterns.',
    slug: 'understanding-unix-file-permissions',
    date: '2026-03-18',
  },
];

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const GET: APIRoute = () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>DevToolkit Blog</title>
    <description>Developer guides, tutorials, and tool comparisons from DevToolkit.</description>
    <link>${SITE}/blog</link>
    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml" />
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${posts
  .map(
    (p) => `    <item>
      <title>${escapeXml(p.title)}</title>
      <description>${escapeXml(p.description)}</description>
      <link>${SITE}/blog/${p.slug}</link>
      <guid isPermaLink="true">${SITE}/blog/${p.slug}</guid>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
    </item>`
  )
  .join('\n')}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
