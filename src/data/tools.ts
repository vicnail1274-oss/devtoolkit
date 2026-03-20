export interface Tool {
  title: string;
  description: string;
  href: string;
  slug: string;
  icon: string;
  category: string;
  isPro?: boolean;
}

export const categories = [
  'All',
  'Code',
  'Data',
  'Encoding',
  'Security',
  'Content',
  'DevOps',
  'Design',
  'AI',
] as const;

export type Category = (typeof categories)[number];

export const tools: Tool[] = [
  {
    title: 'JSON Formatter & Validator',
    description: 'Format, validate, and minify JSON data with syntax highlighting and error detection.',
    href: '/tools/json-formatter',
    slug: 'json-formatter',
    icon: '{ }',
    category: 'Data',
  },
  {
    title: 'LLM Token Counter',
    description: 'Count tokens for GPT, Claude, and Llama models with multi-model tiktoken support.',
    href: '/tools/token-counter',
    slug: 'token-counter',
    icon: '#',
    category: 'AI',
  },
  {
    title: 'Base64 Encode/Decode',
    description: 'Encode and decode text and files to/from Base64 format.',
    href: '/tools/base64',
    slug: 'base64',
    icon: 'B64',
    category: 'Encoding',
  },
  {
    title: 'URL Encode/Decode',
    description: 'Encode and decode URL components for safe web usage.',
    href: '/tools/url-encode',
    slug: 'url-encode',
    icon: '%',
    category: 'Encoding',
  },
  {
    title: 'Cron Expression Generator',
    description: 'Visual cron expression builder with next execution time preview.',
    href: '/tools/cron-generator',
    slug: 'cron-generator',
    icon: '\u23F0',
    category: 'DevOps',
  },
  {
    title: 'Markdown to HTML',
    description: 'Convert Markdown to HTML with live preview and syntax highlighting.',
    href: '/tools/markdown-to-html',
    slug: 'markdown-to-html',
    icon: 'MD',
    category: 'Content',
  },
  {
    title: 'Hash Generator',
    description: 'Generate SHA-256, SHA-512, SHA-1, and MD5 hashes instantly.',
    href: '/tools/hash-generator',
    slug: 'hash-generator',
    icon: '#!',
    category: 'Security',
  },
  {
    title: 'Regex Tester',
    description: 'Test and debug regular expressions with real-time highlighting, capture groups, search & replace, and shareable URLs.',
    href: '/tools/regex-tester',
    slug: 'regex-tester',
    icon: '/.*/',
    category: 'Code',
  },
  {
    title: 'Color Converter',
    description: 'Convert colors between HEX, RGB, and HSL with live preview.',
    href: '/tools/color-converter',
    slug: 'color-converter',
    icon: '\u{1F3A8}',
    category: 'Design',
  },
  {
    title: 'UUID Generator',
    description: 'Generate UUID v4 identifiers. Bulk generate up to 25 at once.',
    href: '/tools/uuid-generator',
    slug: 'uuid-generator',
    icon: 'ID',
    category: 'Data',
  },
  {
    title: 'JWT Decoder',
    description: 'Decode and inspect JWT tokens. View header, payload, and expiration.',
    href: '/tools/jwt-decoder',
    slug: 'jwt-decoder',
    icon: 'JWT',
    category: 'Security',
  },
  {
    title: 'Timestamp Converter',
    description: 'Convert Unix timestamps to human-readable dates and vice versa.',
    href: '/tools/timestamp-converter',
    slug: 'timestamp-converter',
    icon: '\u{1F552}',
    category: 'Data',
  },
  {
    title: 'Diff Checker',
    description: 'Compare two texts and highlight differences line by line.',
    href: '/tools/diff-checker',
    slug: 'diff-checker',
    icon: '\u00B1',
    category: 'Code',
  },
  {
    title: 'JSON Diff Viewer',
    description: 'Compare two JSON objects and highlight added, removed, and changed keys. Recursive, semantic diff.',
    href: '/tools/json-diff',
    slug: 'json-diff',
    icon: '{}',
    category: 'Data',
  },
  {
    title: 'Git Commit Generator',
    description: 'Generate 5 Conventional Commit message suggestions from a plain-English description of your change.',
    href: '/tools/git-commit-gen',
    slug: 'git-commit-gen',
    icon: '\u{1F500}',
    category: 'DevOps',
  },
  {
    title: 'Lorem Ipsum Generator',
    description: 'Generate configurable placeholder text by paragraphs, sentences, or words.',
    href: '/tools/lorem-ipsum',
    slug: 'lorem-ipsum',
    icon: 'Aa',
    category: 'Content',
  },
  {
    title: 'CSS Minifier',
    description: 'Minify CSS code and see file size savings instantly.',
    href: '/tools/css-minifier',
    slug: 'css-minifier',
    icon: '{ }',
    category: 'Code',
  },
  {
    title: 'HTML Formatter',
    description: 'Format, beautify, or minify HTML code with customizable indentation.',
    href: '/tools/html-formatter',
    slug: 'html-formatter',
    icon: '</>',
    category: 'Code',
  },
  {
    title: 'JavaScript Minifier',
    description: 'Minify JavaScript code and remove comments to reduce file size.',
    href: '/tools/js-minifier',
    slug: 'js-minifier',
    icon: 'JS',
    category: 'Code',
  },
  {
    title: 'SQL Formatter',
    description: 'Format and beautify SQL queries with customizable keyword casing.',
    href: '/tools/sql-formatter',
    slug: 'sql-formatter',
    icon: 'SQL',
    category: 'Data',
  },
  {
    title: 'YAML to JSON Converter',
    description: 'Convert between YAML and JSON formats instantly. Bidirectional.',
    href: '/tools/yaml-to-json',
    slug: 'yaml-to-json',
    icon: 'Y\u2194J',
    category: 'Data',
  },
  {
    title: 'Password Generator',
    description: 'Generate cryptographically secure passwords with strength meter.',
    href: '/tools/password-generator',
    slug: 'password-generator',
    icon: '\u{1F511}',
    category: 'Security',
  },
  {
    title: 'Chmod Calculator',
    description: 'Calculate Unix file permissions with visual toggles. Octal, symbolic, and command output.',
    href: '/tools/chmod-calculator',
    slug: 'chmod-calculator',
    icon: '\u{1F512}',
    category: 'DevOps',
  },
  {
    title: 'HTTP Status Codes',
    description: 'Complete HTTP status code reference with search, filters, and descriptions.',
    href: '/tools/http-status-codes',
    slug: 'http-status-codes',
    icon: '\u21A9',
    category: 'Data',
  },
  {
    title: 'Text Case Converter',
    description: 'Convert text between UPPERCASE, lowercase, camelCase, snake_case, kebab-case, and more.',
    href: '/tools/text-case-converter',
    slug: 'text-case-converter',
    icon: 'Aa',
    category: 'Content',
  },
  {
    title: 'JSON to CSV Converter',
    description: 'Convert JSON arrays to CSV and CSV to JSON. Custom delimiter support.',
    href: '/tools/json-to-csv',
    slug: 'json-to-csv',
    icon: '\u21C4',
    category: 'Data',
  },
  {
    title: 'Number Base Converter',
    description: 'Convert numbers between binary, octal, decimal, and hexadecimal instantly.',
    href: '/tools/number-base-converter',
    slug: 'number-base-converter',
    icon: '01',
    category: 'Data',
  },
  {
    title: 'JSON Schema Generator',
    description: 'Generate JSON Schema from any JSON data with type inference, required fields, and nested object support.',
    href: '/tools/json-schema-generator',
    slug: 'json-schema-generator',
    icon: '{}',
    category: 'Data',
  },
  {
    title: 'API Tester',
    description: 'Test REST APIs from your browser. Send GET, POST, PUT, DELETE requests with headers and body.',
    href: '/tools/api-tester',
    slug: 'api-tester',
    icon: '\u21C6',
    category: 'DevOps',
  },
  {
    title: 'Markdown Preview & Editor',
    description: 'Full-featured Markdown editor with live preview, GFM tables, task lists, syntax highlighting, and HTML export.',
    href: '/tools/markdown-preview-editor',
    slug: 'markdown-preview-editor',
    icon: '✍',
    category: 'Content',
  },
  {
    title: 'GitHub Profile README Generator',
    description: 'Create a stunning GitHub profile README with badges, stats, skills, and social links. 3 templates, 50+ badges.',
    href: '/tools/github-readme-generator',
    slug: 'github-readme-generator',
    icon: '📝',
    category: 'Content',
  },
  {
    title: 'Color Palette Generator',
    description: 'Generate beautiful color palettes with harmony rules, export to CSS/SCSS/Tailwind, and share via URL.',
    href: '/tools/color-palette-generator',
    slug: 'color-palette-generator',
    icon: '\u{1F3A8}',
    category: 'Design',
  },
  {
    title: 'QR Code Generator',
    description: 'Generate QR codes for text, URLs, WiFi, vCard, and email. Custom colors, sizes, PNG & SVG export.',
    href: '/tools/qr-code-generator',
    slug: 'qr-code-generator',
    icon: '\u25A3',
    category: 'Data',
  },
  {
    title: 'Open Graph Image Preview',
    description: 'Preview how your URL looks on Google, Twitter, Facebook, LinkedIn, and Slack. Debug OG meta tags instantly.',
    href: '/tools/og-image-preview',
    slug: 'og-image-preview',
    icon: '🔗',
    category: 'Content',
  },
  {
    title: 'Meta Tag Generator',
    description: 'Generate SEO meta tags with live Google, Twitter, and Facebook previews. Copy-ready HTML.',
    href: '/tools/meta-tag-generator',
    slug: 'meta-tag-generator',
    icon: '🏷',
    category: 'Content',
  },
  {
    title: 'SVG to PNG Converter',
    description: 'Convert SVG to high-quality PNG with custom dimensions, background color, and retina scaling.',
    href: '/tools/svg-to-png',
    slug: 'svg-to-png',
    icon: '🖼',
    category: 'Design',
  },
  {
    title: 'Favicon Generator',
    description: 'Generate multi-size favicons from any image with manifest.json and HTML tags.',
    href: '/tools/favicon-generator',
    slug: 'favicon-generator',
    icon: '⭐',
    category: 'Design',
  },
  {
    title: 'Code Screenshot',
    description: 'Create beautiful code screenshots with syntax highlighting, themes, and gradient backgrounds. Carbon-style.',
    href: '/tools/code-screenshot',
    slug: 'code-screenshot',
    icon: '📸',
    category: 'Code',
  },
  {
    title: 'JSON to YAML Converter',
    description: 'Convert JSON data to clean YAML format for Kubernetes, Docker Compose, and CI/CD configs.',
    href: '/tools/json-to-yaml',
    slug: 'json-to-yaml',
    icon: 'YML',
    category: 'Data',
  },
  {
    title: 'HTML to Markdown Converter',
    description: 'Convert HTML to clean Markdown with support for tables, code blocks, lists, and images.',
    href: '/tools/html-to-markdown',
    slug: 'html-to-markdown',
    icon: 'H>M',
    category: 'Content',
  },
  {
    title: 'CSS Gradient Generator',
    description: 'Create beautiful CSS gradients visually with multiple color stops, angles, and presets.',
    href: '/tools/css-gradient-generator',
    slug: 'css-gradient-generator',
    icon: '\u{1F308}',
    category: 'Design',
  },
  {
    title: 'CSS Flexbox Playground',
    description: 'Interactive CSS Flexbox playground with live preview. Experiment with flex-direction, justify-content, align-items, and more.',
    href: '/tools/css-flexbox-playground',
    slug: 'css-flexbox-playground',
    icon: '⬜',
    category: 'Design',
  },
  {
    title: 'Git Command Generator',
    description: 'Generate git commands visually. Covers branching, merging, rebasing, stashing, and advanced operations.',
    href: '/tools/git-command-generator',
    slug: 'git-command-generator',
    icon: '🔀',
    category: 'DevOps',
  },
  {
    title: 'Docker Compose Generator',
    description: 'Generate Docker Compose YAML files visually. Add services, ports, volumes, networks, and environment variables.',
    href: '/tools/docker-compose-generator',
    slug: 'docker-compose-generator',
    icon: '🐳',
    category: 'DevOps',
  },
  {
    title: 'Package.json Generator',
    description: 'Generate package.json files for Node.js projects with presets for Express, React, Next.js, and more.',
    href: '/tools/package-json-generator',
    slug: 'package-json-generator',
    icon: '📦',
    category: 'Code',
  },
  {
    title: 'Markdown Table Generator',
    description: 'Create Markdown tables visually with a spreadsheet-like editor. Set alignment, import CSV, and copy formatted output.',
    href: '/tools/markdown-table-generator',
    slug: 'markdown-table-generator',
    icon: '📊',
    category: 'Content',
  },
  {
    title: 'Tech Salary Calculator',
    description: 'Compare tech salaries by role, city, and experience level. See P25-P75 ranges with city comparison.',
    href: '/tools/tech-salary-calculator',
    slug: 'tech-salary-calculator',
    icon: '💰',
    category: 'Data',
  },
  {
    title: 'GitHub Profile Analyzer',
    description: 'Analyze any GitHub profile: contribution stats, language breakdown, repo rankings, and shareable score card.',
    href: '/tools/github-profile-analyzer',
    slug: 'github-profile-analyzer',
    icon: '🐙',
    category: 'Code',
  },
  {
    title: 'AI Cost Calculator',
    description: 'Compare API costs across OpenAI, Anthropic, Google, Meta, Mistral, and DeepSeek models for any workload.',
    href: '/tools/ai-cost-calculator',
    slug: 'ai-cost-calculator',
    icon: '🧮',
    category: 'AI',
  },
  {
    title: 'AI Code Review',
    description: 'Get instant AI-powered code reviews with bug detection, security analysis, and performance tips.',
    href: '/tools/ai-code-review',
    slug: 'ai-code-review',
    icon: '\u{1F916}',
    category: 'AI',
    isPro: true,
  },
  {
    title: 'AI Doc Generator',
    description: 'Auto-generate JSDoc, TSDoc, Python docstrings, and OpenAPI specs from your code.',
    href: '/tools/ai-doc-generator',
    slug: 'ai-doc-generator',
    icon: '\u{1F4DD}',
    category: 'AI',
    isPro: true,
  },
  {
    title: 'AI SQL Builder',
    description: 'Convert natural language to optimized SQL queries with schema-aware generation.',
    href: '/tools/ai-sql-builder',
    slug: 'ai-sql-builder',
    icon: '\u{1F5C4}',
    category: 'AI',
    isPro: true,
  },
];

