import { useState, useCallback } from 'preact/hooks';

// Simple YAML parser for common cases
function parseYaml(yaml: string): any {
  const lines = yaml.split('\n');
  const root: any = {};
  const stack: { obj: any; indent: number; key: string }[] = [{ obj: root, indent: -1, key: '' }];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith('#')) continue;

    const indent = line.search(/\S/);
    const content = line.trim();

    // Pop stack to correct level
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    const parent = stack[stack.length - 1].obj;

    // Array item
    if (content.startsWith('- ')) {
      const val = content.slice(2).trim();
      if (Array.isArray(parent)) {
        parent.push(parseValue(val));
      } else {
        // Find the key this array belongs to
        const lastKey = stack[stack.length - 1].key;
        if (lastKey && !Array.isArray(parent[lastKey])) {
          parent[lastKey] = [];
        }
        if (lastKey) parent[lastKey].push(parseValue(val));
      }
      continue;
    }

    // Key: value
    const colonIdx = content.indexOf(':');
    if (colonIdx === -1) continue;

    const key = content.slice(0, colonIdx).trim();
    const valStr = content.slice(colonIdx + 1).trim();

    if (valStr === '' || valStr === '|' || valStr === '>') {
      // Nested object or block scalar
      if (valStr === '|' || valStr === '>') {
        // Collect block scalar
        let block = '';
        let j = i + 1;
        const blockIndent = indent + 2;
        while (j < lines.length) {
          const bl = lines[j];
          if (bl.trim() === '' || bl.search(/\S/) >= blockIndent) {
            block += (bl.trim() === '' ? '' : bl.slice(blockIndent)) + (valStr === '|' ? '\n' : ' ');
            j++;
          } else break;
        }
        parent[key] = block.trim();
        i = j - 1;
      } else {
        parent[key] = {};
        stack.push({ obj: parent[key], indent, key });
      }
    } else {
      parent[key] = parseValue(valStr);
    }
  }
  return root;
}

function parseValue(val: string): any {
  if (val === 'true' || val === 'True' || val === 'TRUE') return true;
  if (val === 'false' || val === 'False' || val === 'FALSE') return false;
  if (val === 'null' || val === 'Null' || val === 'NULL' || val === '~') return null;
  if (/^-?\d+$/.test(val)) return parseInt(val, 10);
  if (/^-?\d+\.\d+$/.test(val)) return parseFloat(val);
  // Remove quotes
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    return val.slice(1, -1);
  }
  // Inline array
  if (val.startsWith('[') && val.endsWith(']')) {
    try { return JSON.parse(val); } catch { return val; }
  }
  // Inline object
  if (val.startsWith('{') && val.endsWith('}')) {
    try { return JSON.parse(val); } catch { return val; }
  }
  return val;
}

function jsonToYaml(obj: any, indent: number = 0): string {
  const pad = '  '.repeat(indent);
  if (obj === null) return 'null';
  if (typeof obj === 'boolean') return obj ? 'true' : 'false';
  if (typeof obj === 'number') return String(obj);
  if (typeof obj === 'string') {
    if (obj.includes('\n') || obj.includes(':') || obj.includes('#') || obj.startsWith(' ')) {
      return `"${obj.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
    }
    return obj;
  }
  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    return obj.map(item => {
      const val = jsonToYaml(item, indent + 1);
      if (typeof item === 'object' && item !== null) {
        return `${pad}- ${val.trim()}`;
      }
      return `${pad}- ${val}`;
    }).join('\n');
  }
  if (typeof obj === 'object') {
    const entries = Object.entries(obj);
    if (entries.length === 0) return '{}';
    return entries.map(([key, val]) => {
      if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
        return `${pad}${key}:\n${jsonToYaml(val, indent + 1)}`;
      }
      if (Array.isArray(val)) {
        return `${pad}${key}:\n${jsonToYaml(val, indent + 1)}`;
      }
      return `${pad}${key}: ${jsonToYaml(val, indent)}`;
    }).join('\n');
  }
  return String(obj);
}

export default function YamlToJson() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'yaml-to-json' | 'json-to-yaml'>('yaml-to-json');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleConvert = useCallback(() => {
    if (!input.trim()) return;
    setError('');
    try {
      if (mode === 'yaml-to-json') {
        const parsed = parseYaml(input);
        setOutput(JSON.stringify(parsed, null, 2));
      } else {
        const parsed = JSON.parse(input);
        setOutput(jsonToYaml(parsed));
      }
      setCopied(false);
    } catch (e: any) {
      setError(e.message || 'Conversion failed');
      setOutput('');
    }
  }, [input, mode]);

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
    setError('');
    setCopied(false);
  };

  const handleSample = () => {
    if (mode === 'yaml-to-json') {
      setInput(`# Docker Compose example
version: "3.8"
services:
  web:
    image: nginx:alpine
    ports:
      - "80:80"
    environment:
      NODE_ENV: production
      DEBUG: false
    volumes:
      - ./html:/usr/share/nginx/html
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: secret123
    ports:
      - "5432:5432"`);
    } else {
      setInput(JSON.stringify({
        version: "3.8",
        services: {
          web: {
            image: "nginx:alpine",
            ports: ["80:80"],
            environment: { NODE_ENV: "production", DEBUG: false }
          }
        }
      }, null, 2));
    }
    setOutput('');
    setError('');
    setCopied(false);
  };

  return (
    <div class="space-y-6">
      {/* Mode Toggle */}
      <div class="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
        <button
          onClick={() => { setMode('yaml-to-json'); setOutput(''); setError(''); }}
          class={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
            mode === 'yaml-to-json'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          YAML → JSON
        </button>
        <button
          onClick={() => { setMode('json-to-yaml'); setOutput(''); setError(''); }}
          class={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
            mode === 'json-to-yaml'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          JSON → YAML
        </button>
      </div>

      {/* Input */}
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {mode === 'yaml-to-json' ? 'YAML Input' : 'JSON Input'}
        </label>
        <textarea
          value={input}
          onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
          placeholder={mode === 'yaml-to-json' ? 'Paste your YAML here...' : 'Paste your JSON here...'}
          class="w-full h-56 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-y"
        />
      </div>

      {/* Error */}
      {error && (
        <div class="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Buttons */}
      <div class="flex flex-wrap gap-3">
        <button
          onClick={handleConvert}
          class="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
        >
          Convert
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
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {mode === 'yaml-to-json' ? 'JSON Output' : 'YAML Output'}
          </label>
          <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <pre class="text-sm font-mono text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{output}</pre>
          </div>
        </div>
      ) : (
        <div class="flex items-center justify-center h-32 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl">
          <p class="text-gray-400 dark:text-gray-500 text-sm">
            {mode === 'yaml-to-json' ? 'JSON output will appear here' : 'YAML output will appear here'}
          </p>
        </div>
      )}
    </div>
  );
}
