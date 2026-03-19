import { useState, useCallback } from 'preact/hooks';
import { useToolState } from '../../hooks/useToolState';
import QuickNav from '../QuickNav';

type Mode = 'encode' | 'decode';

export default function Base64Tool() {
  const { value: input, setValue: setInput, getShareUrl } = useToolState('base64');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Mode>('encode');
  const [urlSafe, setUrlSafe] = useState(false);
  const [copied, setCopied] = useState(false);

  const toUrlSafeBase64 = (b64: string) =>
    b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const fromUrlSafeBase64 = (b64: string) => {
    let s = b64.replace(/-/g, '+').replace(/_/g, '/');
    const pad = s.length % 4;
    if (pad) s += '='.repeat(4 - pad);
    return s;
  };

  const process = useCallback((mode: Mode) => {
    setError('');
    setOutput('');

    if (!input.trim()) {
      setError('Please enter some text to process.');
      return;
    }

    try {
      if (mode === 'encode') {
        // Encode: support full UTF-8 via TextEncoder
        const bytes = new TextEncoder().encode(input);
        let binary = '';
        bytes.forEach((b) => (binary += String.fromCharCode(b)));
        let result = btoa(binary);
        if (urlSafe) result = toUrlSafeBase64(result);
        setOutput(result);
      } else {
        // Decode
        let b64 = input.trim();
        if (urlSafe) b64 = fromUrlSafeBase64(b64);
        const binary = atob(b64);
        const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
        const result = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
        setOutput(result);
      }
    } catch (e: any) {
      const msg = e.message || 'Processing failed';
      setError(
        mode === 'decode'
          ? `Invalid Base64 input: ${msg}`
          : `Encoding failed: ${msg}`
      );
    }
  }, [input, urlSafe]);

  const handleTabClick = (tab: Mode) => {
    setActiveTab(tab);
    if (input.trim()) {
      process(tab);
    }
  };

  const handleCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
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
    const sample = activeTab === 'encode'
      ? 'Hello, World! This is a Base64 encoding test.\nIt supports UTF-8 characters: \u4F60\u597D \u{1F680}'
      : 'SGVsbG8sIFdvcmxkISBUaGlzIGlzIGEgQmFzZTY0IGVuY29kaW5nIHRlc3Qu';
    setInput(sample);
  };

  const tabs: { key: Mode; label: string; icon: string }[] = [
    { key: 'encode', label: 'Encode', icon: '\u2192' },
    { key: 'decode', label: 'Decode', icon: '\u2190' },
  ];

  return (
    <div class="space-y-6">
      <QuickNav links={[
        { label: 'URL Encode', href: '/tools/url-encode' },
        { label: 'Hash Generator', href: '/tools/hash-generator' },
        { label: 'JWT Decoder', href: '/tools/jwt-decoder' },
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

        {/* URL-Safe Toggle */}
        <div class="flex items-center gap-2 ml-auto">
          <label class="text-sm text-gray-500 dark:text-gray-400">URL-safe:</label>
          <button
            onClick={() => setUrlSafe(!urlSafe)}
            class={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
              urlSafe
                ? 'bg-primary-600'
                : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              class={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                urlSafe ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
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
              ? 'Enter text to encode to Base64...'
              : 'Enter Base64 string to decode...'}
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
            <p class="text-sm font-medium text-red-800 dark:text-red-200">
              {activeTab === 'decode' ? 'Invalid Base64' : 'Encoding Error'}
            </p>
            <p class="text-sm text-red-600 dark:text-red-400 mt-1 font-mono">{error}</p>
          </div>
        </div>
      )}

      {/* Action Button */}
      <div class="flex justify-center">
        <button
          onClick={() => process(activeTab)}
          class="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
        >
          {activeTab === 'encode' ? 'Encode to Base64' : 'Decode from Base64'}
        </button>
      </div>
    </div>
  );
}