export const freeTools = tools.filter((t) => !t.isPro);
export const proTools = tools.filter((t) => t.isPro);

export function getToolBySlug(slug: string): Tool | undefined {
  return tools.find((t) => t.slug === slug);
}

// Maps blog post slugs to relevant tool slugs for cross-linking
export const blogToolMap: Record<string, string[]> = {
  'how-to-format-json-online': ['json-formatter', 'json-to-csv', 'json-schema-generator', 'yaml-to-json'],
  'guide-to-json-formatting-and-validation': ['json-formatter', 'json-schema-generator', 'json-to-csv'],
  'how-to-validate-json-schema': ['json-schema-generator', 'json-formatter', 'yaml-to-json'],
  'json-vs-yaml-vs-toml': ['yaml-to-json', 'json-to-yaml', 'json-formatter', 'json-schema-generator'],
  'regex-cheat-sheet': ['regex-tester', 'diff-checker'],
  'regex-tester-tutorial-beginners': ['regex-tester', 'diff-checker'],
  'base64-encoding-explained': ['base64', 'url-encode', 'hash-generator'],
  'url-encoder-decoder-online-free': ['url-encode', 'base64', 'hash-generator'],
  'cron-expression-cheat-sheet': ['cron-generator', 'chmod-calculator'],
  'cron-expression-builder-guide': ['cron-generator', 'chmod-calculator'],
  'jwt-token-explained': ['jwt-decoder', 'base64', 'hash-generator', 'password-generator'],
  'how-to-generate-secure-passwords': ['password-generator', 'hash-generator', 'jwt-decoder'],
  'understanding-unix-file-permissions': ['chmod-calculator', 'cron-generator'],
  'http-status-codes-reference': ['http-status-codes', 'api-tester'],
  'rest-api-testing-guide': ['api-tester', 'json-formatter', 'http-status-codes'],
  'markdown-to-html-converter-free': ['markdown-to-html', 'html-to-markdown', 'markdown-preview-editor', 'html-formatter'],
  'css-minification-why-it-matters': ['css-minifier', 'js-minifier', 'html-formatter'],
  'how-to-minify-javascript-without-build-tools': ['js-minifier', 'css-minifier', 'html-formatter'],
  'css-color-picker-hex-rgb-converter': ['color-converter', 'color-palette-generator', 'css-gradient-generator'],
  'sql-formatting-best-practices': ['sql-formatter', 'ai-sql-builder'],
  'open-graph-tags-complete-guide': ['og-image-preview', 'meta-tag-generator', 'favicon-generator'],
  'how-to-create-qr-codes': ['qr-code-generator', 'svg-to-png'],
  'uuid-vs-ulid': ['uuid-generator', 'hash-generator'],
  'best-free-developer-tools-2026': ['json-formatter', 'regex-tester', 'base64', 'cron-generator', 'tech-salary-calculator'],
  'top-10-free-online-dev-tools': ['json-formatter', 'regex-tester', 'base64', 'cron-generator', 'github-profile-analyzer'],
  'essential-ai-developer-tools-2026': ['ai-code-review', 'ai-doc-generator', 'ai-sql-builder', 'token-counter', 'ai-cost-calculator'],
  'devtoolkit-vs-cyberchef': ['json-formatter', 'base64', 'hash-generator', 'url-encode'],
  'devtoolkit-vs-devtoys': ['json-formatter', 'uuid-generator', 'hash-generator', 'base64'],
  'devtoolkit-vs-transform-tools': ['json-formatter', 'yaml-to-json', 'base64', 'css-minifier'],
};

export function getToolsForBlog(blogSlug: string, count = 3): Tool[] {
  const slugs = blogToolMap[blogSlug];
  if (!slugs) return [];
  return slugs
    .map((s) => tools.find((t) => t.slug === s))
    .filter((t): t is Tool => !!t)
    .slice(0, count);
}

export function getRelatedTools(slug: string, count = 4): Tool[] {
  const current = getToolBySlug(slug);
  if (!current) return [];
  const sameCategory = tools.filter(
    (t) => t.slug !== slug && t.category === current.category
  );
  if (sameCategory.length >= count) return sameCategory.slice(0, count);
  const others = tools.filter(
    (t) => t.slug !== slug && t.category !== current.category
  );
  return [...sameCategory, ...others].slice(0, count);
}
