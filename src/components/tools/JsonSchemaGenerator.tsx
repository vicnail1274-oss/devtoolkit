import { useState, useCallback } from 'preact/hooks';

interface SchemaResult {
  schema: object;
  stats: { properties: number; nested: number; arrays: number };
}

function inferType(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function generateSchema(value: unknown, required: boolean = true): object {
  if (value === null) return { type: 'null' };
  if (Array.isArray(value)) {
    if (value.length === 0) return { type: 'array', items: {} };
    return { type: 'array', items: generateSchema(value[0], false) };
  }
  switch (typeof value) {
    case 'string': return { type: 'string' };
    case 'number': return Number.isInteger(value) ? { type: 'integer' } : { type: 'number' };
    case 'boolean': return { type: 'boolean' };
    case 'object': {
      const obj = value as Record<string, unknown>;
      const properties: Record<string, object> = {};
      const requiredKeys: string[] = [];
      for (const [k, v] of Object.entries(obj)) {
        properties[k] = generateSchema(v, true);
        if (v !== null && v !== undefined) requiredKeys.push(k);
      }
      const schema: Record<string, unknown> = {
        type: 'object',
        properties,
      };
      if (requiredKeys.length > 0) schema.required = requiredKeys;
      return schema;
    }
    default: return {};
  }
}

function countStats(schema: Record<string, unknown>): { properties: number; nested: number; arrays: number } {
  let properties = 0;
  let nested = 0;
  let arrays = 0;

  function walk(s: Record<string, unknown>, depth: number) {
    if (s.type === 'object' && s.properties) {
      const props = s.properties as Record<string, Record<string, unknown>>;
      const keys = Object.keys(props);
      properties += keys.length;
      if (depth > 0) nested++;
      for (const k of keys) walk(props[k], depth + 1);
    }
    if (s.type === 'array') {
      arrays++;
      if (s.items && typeof s.items === 'object') walk(s.items as Record<string, unknown>, depth + 1);
    }
  }

  walk(schema, 0);
  return { properties, nested, arrays };
}

export default function JsonSchemaGenerator() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<{ properties: number; nested: number; arrays: number } | null>(null);
  const [draft, setDraft] = useState<'draft-07' | '2020-12'>('draft-07');
  const [indent, setIndent] = useState(2);

  const generate = useCallback(() => {
    setError('');
    setOutput('');
    setStats(null);

    if (!input.trim()) {
      setError('Please enter some JSON to generate a schema from.');
      return;
    }

    try {
      const parsed = JSON.parse(input);
      const schema = generateSchema(parsed) as Record<string, unknown>;

      if (draft === 'draft-07') {
        schema.$schema = 'http://json-schema.org/draft-07/schema#';
      } else {
        schema.$schema = 'https://json-schema.org/draft/2020-12/schema';
      }

      const st = countStats(schema);
      setStats(st);
      setOutput(JSON.stringify(schema, null, indent));
    } catch (e: any) {
      setError(e.message || 'Invalid JSON input');
    }
  }, [input, draft, indent]);

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
    setStats(null);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
    } catch {}
  };

  const loadSample = () => {
    const sample = JSON.stringify({
      id: 1,
      name: "DevToolkit",
      version: "2.0.0",
      active: true,
      tags: ["developer", "tools", "free"],
      author: {
        name: "VIC",
        email: "hello@devtoolkit.cc",
        social: { github: "vic", twitter: "vic_dev" }
      },
      features: [
        { name: "JSON Formatter", category: "Data", free: true },
        { name: "AI Code Review", category: "AI", free: false }
      ],
      stats: null
    }, null, 2);
    setInput(sample);
  };

  return (
    <div class="space-y-6">
      {/* Options */}
      <div class="flex flex-wrap gap-4 items-center">
        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-500 dark:text-gray-400">Schema Draft:</label>
          <select
            value={draft}
            onChange={(e) => setDraft((e.target as HTMLSelectElement).value as any)}
            class="px-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          >
            <option value="draft-07">Draft-07</option>
            <option value="2020-12">2020-12</option>
          </select>
        </div>
        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-500 dark:text-gray-400">Indent:</label>
          <select
            value={indent}
            onChange={(e) => setIndent(Number((e.target as HTMLSelectElement).value))}
            class="px-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          >
            <option value={2}>2 spaces</option>
            <option value={4}>4 spaces</option>
          </select>
        </div>
      </div>

      {/* Editor Area */}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Input */}
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">JSON Input</label>
            <div class="flex gap-2">
              <button onClick={handlePaste} class="px-3 py-1 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200">Paste</button>
              <button onClick={loadSample} class="px-3 py-1 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200">Sample</button>
              <button onClick={handleClear} class="px-3 py-1 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200">Clear</button>
            </div>
          </div>
          <textarea
            value={input}
            onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
            placeholder={'Paste your JSON here...\n\nExample: {"name": "John", "age": 30}'}
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
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">JSON Schema Output</label>
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
          </div>
          <textarea
            value={output}
            readOnly
            placeholder="Generated JSON Schema will appear here..."
            class={`w-full h-80 p-4 bg-white dark:bg-gray-900 border rounded-xl font-mono text-sm resize-none outline-none ${
              error ? 'border-red-300 dark:border-red-800' : 'border-gray-200 dark:border-gray-700'
            }`}
            spellcheck={false}
          />
          {output && (
            <div class="flex items-center justify-between text-xs text-gray-400">
              <span>{output.length} characters</span>
              <span>{output.split('\n').length} lines</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div class="flex flex-wrap gap-4">
          <div class="px-4 py-2 bg-primary-50 dark:bg-primary-950 rounded-lg text-sm">
            <span class="font-semibold text-primary-700 dark:text-primary-300">{stats.properties}</span>
            <span class="text-gray-500 dark:text-gray-400 ml-1">properties</span>
          </div>
          <div class="px-4 py-2 bg-primary-50 dark:bg-primary-950 rounded-lg text-sm">
            <span class="font-semibold text-primary-700 dark:text-primary-300">{stats.nested}</span>
            <span class="text-gray-500 dark:text-gray-400 ml-1">nested objects</span>
          </div>
          <div class="px-4 py-2 bg-primary-50 dark:bg-primary-950 rounded-lg text-sm">
            <span class="font-semibold text-primary-700 dark:text-primary-300">{stats.arrays}</span>
            <span class="text-gray-500 dark:text-gray-400 ml-1">arrays</span>
          </div>
        </div>
      )}

      {/* Error */}
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

      {/* Action */}
      <div class="flex justify-center">
        <button
          onClick={generate}
          class="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
        >
          Generate Schema
        </button>
      </div>
    </div>
  );
}
