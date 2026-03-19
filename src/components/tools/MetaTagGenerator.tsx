import { useState, useCallback } from 'preact/hooks';

interface MetaConfig {
  title: string;
  description: string;
  keywords: string;
  author: string;
  url: string;
  image: string;
  siteName: string;
  twitterHandle: string;
  ogType: string;
  robots: string;
  viewport: string;
  charset: string;
  themeColor: string;
  language: string;
}

const defaultConfig: MetaConfig = {
  title: '',
  description: '',
  keywords: '',
  author: '',
  url: '',
  image: '',
  siteName: '',
  twitterHandle: '',
  ogType: 'website',
  robots: 'index, follow',
  viewport: 'width=device-width, initial-scale=1.0',
  charset: 'UTF-8',
  themeColor: '#ffffff',
  language: 'en',
};

export default function MetaTagGenerator() {
  const [config, setConfig] = useState<MetaConfig>({ ...defaultConfig });
  const [copied, setCopied] = useState(false);
  const [activePreview, setActivePreview] = useState<'google' | 'twitter' | 'facebook'>('google');

  const update = (key: keyof MetaConfig, val: string) => {
    setConfig((prev) => ({ ...prev, [key]: val }));
  };

  const generateTags = useCallback((): string => {
    const lines: string[] = [];
    lines.push(`<meta charset="${config.charset}" />`);
    lines.push(`<meta name="viewport" content="${config.viewport}" />`);
    if (config.title) lines.push(`<title>${config.title}</title>`);
    if (config.description) lines.push(`<meta name="description" content="${config.description}" />`);
    if (config.keywords) lines.push(`<meta name="keywords" content="${config.keywords}" />`);
    if (config.author) lines.push(`<meta name="author" content="${config.author}" />`);
    if (config.robots) lines.push(`<meta name="robots" content="${config.robots}" />`);
    if (config.themeColor) lines.push(`<meta name="theme-color" content="${config.themeColor}" />`);
    if (config.language) lines.push(`<link rel="canonical" href="${config.url || 'https://example.com'}" />`);

    // OG tags
    lines.push('');
    lines.push('<!-- Open Graph -->');
    if (config.title) lines.push(`<meta property="og:title" content="${config.title}" />`);
    if (config.description) lines.push(`<meta property="og:description" content="${config.description}" />`);
    lines.push(`<meta property="og:type" content="${config.ogType}" />`);
    if (config.url) lines.push(`<meta property="og:url" content="${config.url}" />`);
    if (config.image) lines.push(`<meta property="og:image" content="${config.image}" />`);
    if (config.siteName) lines.push(`<meta property="og:site_name" content="${config.siteName}" />`);

    // Twitter
    lines.push('');
    lines.push('<!-- Twitter Card -->');
    lines.push(`<meta name="twitter:card" content="summary_large_image" />`);
    if (config.title) lines.push(`<meta name="twitter:title" content="${config.title}" />`);
    if (config.description) lines.push(`<meta name="twitter:description" content="${config.description}" />`);
    if (config.image) lines.push(`<meta name="twitter:image" content="${config.image}" />`);
    if (config.twitterHandle) lines.push(`<meta name="twitter:site" content="${config.twitterHandle}" />`);

    return lines.join('\n');
  }, [config]);

  const handleCopy = async () => {
    const text = generateTags();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayDomain = (u: string) => {
    try { return new URL(u).hostname; } catch { return u || 'example.com'; }
  };

  const handleLoadSample = () => {
    setConfig({
      title: 'My Awesome Website - Best Tools for Developers',
      description: 'Discover the best free developer tools for formatting, encoding, and debugging. No signup required.',
      keywords: 'developer tools, JSON formatter, Base64, regex tester',
      author: 'DevToolkit Team',
      url: 'https://devtoolkit.cc',
      image: 'https://devtoolkit.cc/og-default.png',
      siteName: 'DevToolkit',
      twitterHandle: '@devtoolkit',
      ogType: 'website',
      robots: 'index, follow',
      viewport: 'width=device-width, initial-scale=1.0',
      charset: 'UTF-8',
      themeColor: '#6366f1',
      language: 'en',
    });
  };

  const charCount = config.title.length;
  const descCount = config.description.length;

  return (
    <div class="space-y-6">
      {/* Input form */}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Page Information</h3>
            <button onClick={handleLoadSample} class="text-xs text-primary-600 hover:underline">Load Sample</button>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Title <span class={`${charCount > 60 ? 'text-red-500' : 'text-gray-400'}`}>({charCount}/60)</span>
            </label>
            <input
              type="text"
              value={config.title}
              onInput={(e) => update('title', (e.target as HTMLInputElement).value)}
              placeholder="My Awesome Website"
              class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Description <span class={`${descCount > 160 ? 'text-red-500' : 'text-gray-400'}`}>({descCount}/160)</span>
            </label>
            <textarea
              value={config.description}
              onInput={(e) => update('description', (e.target as HTMLTextAreaElement).value)}
              placeholder="A brief description of your page..."
              rows={3}
              class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Keywords</label>
            <input
              type="text"
              value={config.keywords}
              onInput={(e) => update('keywords', (e.target as HTMLInputElement).value)}
              placeholder="keyword1, keyword2, keyword3"
              class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">URL</label>
              <input
                type="text"
                value={config.url}
                onInput={(e) => update('url', (e.target as HTMLInputElement).value)}
                placeholder="https://example.com"
                class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Author</label>
              <input
                type="text"
                value={config.author}
                onInput={(e) => update('author', (e.target as HTMLInputElement).value)}
                placeholder="Author Name"
                class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">OG Image URL</label>
            <input
              type="text"
              value={config.image}
              onInput={(e) => update('image', (e.target as HTMLInputElement).value)}
              placeholder="https://example.com/og-image.png"
              class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Site Name</label>
              <input
                type="text"
                value={config.siteName}
                onInput={(e) => update('siteName', (e.target as HTMLInputElement).value)}
                placeholder="My Site"
                class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Twitter Handle</label>
              <input
                type="text"
                value={config.twitterHandle}
                onInput={(e) => update('twitterHandle', (e.target as HTMLInputElement).value)}
                placeholder="@handle"
                class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">OG Type</label>
              <select
                value={config.ogType}
                onChange={(e) => update('ogType', (e.target as HTMLSelectElement).value)}
                class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option value="website">website</option>
                <option value="article">article</option>
                <option value="product">product</option>
                <option value="profile">profile</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Robots</label>
              <select
                value={config.robots}
                onChange={(e) => update('robots', (e.target as HTMLSelectElement).value)}
                class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option value="index, follow">index, follow</option>
                <option value="noindex, follow">noindex, follow</option>
                <option value="index, nofollow">index, nofollow</option>
                <option value="noindex, nofollow">noindex, nofollow</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Theme Color</label>
              <input
                type="color"
                value={config.themeColor}
                onInput={(e) => update('themeColor', (e.target as HTMLInputElement).value)}
                class="w-full h-9 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div class="space-y-4">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Live Preview</h3>

          <div class="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {(['google', 'twitter', 'facebook'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActivePreview(tab)}
                class={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${
                  activePreview === tab
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {tab === 'twitter' ? 'X / Twitter' : tab}
              </button>
            ))}
          </div>

          {activePreview === 'google' && (
            <div class="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div class="space-y-1">
                <p class="text-sm text-green-700 dark:text-green-500">{displayDomain(config.url)}</p>
                <p class="text-lg text-blue-700 dark:text-blue-400 font-medium leading-snug line-clamp-1">
                  {config.title || 'Your Page Title'}
                </p>
                <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {config.description || 'Your page description will appear here...'}
                </p>
              </div>
            </div>
          )}

          {activePreview === 'twitter' && (
            <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {config.image && (
                <div class="aspect-[2/1] bg-gray-100 dark:bg-gray-700 overflow-hidden">
                  <img src={config.image} alt="Preview" class="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
              )}
              <div class="p-3 border-t border-gray-200 dark:border-gray-700">
                <p class="text-xs text-gray-500">{displayDomain(config.url)}</p>
                <p class="text-sm font-medium text-gray-900 dark:text-gray-100 mt-0.5 line-clamp-1">{config.title || 'Title'}</p>
                <p class="text-xs text-gray-500 mt-0.5 line-clamp-2">{config.description || 'Description'}</p>
              </div>
            </div>
          )}

          {activePreview === 'facebook' && (
            <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              {config.image && (
                <div class="aspect-[1.91/1] bg-gray-100 dark:bg-gray-700 overflow-hidden">
                  <img src={config.image} alt="Preview" class="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
              )}
              <div class="p-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                <p class="text-xs text-gray-500 uppercase">{displayDomain(config.url)}</p>
                <p class="text-sm font-bold text-gray-900 dark:text-gray-100 mt-1 line-clamp-1">{config.title || 'Title'}</p>
                <p class="text-xs text-gray-500 mt-1 line-clamp-1">{config.description || 'Description'}</p>
              </div>
            </div>
          )}

          {/* Score */}
          <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 class="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-2">SEO Score</h4>
            <div class="space-y-1.5">
              {[
                { label: 'Title', ok: config.title.length > 0 && config.title.length <= 60, tip: '10-60 chars' },
                { label: 'Description', ok: config.description.length > 0 && config.description.length <= 160, tip: '50-160 chars' },
                { label: 'OG Image', ok: !!config.image, tip: 'Recommended 1200x630px' },
                { label: 'Canonical URL', ok: !!config.url, tip: 'Full URL with https://' },
                { label: 'Twitter Card', ok: !!config.twitterHandle || !!config.title, tip: 'Title required' },
              ].map((item) => (
                <div key={item.label} class="flex items-center gap-2 text-xs">
                  <span class={item.ok ? 'text-green-500' : 'text-gray-400'}>{item.ok ? '\u2713' : '\u25CB'}</span>
                  <span class="text-gray-700 dark:text-gray-300">{item.label}</span>
                  <span class="text-gray-400 ml-auto">{item.tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Generated code */}
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Generated Meta Tags</h3>
          <button
            onClick={handleCopy}
            class="px-3 py-1 text-xs font-medium bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
        </div>
        <pre class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs font-mono text-gray-700 dark:text-gray-300 overflow-x-auto whitespace-pre-wrap border border-gray-200 dark:border-gray-700">
          {generateTags()}
        </pre>
      </div>

      {/* Branding */}
      <p class="text-center text-xs text-gray-400 dark:text-gray-600">
        Made with <a href="https://devtoolkit.cc" class="text-primary-500 hover:underline">DevToolkit</a>
      </p>
    </div>
  );
}
