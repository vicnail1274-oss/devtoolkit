import type { APIRoute } from 'astro';

const SITE = 'https://devtoolkit.cc';

const pages = [
  { url: '/', changefreq: 'weekly', priority: '1.0' },
  { url: '/tools/json-formatter', changefreq: 'monthly', priority: '0.8' },
  { url: '/tools/base64', changefreq: 'monthly', priority: '0.8' },
  { url: '/tools/token-counter', changefreq: 'monthly', priority: '0.8' },
  { url: '/tools/url-encode', changefreq: 'monthly', priority: '0.8' },
  { url: '/tools/cron-generator', changefreq: 'monthly', priority: '0.8' },
  { url: '/tools/markdown-to-html', changefreq: 'monthly', priority: '0.8' },
  { url: '/tools/hash-generator', changefreq: 'monthly', priority: '0.8' },
  { url: '/tools/regex-tester', changefreq: 'monthly', priority: '0.8' },
  { url: '/tools/color-converter', changefreq: 'monthly', priority: '0.8' },
  { url: '/tools/uuid-generator', changefreq: 'monthly', priority: '0.8' },
  { url: '/tools/jwt-decoder', changefreq: 'monthly', priority: '0.8' },
  { url: '/tools/timestamp-converter', changefreq: 'monthly', priority: '0.8' },
  { url: '/tools/diff-checker', changefreq: 'monthly', priority: '0.8' },
  { url: '/tools/lorem-ipsum', changefreq: 'monthly', priority: '0.8' },
  { url: '/tools/css-minifier', changefreq: 'monthly', priority: '0.8' },
  { url: '/tools/html-formatter', changefreq: 'monthly', priority: '0.8' },
  { url: '/tools/js-minifier', changefreq: 'monthly', priority: '0.8' },
  { url: '/tools/sql-formatter', changefreq: 'monthly', priority: '0.8' },
  { url: '/tools/yaml-to-json', changefreq: 'monthly', priority: '0.8' },
  { url: '/tools/password-generator', changefreq: 'monthly', priority: '0.8' },
  { url: '/tools/chmod-calculator', changefreq: 'monthly', priority: '0.8' },
  { url: '/tools/http-status-codes', changefreq: 'monthly', priority: '0.8' },
  { url: '/tools/text-case-converter', changefreq: 'monthly', priority: '0.8' },
  { url: '/tools/json-to-csv', changefreq: 'monthly', priority: '0.8' },
  { url: '/tools/number-base-converter', changefreq: 'monthly', priority: '0.8' },
  { url: '/tools/markdown-preview-editor', changefreq: 'monthly', priority: '0.8' },
  { url: '/tools/api-tester', changefreq: 'monthly', priority: '0.8' },
  { url: '/tools/json-schema-generator', changefreq: 'monthly', priority: '0.8' },
  { url: '/tools/github-readme-generator', changefreq: 'monthly', priority: '0.8' },
  { url: '/tools/ai-code-review', changefreq: 'monthly', priority: '0.8' },
  { url: '/tools/ai-doc-generator', changefreq: 'monthly', priority: '0.8' },
  { url: '/tools/ai-sql-builder', changefreq: 'monthly', priority: '0.8' },
  { url: '/pricing', changefreq: 'monthly', priority: '0.6' },
  { url: '/about', changefreq: 'monthly', priority: '0.5' },
  { url: '/newsletter', changefreq: 'monthly', priority: '0.5' },
  { url: '/blog', changefreq: 'weekly', priority: '0.7' },
  { url: '/blog/best-free-developer-tools-2026', changefreq: 'monthly', priority: '0.7' },
  { url: '/blog/json-vs-yaml-vs-toml', changefreq: 'monthly', priority: '0.7' },
  { url: '/blog/how-to-generate-secure-passwords', changefreq: 'monthly', priority: '0.7' },
  { url: '/blog/how-to-minify-javascript-without-build-tools', changefreq: 'monthly', priority: '0.7' },
  { url: '/blog/base64-encoding-explained', changefreq: 'monthly', priority: '0.7' },
  { url: '/blog/guide-to-json-formatting-and-validation', changefreq: 'monthly', priority: '0.7' },
  { url: '/blog/css-minification-why-it-matters', changefreq: 'monthly', priority: '0.7' },
  { url: '/blog/understanding-unix-file-permissions', changefreq: 'monthly', priority: '0.7' },
  { url: '/blog/devtoolkit-vs-devtoys', changefreq: 'monthly', priority: '0.7' },
  { url: '/blog/devtoolkit-vs-cyberchef', changefreq: 'monthly', priority: '0.7' },
  { url: '/blog/devtoolkit-vs-transform-tools', changefreq: 'monthly', priority: '0.7' },
  { url: '/blog/top-10-free-online-dev-tools', changefreq: 'monthly', priority: '0.7' },
  { url: '/blog/essential-ai-developer-tools-2026', changefreq: 'monthly', priority: '0.7' },
  { url: '/blog/cron-expression-cheat-sheet', changefreq: 'monthly', priority: '0.7' },
  { url: '/blog/how-to-validate-json-schema', changefreq: 'monthly', priority: '0.7' },
  { url: '/blog/rest-api-testing-guide', changefreq: 'monthly', priority: '0.7' },
  { url: '/blog/how-to-format-json-online', changefreq: 'monthly', priority: '0.7' },
  { url: '/blog/regex-tester-tutorial-beginners', changefreq: 'monthly', priority: '0.7' },
  { url: '/blog/css-color-picker-hex-rgb-converter', changefreq: 'monthly', priority: '0.7' },
  { url: '/blog/markdown-to-html-converter-free', changefreq: 'monthly', priority: '0.7' },
  { url: '/blog/cron-expression-builder-guide', changefreq: 'monthly', priority: '0.7' },
  { url: '/blog/url-encoder-decoder-online-free', changefreq: 'monthly', priority: '0.7' },
  { url: '/blog/social-media-kit', changefreq: 'monthly', priority: '0.5' },
  { url: '/changelog', changefreq: 'weekly', priority: '0.5' },
  { url: '/embed', changefreq: 'monthly', priority: '0.6' },
];

const today = new Date().toISOString().split('T')[0];

export const GET: APIRoute = () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (p) => `  <url>
    <loc>${SITE}${p.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
};
