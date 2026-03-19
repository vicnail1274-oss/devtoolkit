import { useState, useCallback } from 'preact/hooks';

function minifyCss(css: string): string {
  let result = css;
  // Remove comments
  result = result.replace(/\/\*[\s\S]*?\*\//g, '');
  // Remove newlines and tabs
  result = result.replace(/[\n\r\t]/g, '');
  // Collapse multiple spaces to one
  result = result.replace(/ {2,}/g, ' ');
  // Remove spaces around selectors and braces
  result = result.replace(/\s*{\s*/g, '{');
  result = result.replace(/\s*}\s*/g, '}');
  result = result.replace(/\s*;\s*/g, ';');
  result = result.replace(/\s*:\s*/g, ':');
  result = result.replace(/\s*,\s*/g, ',');
  // Remove trailing semicolons before closing brace
  result = result.replace(/;}/g, '}');
  // Trim
  result = result.trim();
  return result;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(2)} KB`;
}

export default function CssMinifier() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<{ original: number; minified: number } | null>(null);

  const handleMinify = useCallback(() => {
    if (!input.trim()) return;
    const minified = minifyCss(input);
    setOutput(minified);
    const enc = new TextEncoder();
    setStats({
      original: enc.encode(input).length,
      minified: enc.encode(minified).length,
    });
    setCopied(false);
  }, [input]);

  const handleCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = output;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setStats(null);
    setCopied(false);
  };

  const savings = stats ? Math.round((1 - stats.minified / stats.original) * 100) : 0;

  return (
    <div class="space-y-6">
      {/* Input */}
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">CSS Input</label>
        <textarea
          value={input}
          onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
          placeholder={`/* Paste your CSS here */\nbody {\n  margin: 0;\n  padding: 0;\n  font-family: sans-serif;\n}`}
          class="w-full h-56 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-y"
        />
      </div>

      {/* Buttons */}
      <div class="flex flex-wrap gap-3">
        <button
          onClick={handleMinify}
          class="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
        >
          Minify CSS
        </button>
        <button
          onClick={handleClear}
          class="px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl font-medium transition-all duration-200"
        >
          Clear
        </button>
        {output && (
          <button
            onClick={handleCopy}
            class={`px-4 py-2.5 font-medium rounded-xl transition-all duration-200 ${
              copied
                ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
            }`}
          >
            {copied ? 'Copied!' : 'Copy Output'}
          </button>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div class="flex flex-wrap gap-4 text-sm">
          <span class="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg">
            Original: {formatBytes(stats.original)}
          </span>
          <span class="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg">
            Minified: {formatBytes(stats.minified)}
          </span>
          <span class={`px-3 py-1 rounded-lg font-medium ${
            savings > 0
              ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
          }`}>
            {savings > 0 ? `${savings}% smaller` : 'No savings'}
          </span>
        </div>
      )}

      {/* Output */}
      {output ? (
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Minified Output</label>
          <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <pre class="text-sm font-mono text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-all">{output}</pre>
          </div>
        </div>
      ) : (
        <div class="flex items-center justify-center h-32 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl">
          <p class="text-gray-400 dark:text-gray-500 text-sm">Minified CSS will appear here</p>
        </div>
      )}
    </div>
  );
}
