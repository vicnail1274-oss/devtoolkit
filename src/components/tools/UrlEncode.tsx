import { useState, useCallback } from 'preact/hooks';
import { useToolState } from '../../hooks/useToolState';
import QuickNav from '../QuickNav';

type Tab = 'encode' | 'decode';
type Mode = 'component' | 'full';

export default function UrlEncode() {
  const { value: input, setValue: setInput, getShareUrl } = useToolState('url-encode');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('encode');
  const [mode, setMode] = useState<Mode>('component');
  const [copied, setCopied] = useState(false);

  const processUrl = useCallback((action: Tab) => {
    setError('');
    setOutput('');

    if (!input.trim()) {
      setError('Please enter a string to process.');
      return;
    }

    try {
      switch (action) {
        case 'encode':
          setOutput(
            mode === 'component'
              ? encodeURIComponent(input)
              : encodeURI(input)
          );
          break;
        case 'decode':
          setOutput(
            mode === 'component'
              ? decodeURIComponent(input)
              : decodeURI(input)
          );
          break;
      }
    } catch (e: any) {
      const msg = e.message || 'Failed to process the input';
      setError(msg);
    }
  }, [input, mode]);

  const handleTabClick = (tab: Tab) => {
    setActiveTab(tab);
    if (input.trim()) {
      processUrl(tab);
    }
  };

  const handleCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = output;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError('');
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
    } catch {
      // clipboard not available
    }
  };

  const loadSample = () => {
    const sample = 'https://example.com/search?q=hello world&lang=繁體中文&filter=name=value&page=1';
    setInput(sample);
  };

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'encode', label: 'Encode', icon: '%' },
    { key: 'decode', label: 'Decode', icon: 'A' },
  ];

  return (
    <div class="space-y-6">
      <QuickNav links={[
        { label: 'Base64', href: '/tools/base64' },
        { label: 'Hash Generator', href: '/tools/hash-generator' },
      ]} />
      {/* Tabs */}
      <div class="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabClick(tab.key)}
            class={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab.key
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
            }`}
          >
            <span class="mr-1.5">{tab.icon}</span>
            {tab.label}
          </button>
        ))}

        {/* Mode selector */}
        <div class="flex items-center gap-2 ml-auto">
          <label class="text-sm text-gray-500 dark:text-gray-400">Mode:</label>
          <select
            value={mode}
            onChange={(e) => setMode((e.target as HTMLSelectElement).value as Mode)}
            class="px-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          >
            <option value="component">Component</option>
            <option value="full">Full URL</option>
          </select>
        </div>
      </div>

      {/* Editor Area */}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Input */}
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Input</label>
            <div class="flex gap-2">
              <button
                onClick={handlePaste}
                class="px-3 py-1 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
              >
                Paste
              </button>
              <button
                onClick={loadSample}
                class="px-3 py-1 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
              >
                Sample
              </button>
              <button
                onClick={handleClear}
                class="px-3 py-1 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
              >
                Clear
              </button>
            </div>
          </div>
          <textarea
            value={input}
            onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
            placeholder={activeTab === 'encode'
              ? 'Enter text to encode...\n\nExample: hello world&foo=bar'
              : 'Enter encoded text to decode...\n\nExample: hello%20world%26foo%3Dbar'
            }
            class="w-full h-80 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-mono text-sm resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all duration-200"
            spellcheck={false}
          />
          <div class="flex items-center justify-between text-xs text-gray-400">
            <span>{input.length} characters</span>
            <span>{input.split('\n').length} lines</span>
          </div>
        </div>

        {/* Output */}
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Output</label>
            <button
              onClick={handleCopy}
              disabled={!output}
              class={`px-3 py-1 text-xs font-medium rounded-lg transition-all duration-200 ${
                copied
                  ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={async () => { try { await navigator.clipboard.writeText(getShareUrl()); } catch {} }}
              disabled={!input.trim()}
              class="px-3 py-1 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Copy shareable link"
            >
              Share
            </button>
          </div>
          <div class="relative">
            <textarea
              value={output}
              readOnly
              placeholder="Output will appear here..."
              class={`w-full h-80 p-4 bg-white dark:bg-gray-900 border rounded-xl font-mono text-sm resize-none outline-none ${
                error
                  ? 'border-red-300 dark:border-red-800'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
              spellcheck={false}
            />
          </div>
          {output && (
            <div class="flex items-center justify-between text-xs text-gray-400">
              <span>{output.length} characters</span>
              <span>{output.split('\n').length} lines</span>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div class="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl">
          <svg class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p class="text-sm font-medium text-red-800 dark:text-red-200">Error</p>
            <p class="text-sm text-red-600 dark:text-red-400 mt-1 font-mono">{error}</p>
          </div>
        </div>
      )}

      {/* Action Button */}
      <div class="flex justify-center">
        <button
          onClick={() => processUrl(activeTab)}
          class="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
        >
          {activeTab === 'encode' ? 'Encode URL' : 'Decode URL'}
        </button>
      </div>
    </div>
  );
}
