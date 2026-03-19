import { useState } from 'preact/hooks';
import { useAuth, loginWithGoogle, startCheckout } from '../hooks/useAuth';

const sampleCode = `export class UserService {
  private db: Database;
  private cache: RedisClient;

  constructor(db: Database, cache: RedisClient) {
    this.db = db;
    this.cache = cache;
  }

  async getUser(id: string): Promise<User | null> {
    const cached = await this.cache.get(\`user:\${id}\`);
    if (cached) return JSON.parse(cached);
    const user = await this.db.query('SELECT * FROM users WHERE id = $1', [id]);
    if (user) await this.cache.set(\`user:\${id}\`, JSON.stringify(user), 'EX', 3600);
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const user = await this.db.query('UPDATE users SET ...data WHERE id = $1 RETURNING *', [id]);
    await this.cache.del(\`user:\${id}\`);
    return user;
  }
}`;

export default function AiDocGenerator() {
  const [code, setCode] = useState('');
  const [docStyle, setDocStyle] = useState('jsdoc');
  const [showGate, setShowGate] = useState(false);
  const [documentation, setDocumentation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const auth = useAuth();

  const handleGenerate = async () => {
    if (!auth.authenticated) { setShowGate(true); return; }
    if (!auth.isPro) { setShowGate(true); return; }

    setLoading(true);
    setError('');
    setDocumentation('');

    try {
      const res = await fetch('/api/ai/doc-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, style: docStyle }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Generation failed');
      }

      const data = await res.json();
      setDocumentation(data.documentation);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="space-y-4">
      {/* Options */}
      <div class="flex flex-wrap items-center gap-4">
        <div class="flex items-center gap-2">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Style:</label>
          <select
            value={docStyle}
            onChange={(e) => setDocStyle((e.target as HTMLSelectElement).value)}
            class="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
          >
            <option value="jsdoc">JSDoc</option>
            <option value="tsdoc">TSDoc</option>
            <option value="python">Python Docstring</option>
            <option value="markdown">Markdown README</option>
            <option value="openapi">OpenAPI / Swagger</option>
          </select>
        </div>
        <button
          onClick={() => setCode(sampleCode)}
          class="text-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          Load Sample
        </button>
      </div>

      {/* Code input */}
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Paste your code
        </label>
        <textarea
          value={code}
          onInput={(e) => setCode((e.target as HTMLTextAreaElement).value)}
          placeholder="Paste your code here to generate documentation..."
          class="w-full h-64 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl font-mono text-sm resize-y focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          spellcheck={false}
        />
        <div class="flex justify-between mt-1">
          <span class="text-xs text-gray-400">{code.split('\n').length} lines</span>
          <button
            onClick={() => setCode('')}
            class="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={!code.trim() || loading}
        class="w-full py-3 px-6 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Generating...
          </>
        ) : (
          <>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Generate Documentation
          </>
        )}
      </button>

      {/* Error */}
      {error && (
        <div class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Documentation result */}
      {documentation && (
        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-bold flex items-center gap-2">
              <svg class="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Generated Documentation
            </h3>
            <button
              onClick={() => navigator.clipboard.writeText(documentation)}
              class="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Copy
            </button>
          </div>
          <pre class="font-mono text-sm whitespace-pre-wrap overflow-x-auto">{documentation}</pre>
        </div>
      )}

      {/* Pro Gate */}
      {showGate && (
        <div class="relative bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border border-primary-200 dark:border-primary-800 rounded-xl p-8 text-center">
          <div class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 text-sm font-medium mb-4">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Pro Feature
          </div>
          <h3 class="text-xl font-bold mb-2">Unlock AI Doc Generator</h3>
          <p class="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Generate comprehensive documentation from your code automatically — JSDoc, TSDoc, Python docstrings, Markdown, and OpenAPI specs.
          </p>
          <div class="space-y-3">
            {!auth.authenticated ? (
              <button
                onClick={() => loginWithGoogle('/tools/ai-doc-generator')}
                class="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors duration-200"
              >
                Sign in with Google to Start Trial
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
              </button>
            ) : (
              <button
                onClick={() => startCheckout()}
                class="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors duration-200"
              >
                Start Free Trial — $9.99/mo
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
              </button>
            )}
            <p class="text-xs text-gray-400">7-day free trial. Cancel anytime.</p>
          </div>
          <button
            onClick={() => setShowGate(false)}
            class="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      )}
    </div>
  );
}
