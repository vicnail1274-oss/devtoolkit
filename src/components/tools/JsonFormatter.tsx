import { useState, useCallback, useMemo } from 'preact/hooks';
import { useToolState } from '../../hooks/useToolState';
import QuickNav from '../QuickNav';

type Tab = 'format' | 'validate' | 'minify' | 'tree' | 'path';

// --- Collapsible Tree View ---
function TreeNode({ name, value, depth = 0, defaultOpen = true }: {
  name: string | number;
  value: any;
  depth?: number;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen && depth < 2);

  if (value === null) {
    return (
      <div class="flex items-start" style={{ paddingLeft: `${depth * 20}px` }}>
        <span class="text-gray-500 dark:text-gray-400 mr-1">{name}:</span>
        <span class="text-orange-500">null</span>
      </div>
    );
  }

  if (typeof value === 'object') {
    const isArray = Array.isArray(value);
    const entries = isArray ? value.map((v: any, i: number) => [i, v]) : Object.entries(value);
    const bracket = isArray ? ['[', ']'] : ['{', '}'];
    const count = entries.length;

    return (
      <div style={{ paddingLeft: `${depth * 20}px` }}>
        <button
          onClick={() => setOpen(!open)}
          class="flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-1 -ml-1 text-left"
        >
          <svg
            class={`w-3 h-3 text-gray-400 transition-transform ${open ? 'rotate-90' : ''}`}
            fill="currentColor" viewBox="0 0 20 20"
          >
            <path d="M6 4l8 6-8 6V4z" />
          </svg>
          <span class="text-gray-500 dark:text-gray-400 mr-1">{name}:</span>
          <span class="text-gray-400 dark:text-gray-500">
            {bracket[0]} {!open && <span class="text-xs">{count} items</span>} {!open && bracket[1]}
          </span>
        </button>
        {open && (
          <div>
            {entries.map(([k, v]: [string | number, any]) => (
              <TreeNode key={k} name={k} value={v} depth={depth + 1} defaultOpen={depth < 1} />
            ))}
            <div style={{ paddingLeft: `${(depth + 1) * 20}px` }} class="text-gray-400 dark:text-gray-500">
              {bracket[1]}
            </div>
          </div>
        )}
      </div>
    );
  }

  const colorClass =
    typeof value === 'string' ? 'text-green-600 dark:text-green-400' :
    typeof value === 'number' ? 'text-blue-600 dark:text-blue-400' :
    typeof value === 'boolean' ? 'text-purple-600 dark:text-purple-400' :
    'text-gray-600 dark:text-gray-400';

  const display = typeof value === 'string' ? `"${value}"` : String(value);

  return (
    <div class="flex items-start" style={{ paddingLeft: `${depth * 20}px` }}>
      <span class="text-gray-500 dark:text-gray-400 mr-1">{name}:</span>
      <span class={colorClass}>{display}</span>
    </div>
  );
}

