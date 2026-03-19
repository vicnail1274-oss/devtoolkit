import { useState } from 'preact/hooks';
import { useAuth, loginWithGoogle, startCheckout } from '../hooks/useAuth';

const sampleCode = `function fetchUser(id) {
  var user = null;
  fetch('/api/users/' + id)
    .then(res => res.json())
    .then(data => { user = data; })
  return user;
}

function processItems(items) {
  for (var i = 0; i < items.length; i++) {
    setTimeout(function() {
      console.log(items[i]);
    }, 1000);
  }
}`;

export default function AiCodeReview() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [showGate, setShowGate] = useState(false);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const auth = useAuth();

  const handleReview = async () => {
    // Not logged in → show gate with login option
    if (!auth.authenticated) {
      setShowGate(true);
      return;
    }

    // Logged in but not Pro → show gate with upgrade option
    if (!auth.isPro) {
      setShowGate(true);
      return;
    }

    // Pro user → call API
    setLoading(true);
    setError('');
    setReview('');

    try {
      const res = await fetch('/api/ai/code-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Review failed');
      }

      const data = await res.json();
      setReview(data.review);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="space-y-4">
      {/* Language selector */}
      <div class="flex items-center gap-4">
        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Language:</label>
        <select
          value={language}
          onChange={(e) => setLanguage((e.target as HTMLSelectElement).value)}
          class="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
        >
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="python">Python</option>
          <option value="go">Go</option>
          <option value="rust">Rust</option>
          <option value="java">Java</option>
          <option value="csharp">C#</option>
          <option value="php">PHP</option>
        </select>
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
          placeholder="Paste your code here for AI-powered review..."
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

      {/* Review button */}
      <button
        onClick={handleReview}
        disabled={!code.trim() || loading}
        class="w-full py-3 px-6 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Reviewing...
          </>
        ) : (
          <>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Review Code with AI
          </>
        )}
      </button>

      {/* Error */}
      {error && (
        <div class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Review result */}
      {review && (
        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <h3 class="text-lg font-bold mb-3 flex items-center gap-2">
            <svg class="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            AI Review
          </h3>
          <div class="prose dark:prose-invert prose-sm max-w-none whitespace-pre-wrap">{review}</div>
        </div>
      )}

      {/* Pro Gate Overlay */}
      {showGate && (
        <div class="relative bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border border-primary-200 dark:border-primary-800 rounded-xl p-8 text-center">
          <div class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 text-sm font-medium mb-4">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Pro Feature
          </div>
          <h3 class="text-xl font-bold mb-2">Unlock AI Code Review</h3>
          <p class="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Get instant AI-powered code reviews with bug detection, security analysis, performance tips, and best practice suggestions.
          </p>
          <div class="space-y-3">
            {!auth.authenticated ? (
              <button
                onClick={() => loginWithGoogle('/tools/ai-code-review')}
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
