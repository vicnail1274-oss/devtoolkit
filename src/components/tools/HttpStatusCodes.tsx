import { useState, useMemo } from 'preact/hooks';

interface StatusCode {
  code: number;
  phrase: string;
  description: string;
  category: string;
}

const STATUS_CODES: StatusCode[] = [
  { code: 100, phrase: 'Continue', description: 'Server received request headers; client should proceed to send the body.', category: '1xx Informational' },
  { code: 101, phrase: 'Switching Protocols', description: 'Server is switching protocols as requested by the client (e.g., to WebSocket).', category: '1xx Informational' },
  { code: 200, phrase: 'OK', description: 'Request succeeded. Standard response for successful HTTP requests.', category: '2xx Success' },
  { code: 201, phrase: 'Created', description: 'Request fulfilled and a new resource was created. Typically returned after POST/PUT.', category: '2xx Success' },
  { code: 202, phrase: 'Accepted', description: 'Request accepted for processing, but processing has not been completed.', category: '2xx Success' },
  { code: 204, phrase: 'No Content', description: 'Request succeeded but there is no content to return. Common for DELETE requests.', category: '2xx Success' },
  { code: 206, phrase: 'Partial Content', description: 'Server is delivering only part of the resource due to a range header sent by the client.', category: '2xx Success' },
  { code: 301, phrase: 'Moved Permanently', description: 'Resource has been permanently moved to a new URL. All future requests should use the new URL.', category: '3xx Redirection' },
  { code: 302, phrase: 'Found', description: 'Resource temporarily located at a different URL. Client should continue using the original URL.', category: '3xx Redirection' },
  { code: 304, phrase: 'Not Modified', description: 'Resource has not been modified since last request. Client can use cached version.', category: '3xx Redirection' },
  { code: 307, phrase: 'Temporary Redirect', description: 'Like 302, but the request method must not change. POST stays POST.', category: '3xx Redirection' },
  { code: 308, phrase: 'Permanent Redirect', description: 'Like 301, but the request method must not change. POST stays POST.', category: '3xx Redirection' },
  { code: 400, phrase: 'Bad Request', description: 'Server cannot process the request due to client error (malformed syntax, invalid parameters).', category: '4xx Client Error' },
  { code: 401, phrase: 'Unauthorized', description: 'Authentication is required and has failed or not been provided. Typically needs login.', category: '4xx Client Error' },
  { code: 403, phrase: 'Forbidden', description: 'Server understood the request but refuses to authorize it. Different from 401 — re-authenticating will not help.', category: '4xx Client Error' },
  { code: 404, phrase: 'Not Found', description: 'The requested resource could not be found on the server. Most recognized HTTP error.', category: '4xx Client Error' },
  { code: 405, phrase: 'Method Not Allowed', description: 'The HTTP method used is not supported for this resource (e.g., POST on a GET-only endpoint).', category: '4xx Client Error' },
  { code: 408, phrase: 'Request Timeout', description: 'Server timed out waiting for the request. Client did not produce a request in time.', category: '4xx Client Error' },
  { code: 409, phrase: 'Conflict', description: 'Request conflicts with current state of the server. Common in concurrent update scenarios.', category: '4xx Client Error' },
  { code: 410, phrase: 'Gone', description: 'Resource is no longer available and no forwarding address is known. Permanent removal.', category: '4xx Client Error' },
  { code: 413, phrase: 'Payload Too Large', description: 'Request entity is larger than the server is willing or able to process.', category: '4xx Client Error' },
  { code: 415, phrase: 'Unsupported Media Type', description: 'The media format of the requested data is not supported by the server.', category: '4xx Client Error' },
  { code: 422, phrase: 'Unprocessable Entity', description: 'Request was well-formed but semantically erroneous. Common in API validation errors.', category: '4xx Client Error' },
  { code: 429, phrase: 'Too Many Requests', description: 'User has sent too many requests in a given time period (rate limiting).', category: '4xx Client Error' },
  { code: 500, phrase: 'Internal Server Error', description: 'Generic server error. Something went wrong on the server side.', category: '5xx Server Error' },
  { code: 502, phrase: 'Bad Gateway', description: 'Server acting as gateway received an invalid response from the upstream server.', category: '5xx Server Error' },
  { code: 503, phrase: 'Service Unavailable', description: 'Server is not ready to handle the request. Usually due to maintenance or overload.', category: '5xx Server Error' },
  { code: 504, phrase: 'Gateway Timeout', description: 'Server acting as gateway did not get a response from the upstream server in time.', category: '5xx Server Error' },
];

const CATEGORY_COLORS: Record<string, string> = {
  '1xx Informational': 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
  '2xx Success': 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
  '3xx Redirection': 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
  '4xx Client Error': 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300',
  '5xx Server Error': 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
};

export default function HttpStatusCodes() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [copied, setCopied] = useState<number | null>(null);

  const categories = useMemo(() => [...new Set(STATUS_CODES.map((s) => s.category))], []);

  const filtered = useMemo(() => {
    return STATUS_CODES.filter((s) => {
      const matchCategory = !activeCategory || s.category === activeCategory;
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        s.code.toString().includes(q) ||
        s.phrase.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q);
      return matchCategory && matchSearch;
    });
  }, [search, activeCategory]);

  const handleCopy = async (code: number) => {
    const s = STATUS_CODES.find((x) => x.code === code)!;
    const text = `${s.code} ${s.phrase}`;
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
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div class="space-y-6">
      {/* Search */}
      <div class="relative">
        <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
          placeholder="Search by code, name, or description..."
          class="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
        />
      </div>

      {/* Category Filters */}
      <div class="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory(null)}
          class={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            !activeCategory
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          All ({STATUS_CODES.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
            class={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeCategory === cat
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Results */}
      <div class="space-y-2">
        <p class="text-xs text-gray-400">{filtered.length} status codes</p>
        {filtered.map((s) => (
          <div
            key={s.code}
            class="flex items-start gap-4 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-gray-300 dark:hover:border-gray-600 transition-all"
          >
            <div class="flex-shrink-0">
              <span class={`inline-block px-2.5 py-1 rounded-lg font-mono text-sm font-bold ${CATEGORY_COLORS[s.category] || ''}`}>
                {s.code}
              </span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="font-semibold text-gray-900 dark:text-gray-100">{s.phrase}</span>
              </div>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{s.description}</p>
            </div>
            <button
              onClick={() => handleCopy(s.code)}
              class={`flex-shrink-0 px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                copied === s.code
                  ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {copied === s.code ? 'Copied!' : 'Copy'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
