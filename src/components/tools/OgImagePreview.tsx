import { useState, useCallback } from 'preact/hooks';

export default function OgImagePreview() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ogData, setOgData] = useState<{
    title?: string;
    description?: string;
    image?: string;
    siteName?: string;
    type?: string;
    url?: string;
    twitterCard?: string;
    twitterTitle?: string;
    twitterDescription?: string;
    twitterImage?: string;
  } | null>(null);
  const [rawHtml, setRawHtml] = useState('');
  const [activePreview, setActivePreview] = useState<'google' | 'twitter' | 'facebook' | 'linkedin' | 'slack'>('google');
  const [manualMode, setManualMode] = useState(false);
  const [manualOg, setManualOg] = useState({
    title: '',
    description: '',
    image: '',
    siteName: '',
    url: '',
  });

  const parseOgTags = useCallback((html: string, inputUrl: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const getMeta = (prop: string): string => {
      const el =
        doc.querySelector(`meta[property="${prop}"]`) ||
        doc.querySelector(`meta[name="${prop}"]`);
      return el?.getAttribute('content') || '';
    };

    const title = getMeta('og:title') || doc.querySelector('title')?.textContent || '';
    const description = getMeta('og:description') || getMeta('description') || '';
    const image = getMeta('og:image') || '';
    const siteName = getMeta('og:site_name') || '';
    const type = getMeta('og:type') || 'website';
    const ogUrl = getMeta('og:url') || inputUrl;
    const twitterCard = getMeta('twitter:card') || 'summary_large_image';
    const twitterTitle = getMeta('twitter:title') || title;
    const twitterDescription = getMeta('twitter:description') || description;
    const twitterImage = getMeta('twitter:image') || image;

    return {
      title,
      description,
      image,
      siteName,
      type,
      url: ogUrl,
      twitterCard,
      twitterTitle,
      twitterDescription,
      twitterImage,
    };
  }, []);

  const handleFetch = useCallback(async () => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }
    let testUrl = url.trim();
    if (!/^https?:\/\//i.test(testUrl)) testUrl = 'https://' + testUrl;
    try {
      new URL(testUrl);
    } catch {
      setError('Invalid URL format');
      return;
    }

    setLoading(true);
    setError('');
    setOgData(null);
    setRawHtml('');

    try {
      // Use a CORS proxy to fetch the page
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(testUrl)}`;
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      setRawHtml(html);
      const data = parseOgTags(html, testUrl);
      setOgData(data);
    } catch (e: any) {
      setError(
        `Could not fetch URL. This may be due to CORS restrictions. Try the manual mode below, or paste your HTML source directly.`
      );
    } finally {
      setLoading(false);
    }
  }, [url, parseOgTags]);

  const handlePasteHtml = useCallback(() => {
    if (!rawHtml.trim()) {
      setError('Please paste HTML source code');
      return;
    }
    setError('');
    const data = parseOgTags(rawHtml, url || 'https://example.com');
    setOgData(data);
  }, [rawHtml, url, parseOgTags]);

  const handleManualPreview = useCallback(() => {
    setOgData({
      title: manualOg.title,
      description: manualOg.description,
      image: manualOg.image,
      siteName: manualOg.siteName,
      url: manualOg.url || 'https://example.com',
      type: 'website',
      twitterCard: 'summary_large_image',
      twitterTitle: manualOg.title,
      twitterDescription: manualOg.description,
      twitterImage: manualOg.image,
    });
  }, [manualOg]);

  const displayDomain = (u: string) => {
    try {
      return new URL(u).hostname;
    } catch {
      return u;
    }
  };

  const d = ogData;

  const previewTabs = [
    { id: 'google' as const, label: 'Google' },
    { id: 'twitter' as const, label: 'X / Twitter' },
    { id: 'facebook' as const, label: 'Facebook' },
    { id: 'linkedin' as const, label: 'LinkedIn' },
    { id: 'slack' as const, label: 'Slack' },
  ];

  const generateMetaTags = () => {
    if (!d) return '';
    const lines = [];
    if (d.title) lines.push(`<meta property="og:title" content="${d.title}" />`);
    if (d.description) lines.push(`<meta property="og:description" content="${d.description}" />`);
    if (d.image) lines.push(`<meta property="og:image" content="${d.image}" />`);
    if (d.url) lines.push(`<meta property="og:url" content="${d.url}" />`);
    if (d.siteName) lines.push(`<meta property="og:site_name" content="${d.siteName}" />`);
    lines.push(`<meta property="og:type" content="${d.type || 'website'}" />`);
    if (d.twitterCard) lines.push(`<meta name="twitter:card" content="${d.twitterCard}" />`);
    if (d.twitterTitle) lines.push(`<meta name="twitter:title" content="${d.twitterTitle}" />`);
    if (d.twitterDescription) lines.push(`<meta name="twitter:description" content="${d.twitterDescription}" />`);
    if (d.twitterImage) lines.push(`<meta name="twitter:image" content="${d.twitterImage}" />`);
    return lines.join('\n');
  };

  const [copiedMeta, setCopiedMeta] = useState(false);
  const handleCopyMeta = async () => {
    const text = generateMetaTags();
    if (!text) return;
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
    setCopiedMeta(true);
    setTimeout(() => setCopiedMeta(false), 2000);
  };

  return (
    <div class="space-y-6">
      {/* Mode toggle */}
      <div class="flex gap-2">
        <button
          onClick={() => setManualMode(false)}
          class={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            !manualMode
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Fetch URL
        </button>
        <button
          onClick={() => setManualMode(true)}
          class={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            manualMode
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Manual Input
        </button>
      </div>

      {!manualMode ? (
        <div class="space-y-4">
          {/* URL input */}
          <div class="flex gap-2">
            <input
              type="text"
              value={url}
              onInput={(e) => setUrl((e.target as HTMLInputElement).value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
              placeholder="https://example.com"
              class="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
            <button
              onClick={handleFetch}
              disabled={loading}
              class="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {loading ? 'Fetching...' : 'Preview'}
            </button>
          </div>

          {/* Paste HTML fallback */}
          <details class="text-sm">
            <summary class="cursor-pointer text-gray-500 dark:text-gray-400 hover:text-primary-600">
              Or paste HTML source directly
            </summary>
            <div class="mt-2 space-y-2">
              <textarea
                value={rawHtml}
                onInput={(e) => setRawHtml((e.target as HTMLTextAreaElement).value)}
                placeholder="Paste your page's HTML source here..."
                class="w-full h-32 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs font-mono focus:ring-2 focus:ring-primary-500 outline-none"
              />
              <button
                onClick={handlePasteHtml}
                class="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Parse HTML
              </button>
            </div>
          </details>
        </div>
      ) : (
        <div class="space-y-3">
          <input
            type="text"
            value={manualOg.title}
            onInput={(e) => setManualOg({ ...manualOg, title: (e.target as HTMLInputElement).value })}
            placeholder="og:title"
            class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          />
          <textarea
            value={manualOg.description}
            onInput={(e) => setManualOg({ ...manualOg, description: (e.target as HTMLTextAreaElement).value })}
            placeholder="og:description"
            rows={2}
            class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          />
          <input
            type="text"
            value={manualOg.image}
            onInput={(e) => setManualOg({ ...manualOg, image: (e.target as HTMLInputElement).value })}
            placeholder="og:image URL"
            class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          />
          <div class="flex gap-2">
            <input
              type="text"
              value={manualOg.siteName}
              onInput={(e) => setManualOg({ ...manualOg, siteName: (e.target as HTMLInputElement).value })}
              placeholder="og:site_name"
              class="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
            <input
              type="text"
              value={manualOg.url}
              onInput={(e) => setManualOg({ ...manualOg, url: (e.target as HTMLInputElement).value })}
              placeholder="og:url"
              class="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <button
            onClick={handleManualPreview}
            class="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Generate Preview
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div class="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Previews */}
      {d && (
        <div class="space-y-4">
          {/* Preview tabs */}
          <div class="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {previewTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActivePreview(tab.id)}
                class={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activePreview === tab.id
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Google Preview */}
          {activePreview === 'google' && (
            <div class="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <p class="text-xs text-gray-500 mb-1">Google Search Preview</p>
              <div class="space-y-1">
                <p class="text-sm text-green-700 dark:text-green-500">{d.url ? displayDomain(d.url) : 'example.com'}</p>
                <p class="text-lg text-blue-700 dark:text-blue-400 hover:underline cursor-pointer font-medium leading-snug">
                  {d.title || 'Page Title'}
                </p>
                <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {d.description || 'Page description will appear here...'}
                </p>
              </div>
            </div>
          )}

          {/* Twitter Preview */}
          {activePreview === 'twitter' && (
            <div class="max-w-lg bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <p class="px-4 pt-3 text-xs text-gray-500 mb-2">X / Twitter Card Preview</p>
              {d.twitterImage && (
                <div class="aspect-[2/1] bg-gray-100 dark:bg-gray-700 overflow-hidden">
                  <img src={d.twitterImage} alt="OG" class="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
              )}
              <div class="p-3 border-t border-gray-200 dark:border-gray-700">
                <p class="text-xs text-gray-500">{d.url ? displayDomain(d.url) : 'example.com'}</p>
                <p class="text-sm font-medium text-gray-900 dark:text-gray-100 mt-0.5 line-clamp-1">{d.twitterTitle || d.title || 'Title'}</p>
                <p class="text-xs text-gray-500 mt-0.5 line-clamp-2">{d.twitterDescription || d.description || 'Description'}</p>
              </div>
            </div>
          )}

          {/* Facebook Preview */}
          {activePreview === 'facebook' && (
            <div class="max-w-lg bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <p class="px-4 pt-3 text-xs text-gray-500 mb-2">Facebook Share Preview</p>
              {d.image && (
                <div class="aspect-[1.91/1] bg-gray-100 dark:bg-gray-700 overflow-hidden">
                  <img src={d.image} alt="OG" class="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
              )}
              <div class="p-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                <p class="text-xs text-gray-500 uppercase">{d.url ? displayDomain(d.url) : 'example.com'}</p>
                <p class="text-sm font-bold text-gray-900 dark:text-gray-100 mt-1 line-clamp-1">{d.title || 'Title'}</p>
                <p class="text-xs text-gray-500 mt-1 line-clamp-1">{d.description || 'Description'}</p>
              </div>
            </div>
          )}

          {/* LinkedIn Preview */}
          {activePreview === 'linkedin' && (
            <div class="max-w-lg bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <p class="px-4 pt-3 text-xs text-gray-500 mb-2">LinkedIn Share Preview</p>
              {d.image && (
                <div class="aspect-[1.91/1] bg-gray-100 dark:bg-gray-700 overflow-hidden">
                  <img src={d.image} alt="OG" class="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
              )}
              <div class="p-3 border-t border-gray-200 dark:border-gray-700">
                <p class="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">{d.title || 'Title'}</p>
                <p class="text-xs text-gray-500 mt-1">{d.url ? displayDomain(d.url) : 'example.com'}</p>
              </div>
            </div>
          )}

          {/* Slack Preview */}
          {activePreview === 'slack' && (
            <div class="max-w-lg bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
              <p class="px-4 pt-3 text-xs text-gray-500 mb-2">Slack Unfurl Preview</p>
              <div class="border-l-4 border-gray-400 dark:border-gray-500 pl-3 ml-4 mb-3">
                <p class="text-xs text-gray-500 font-bold">{d.siteName || displayDomain(d.url || '')}</p>
                <p class="text-sm font-bold text-blue-600 dark:text-blue-400 mt-0.5">{d.title || 'Title'}</p>
                <p class="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">{d.description || 'Description'}</p>
                {d.image && (
                  <div class="mt-2 max-w-[300px] rounded overflow-hidden">
                    <img src={d.image} alt="OG" class="w-full object-cover" style="max-height: 150px" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Detected meta tags */}
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Detected Meta Tags</h3>
              <button
                onClick={handleCopyMeta}
                class="px-3 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {copiedMeta ? 'Copied!' : 'Copy Tags'}
              </button>
            </div>
            <pre class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs font-mono text-gray-700 dark:text-gray-300 overflow-x-auto whitespace-pre-wrap">
              {generateMetaTags() || 'No OG tags detected'}
            </pre>
          </div>

          {/* Branding */}
          <p class="text-center text-xs text-gray-400 dark:text-gray-600">
            Made with <a href="https://devtoolkit.cc" class="text-primary-500 hover:underline">DevToolkit</a>
          </p>
        </div>
      )}
    </div>
  );
}
