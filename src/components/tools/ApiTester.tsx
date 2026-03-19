import { useState, useCallback } from 'preact/hooks';

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface Header {
  key: string;
  value: string;
  enabled: boolean;
}

interface ResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  time: number;
  size: number;
}

const METHOD_COLORS: Record<Method, string> = {
  GET: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
  POST: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
  PUT: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
  DELETE: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
  PATCH: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
};

type Tab = 'headers' | 'body' | 'response' | 'response-headers';

export default function ApiTester() {
  const [method, setMethod] = useState<Method>('GET');
  const [url, setUrl] = useState('');
  const [headers, setHeaders] = useState<Header[]>([
    { key: 'Content-Type', value: 'application/json', enabled: true },
  ]);
  const [body, setBody] = useState('');
  const [response, setResponse] = useState<ResponseData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('headers');
  const [copied, setCopied] = useState(false);

  const addHeader = () => {
    setHeaders([...headers, { key: '', value: '', enabled: true }]);
  };

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  const updateHeader = (index: number, field: keyof Header, value: string | boolean) => {
    const updated = [...headers];
    (updated[index] as any)[field] = value;
    setHeaders(updated);
  };

  const sendRequest = useCallback(async () => {
    setError('');
    setResponse(null);

    if (!url.trim()) {
      setError('Please enter a URL.');
      return;
    }

    let targetUrl = url.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }

    setLoading(true);
    const startTime = performance.now();

    try {
      const reqHeaders: Record<string, string> = {};
      for (const h of headers) {
        if (h.enabled && h.key.trim()) {
          reqHeaders[h.key.trim()] = h.value;
        }
      }

      const options: RequestInit = {
        method,
        headers: reqHeaders,
      };

      if (['POST', 'PUT', 'PATCH'].includes(method) && body.trim()) {
        options.body = body;
      }

      const res = await fetch(targetUrl, options);
      const elapsed = Math.round(performance.now() - startTime);
      const text = await res.text();

      const resHeaders: Record<string, string> = {};
      res.headers.forEach((v, k) => {
        resHeaders[k] = v;
      });

      let formattedBody = text;
      try {
        const parsed = JSON.parse(text);
        formattedBody = JSON.stringify(parsed, null, 2);
      } catch {}

      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: resHeaders,
        body: formattedBody,
        time: elapsed,
        size: new Blob([text]).size,
      });
      setActiveTab('response');
    } catch (e: any) {
      setError(e.message || 'Request failed. Check the URL and try again.');
    } finally {
      setLoading(false);
    }
  }, [method, url, headers, body]);

  const handleCopyResponse = async () => {
    if (!response) return;
    try {
      await navigator.clipboard.writeText(response.body);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = response.body;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClear = () => {
    setUrl('');
    setBody('');
    setResponse(null);
    setError('');
    setHeaders([{ key: 'Content-Type', value: 'application/json', enabled: true }]);
  };

  const statusColor = (status: number) => {
    if (status < 300) return 'text-green-600 dark:text-green-400';
    if (status < 400) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    return (bytes / 1024).toFixed(1) + ' KB';
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'headers', label: `Headers (${headers.filter(h => h.enabled && h.key).length})` },
    { key: 'body', label: 'Body' },
    { key: 'response', label: 'Response' },
    { key: 'response-headers', label: 'Response Headers' },
  ];

  return (
    <div class="space-y-6">
      {/* URL Bar */}
      <div class="flex gap-2">
        <select
          value={method}
          onChange={(e) => setMethod((e.target as HTMLSelectElement).value as Method)}
          class={`px-3 py-3 rounded-xl text-sm font-bold border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none ${METHOD_COLORS[method]}`}
        >
          {(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as Method[]).map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <input
          type="text"
          value={url}
          onInput={(e) => setUrl((e.target as HTMLInputElement).value)}
          onKeyDown={(e) => e.key === 'Enter' && sendRequest()}
          placeholder="https://api.example.com/endpoint"
          class="flex-1 px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
        />
        <button
          onClick={sendRequest}
          disabled={loading}
          class="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Sending...' : 'Send'}
        </button>
        <button
          onClick={handleClear}
          class="px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 text-sm font-medium"
        >
          Clear
        </button>
      </div>

      {/* Tabs */}
      <div class="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            class={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab.key
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Headers Tab */}
      {activeTab === 'headers' && (
        <div class="space-y-3">
          {headers.map((h, i) => (
            <div key={i} class="flex gap-2 items-center">
              <input
                type="checkbox"
                checked={h.enabled}
                onChange={(e) => updateHeader(i, 'enabled', (e.target as HTMLInputElement).checked)}
                class="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
              />
              <input
                type="text"
                value={h.key}
                onInput={(e) => updateHeader(i, 'key', (e.target as HTMLInputElement).value)}
                placeholder="Header name"
                class="flex-1 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
              <input
                type="text"
                value={h.value}
                onInput={(e) => updateHeader(i, 'value', (e.target as HTMLInputElement).value)}
                placeholder="Value"
                class="flex-1 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
              <button
                onClick={() => removeHeader(i)}
                class="p-2 text-gray-400 hover:text-red-500 transition-colors"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
          <button
            onClick={addHeader}
            class="px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950 rounded-lg transition-colors"
          >
            + Add Header
          </button>
        </div>
      )}

      {/* Body Tab */}
      {activeTab === 'body' && (
        <div class="space-y-2">
          <textarea
            value={body}
            onInput={(e) => setBody((e.target as HTMLTextAreaElement).value)}
            placeholder={'{\n  "key": "value"\n}'}
            class="w-full h-64 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-mono text-sm resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            spellcheck={false}
          />
          {!['POST', 'PUT', 'PATCH'].includes(method) && (
            <p class="text-xs text-yellow-600 dark:text-yellow-400">
              Note: Request body is typically only sent with POST, PUT, and PATCH requests.
            </p>
          )}
        </div>
      )}

      {/* Response Tab */}
      {activeTab === 'response' && (
        <div class="space-y-3">
          {response ? (
            <>
              <div class="flex flex-wrap items-center gap-4 text-sm">
                <span class={`font-bold text-lg ${statusColor(response.status)}`}>
                  {response.status} {response.statusText}
                </span>
                <span class="text-gray-500 dark:text-gray-400">{response.time}ms</span>
                <span class="text-gray-500 dark:text-gray-400">{formatSize(response.size)}</span>
                <button
                  onClick={handleCopyResponse}
                  class={`ml-auto px-3 py-1 text-xs font-medium rounded-lg transition-all duration-200 ${
                    copied
                      ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <textarea
                value={response.body}
                readOnly
                class="w-full h-72 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-mono text-sm resize-none outline-none"
                spellcheck={false}
              />
            </>
          ) : (
            <div class="text-center py-16 text-gray-400 dark:text-gray-500">
              <p class="text-lg mb-2">No response yet</p>
              <p class="text-sm">Enter a URL and click Send to make a request.</p>
            </div>
          )}
        </div>
      )}

      {/* Response Headers Tab */}
      {activeTab === 'response-headers' && (
        <div>
          {response ? (
            <div class="space-y-1">
              {Object.entries(response.headers).map(([k, v]) => (
                <div key={k} class="flex gap-2 text-sm py-1 border-b border-gray-100 dark:border-gray-800">
                  <span class="font-mono font-semibold text-gray-700 dark:text-gray-300 min-w-[180px]">{k}</span>
                  <span class="font-mono text-gray-500 dark:text-gray-400 break-all">{v}</span>
                </div>
              ))}
            </div>
          ) : (
            <div class="text-center py-16 text-gray-400 dark:text-gray-500">
              <p class="text-sm">Send a request to see response headers.</p>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div class="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl">
          <svg class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p class="text-sm font-medium text-red-800 dark:text-red-200">Request Failed</p>
            <p class="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
            <p class="text-xs text-red-500 dark:text-red-500 mt-2">Tip: CORS restrictions may block cross-origin requests from the browser. Try a public API or use a CORS proxy.</p>
          </div>
        </div>
      )}
    </div>
  );
}
