# DevToolkit

[![Live Site](https://img.shields.io/badge/Live-devtoolkit.cc-blue)](https://devtoolkit.cc)
[![Built with Astro](https://img.shields.io/badge/Astro-4.0-BC52EE?logo=astro)](https://astro.build)
[![Preact](https://img.shields.io/badge/Preact-10-673AB8?logo=preact)](https://preactjs.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![Cloudflare Pages](https://img.shields.io/badge/Deployed-Cloudflare%20Pages-F38020?logo=cloudflare)](https://pages.cloudflare.com)

**30+ free online developer tools.** No signup, no tracking, 100% client-side.

> **[devtoolkit.cc](https://devtoolkit.cc)** — JSON, Base64, UUID, Hash, Regex, JWT, Cron & more.

## Tools

| Category | Tools |
|----------|-------|
| **Data** | JSON Formatter & Validator, JSON Schema Generator |
| **Encoding** | Base64 Encode/Decode, URL Encode/Decode |
| **Generators** | UUID Generator (bulk), Hash Generator (SHA-256/512/MD5), Cron Expression Builder |
| **Testing** | Regex Tester (with presets), API Tester |
| **Converters** | Color Converter (HEX/RGB/HSL), Timestamp Converter, Markdown → HTML |
| **AI/LLM** | LLM Token Counter (GPT, Claude, Llama) |
| **Auth** | JWT Decoder (header/payload/claims + expiry) |

## Tech Stack

- **[Astro 4](https://astro.build)** — Static HTML generation, near-instant page loads
- **[Preact](https://preactjs.com)** — ~3KB interactive islands for tool UIs
- **[Tailwind CSS](https://tailwindcss.com)** — Utility-first styling with dark mode
- **[Cloudflare Pages](https://pages.cloudflare.com)** — Free global CDN hosting

## Features

- **Zero backend** — all tools run client-side, no data leaves the browser
- **Dark mode** — respects `prefers-color-scheme`, manual toggle available
- **SEO optimized** — sitemap, JSON-LD, Open Graph, Twitter Cards, canonical URLs
- **Mobile-first** — responsive design, touch-friendly
- **Lighthouse 95+** — optimized Core Web Vitals
- **Blog** — comparison articles and developer guides for organic traffic
- **Embeddable** — widget system to embed tools via iframe

## Quick Start

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # Generate static site
npm run preview    # Preview production build
```

## NPM Package

The core utilities are also available as a standalone package:

```bash
npm install devtoolkit-utils
```

```typescript
import { formatJson, base64Encode, generateUuid, sha256 } from 'devtoolkit-utils';
```

Zero dependencies. TypeScript. Works in Node.js, Deno, Bun, and browsers.

📦 [devtoolkit-utils on NPM](https://www.npmjs.com/package/devtoolkit-utils) · [GitHub](https://github.com/devtoolkit-cc/devtoolkit-utils)

## Starter Kit

Want to launch your own developer tools site? The **[DevToolkit Starter Kit](https://vicnail.gumroad.com/l/devtoolkit)** ($9) includes the full source code, deployment guide, and customization instructions.

## License

Commercial. See [LICENSE](LICENSE) for details.
