import { useState, useCallback } from 'preact/hooks';

function formatHtml(html: string, indentSize: number): string {
  const selfClosing = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
    'link', 'meta', 'param', 'source', 'track', 'wbr',
  ]);

  let result = '';
  let indent = 0;
  const tab = ' '.repeat(indentSize);

  // Normalize and split by tags
  const tokens = html.replace(/>\s+</g, '><').trim().split(/(<[^>]+>)/g).filter(Boolean);

  for (const token of tokens) {
    if (token.startsWith('</')) {
      // Closing tag
      indent = Math.max(0, indent - 1);
      result += tab.repeat(indent) + token + '\n';
    } else if (token.startsWith('<')) {
      const tagName = token.replace(/<\/?([a-zA-Z0-9-]+)[\s\S]*/, '$1').toLowerCase();
      result += tab.repeat(indent) + token + '\n';
      if (!token.endsWith('/>') && !selfClosing.has(tagName) && !token.startsWith('<!') && !token.startsWith('<?')) {
        indent++;
      }
    } else {
      // Text node
      const text = token.trim();
      if (text) {
        result += tab.repeat(indent) + text + '\n';
      }
    }
  }
  return result.trimEnd();
}

function minifyHtml(html: string): string {
  let result = html;
  result = result.replace(/<!--[\s\S]*?-->/g, '');
  result = result.replace(/\n\s*/g, '');
  result = result.replace(/\s{2,}/g, ' ');
  result = result.replace(/>\s+</g, '><');
  return result.trim();
}

export default function HtmlFormatter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'format' | 'minify'>('format');
  const [indentSize, setIndentSize] = useState(2);
  const [copied, setCopied] = useState(false);

  const handleProcess = useCallback(() => {
    if (!input.trim()) return;
    const result = mode === 'format' ? formatHtml(input, indentSize) : minifyHtml(input);
    setOutput(result);
    setCopied(false);
  }, [input, mode, indentSize]);

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
    setCopied(false);
  };

  const handleSample = () => {
    setInput(`<!DOCTYPE html><html><head><title>Sample</title><meta charset="utf-8"><link rel="stylesheet" href="style.css"></head><body><div class="container"><h1>Hello World</h1><p>This is a <strong>sample</strong> HTML document.</p><ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul></div><script src="app.js"></script></body></html>`);
    setOutput('');
    setCopied(false);
  };

  return (
    <div class="space-y-6">
      {/* Mode Toggle */}
      <div class="flex items-center gap-4">
        <div class="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setMode('format')}
            class={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              mode === 'format'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Format / Beautify
          </button>
          <button
            onClick={() => setMode('minify')}
            class={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              mode === 'minify'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Minify
          </button>
        </div>
        {mode === 'format' && (
          <div class="flex items-center gap-2">
            <label class="text-sm text-gray-500 dark:text-gray-400">Indent:</label>
            <select
              value={indentSize}
              onChange={(e) => setIndentSize(Number((e.target as HTMLSelectElement).value))}
              class="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
            >
              <option value={2}>2 spaces</option>
              <option value={4}>4 spaces</option>
              <option value={8}>Tab (8)</option>
            </select>
          </div>
        )}
      </div>

      {/* Input */}
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">HTML Input</label>
        <textarea
          value={input}
          onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
          placeholder="Paste your HTML here..."
          class="w-full h-56 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-y"
        />
      </div>

      {/* Buttons */}
      <div class="flex flex-wrap gap-3">
        <button
          onClick={handleProcess}
          class="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
        >
          {mode === 'format' ? 'Format HTML' : 'Minify HTML'}
        </button>
        <button
          onClick={handleSample}
          class="px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl font-medium transition-all duration-200"
        >
          Sample
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

      {/* Output */}
      {output ? (
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Output</label>
          <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <pre class="text-sm font-mono text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-all">{output}</pre>
          </div>
        </div>
      ) : (
        <div class="flex items-center justify-center h-32 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl">
          <p class="text-gray-400 dark:text-gray-500 text-sm">
            {mode === 'format' ? 'Formatted HTML will appear here' : 'Minified HTML will appear here'}
          </p>
        </div>
      )}
    </div>
  );
}