// --- JSON Path evaluator ---
function evaluateJsonPath(obj: any, pathExpr: string): any[] {
  const path = pathExpr.trim();
  if (!path || path === '$') return [obj];

  // Normalize: remove leading $. or $
  let normalized = path.startsWith('$.') ? path.slice(2) : path.startsWith('$') ? path.slice(1) : path;
  if (normalized.startsWith('.')) normalized = normalized.slice(1);

  const segments: string[] = [];
  let current = '';
  let i = 0;
  while (i < normalized.length) {
    if (normalized[i] === '[') {
      if (current) { segments.push(current); current = ''; }
      const end = normalized.indexOf(']', i);
      if (end === -1) return [];
      segments.push(normalized.slice(i, end + 1));
      i = end + 1;
      if (normalized[i] === '.') i++;
    } else if (normalized[i] === '.') {
      if (current) { segments.push(current); current = ''; }
      i++;
    } else {
      current += normalized[i];
      i++;
    }
  }
  if (current) segments.push(current);

  let results: any[] = [obj];
  for (const seg of segments) {
    const next: any[] = [];
    for (const item of results) {
      if (item == null || typeof item !== 'object') continue;

      // Wildcard
      if (seg === '*') {
        const values = Array.isArray(item) ? item : Object.values(item);
        next.push(...values);
      }
      // Array index: [0], [1], etc.
      else if (seg.startsWith('[') && seg.endsWith(']')) {
        const inner = seg.slice(1, -1).replace(/['"]/g, '');
        if (Array.isArray(item)) {
          const idx = parseInt(inner, 10);
          if (!isNaN(idx) && idx >= 0 && idx < item.length) {
            next.push(item[idx]);
          }
        } else if (inner in item) {
          next.push(item[inner]);
        }
      }
      // Property name
      else if (Array.isArray(item)) {
        // Skip non-object arrays
      } else if (seg in item) {
        next.push(item[seg]);
      }
    }
    results = next;
    if (results.length === 0) break;
  }
  return results;
}

// --- Main Component ---
export default function JsonFormatter() {
  const { value: input, setValue: setInput, getShareUrl } = useToolState('json-formatter');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('format');
  const [indentSize, setIndentSize] = useState(2);
  const [copied, setCopied] = useState(false);
  const [jsonPath, setJsonPath] = useState('$');
  const [pathResult, setPathResult] = useState('');

  const parsedJson = useMemo(() => {
    if (!input.trim()) return null;
    try { return JSON.parse(input); } catch { return null; }
  }, [input]);

  const processJson = useCallback((action: Tab) => {
    setError('');
    setOutput('');
    setPathResult('');

    if (!input.trim()) {
      setError('Please enter some JSON to process.');
      return;
    }

    try {
      const parsed = JSON.parse(input);

      switch (action) {
        case 'format':
          setOutput(JSON.stringify(parsed, null, indentSize));
          break;
        case 'validate':
          setOutput('Valid JSON');
          break;
        case 'minify':
          setOutput(JSON.stringify(parsed));
          break;
        case 'tree':
          // Tree view uses parsedJson directly
          break;
        case 'path':
          break;
      }
    } catch (e: any) {
      const msg = e.message || 'Invalid JSON';
      setError(msg);
    }
  }, [input, indentSize]);

  const handleTabClick = (tab: Tab) => {
    setActiveTab(tab);
    if (input.trim()) {
      processJson(tab);
    }
  };

  const handlePathQuery = useCallback(() => {
    if (!parsedJson) {
      setPathResult('Parse the JSON first (enter valid JSON above)');
      return;
    }
    try {
      const results = evaluateJsonPath(parsedJson, jsonPath);
      if (results.length === 0) {
        setPathResult('No matches found');
      } else if (results.length === 1) {
        setPathResult(JSON.stringify(results[0], null, 2));
      } else {
        setPathResult(JSON.stringify(results, null, 2));
      }
    } catch (e: any) {
      setPathResult(`Error: ${e.message}`);
    }
  }, [parsedJson, jsonPath]);

  const handleCopy = async () => {
    const text = activeTab === 'path' ? pathResult : output;
    if (!text || text === 'Valid JSON') return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const text = activeTab === 'path' ? pathResult : output;
    if (!text || text === 'Valid JSON') return;
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeTab === 'minify' ? 'data.min.json' : 'data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError('');
    setPathResult('');
    setJsonPath('$');
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
    const sample = JSON.stringify({
      name: "DevToolkit",
      version: "1.0.0",
      features: ["JSON Formatter", "Token Counter", "Base64 Encoder"],
      config: {
        theme: "dark",
        language: "en",
        notifications: true
      },
      stats: {
        tools: 24,
        users: 15000,
        uptime: 99.9
      }
    }, null, 2);
    setInput(sample);
  };

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'format', label: 'Format', icon: '{ }' },
    { key: 'validate', label: 'Validate', icon: '\u2713' },
    { key: 'minify', label: 'Minify', icon: '\u2190\u2192' },
    { key: 'tree', label: 'Tree View', icon: '\u25B6' },
    { key: 'path', label: 'JSON Path', icon: '$.' },
  ];

  return (
    <div class="space-y-6">
      <QuickNav links={[
        { label: 'JSON to CSV', href: '/tools/json-to-csv' },
        { label: 'JSON Schema', href: '/tools/json-schema-generator' },
        { label: 'YAML ↔ JSON', href: '/tools/yaml-to-json' },
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

        {/* Indent Size (only for format) */}
        {activeTab === 'format' && (
          <div class="flex items-center gap-2 ml-auto">
            <label class="text-sm text-gray-500 dark:text-gray-400">Indent:</label>
            <select
              value={indentSize}
              onChange={(e) => setIndentSize(Number((e.target as HTMLSelectElement).value))}
              class="px-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
              <option value={2}>2 spaces</option>
              <option value={4}>4 spaces</option>
              <option value={8}>8 spaces</option>
            </select>
          </div>
        )}
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
            placeholder='Paste your JSON here...\n\nExample: {"key": "value"}'
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
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
              {activeTab === 'tree' ? 'Tree View' : activeTab === 'path' ? 'Path Result' : 'Output'}
            </label>
            <div class="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={activeTab === 'tree' || (!output && !pathResult) || output === 'Valid JSON'}
                class="px-3 py-1 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Download
              </button>
              <button
                onClick={handleCopy}
                disabled={activeTab === 'tree' || (!output && !pathResult) || output === 'Valid JSON'}
                class={`px-3 py-1 text-xs font-medium rounded-lg transition-all duration-200 ${
                  copied
                    ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={async () => {
                  const url = getShareUrl();
                  try { await navigator.clipboard.writeText(url); } catch {}
                }}
                disabled={!input.trim()}
                class="px-3 py-1 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Copy shareable link"
              >
                Share
              </button>
            </div>
          </div>

          {/* Tree View */}
          {activeTab === 'tree' ? (
            <div class="w-full h-80 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-mono text-sm overflow-auto">
              {parsedJson !== null ? (
                <TreeNode name="root" value={parsedJson} depth={0} defaultOpen={true} />
              ) : (
                <p class="text-gray-400 dark:text-gray-500">
                  {input.trim() ? 'Invalid JSON — fix errors to see the tree.' : 'Enter JSON on the left to see the tree view.'}
                </p>
              )}
            </div>
          ) : activeTab === 'path' ? (
            <div class="space-y-2">
              <div class="flex gap-2">
                <input
                  type="text"
                  value={jsonPath}
                  onInput={(e) => setJsonPath((e.target as HTMLInputElement).value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handlePathQuery(); }}
                  placeholder="$.store.book[0].title"
                  class="flex-1 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
                <button
                  onClick={handlePathQuery}
                  class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-all duration-200"
                >
                  Query
                </button>
              </div>
              <textarea
                value={pathResult}
                readOnly
                placeholder="Query results will appear here..."
                class="w-full h-[268px] p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-mono text-sm resize-none outline-none"
                spellcheck={false}
              />
            </div>
          ) : (
            <div class="relative">
              <textarea
                value={output}
                readOnly
                placeholder="Output will appear here..."
                class={`w-full h-80 p-4 bg-white dark:bg-gray-900 border rounded-xl font-mono text-sm resize-none outline-none ${
                  error
                    ? 'border-red-300 dark:border-red-800'
                    : output === 'Valid JSON'
                      ? 'border-green-300 dark:border-green-800'
                      : 'border-gray-200 dark:border-gray-700'
                }`}
                spellcheck={false}
              />
              {output === 'Valid JSON' && (
                <div class="absolute top-4 left-4 right-4 flex items-center gap-2 text-green-600 dark:text-green-400">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span class="font-semibold">Valid JSON</span>
                </div>
              )}
            </div>
          )}
          {output && output !== 'Valid JSON' && activeTab !== 'tree' && activeTab !== 'path' && (
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
            <p class="text-sm font-medium text-red-800 dark:text-red-200">Invalid JSON</p>
            <p class="text-sm text-red-600 dark:text-red-400 mt-1 font-mono">{error}</p>
          </div>
        </div>
      )}

      {/* Action Button */}
      {activeTab !== 'tree' && activeTab !== 'path' && (
        <div class="flex justify-center">
          <button
            onClick={() => processJson(activeTab)}
            class="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
          >
            {activeTab === 'format' ? 'Format JSON' : activeTab === 'validate' ? 'Validate JSON' : 'Minify JSON'}
          </button>
        </div>
      )}
    </div>
  );
}
