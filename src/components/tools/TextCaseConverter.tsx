import { useState } from 'preact/hooks';

type CaseType =
  | 'uppercase'
  | 'lowercase'
  | 'titlecase'
  | 'sentencecase'
  | 'camelcase'
  | 'pascalcase'
  | 'snakecase'
  | 'kebabcase'
  | 'constantcase'
  | 'dotcase';

const CASES: { id: CaseType; label: string; example: string }[] = [
  { id: 'uppercase', label: 'UPPERCASE', example: 'HELLO WORLD' },
  { id: 'lowercase', label: 'lowercase', example: 'hello world' },
  { id: 'titlecase', label: 'Title Case', example: 'Hello World' },
  { id: 'sentencecase', label: 'Sentence case', example: 'Hello world' },
  { id: 'camelcase', label: 'camelCase', example: 'helloWorld' },
  { id: 'pascalcase', label: 'PascalCase', example: 'HelloWorld' },
  { id: 'snakecase', label: 'snake_case', example: 'hello_world' },
  { id: 'kebabcase', label: 'kebab-case', example: 'hello-world' },
  { id: 'constantcase', label: 'CONSTANT_CASE', example: 'HELLO_WORLD' },
  { id: 'dotcase', label: 'dot.case', example: 'hello.world' },
];

function splitWords(text: string): string[] {
  return text
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/[_\-./]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function convertCase(text: string, type: CaseType): string {
  if (!text) return '';

  switch (type) {
    case 'uppercase':
      return text.toUpperCase();
    case 'lowercase':
      return text.toLowerCase();
    case 'titlecase':
      return text
        .toLowerCase()
        .replace(/(^|\s)\S/g, (c) => c.toUpperCase());
    case 'sentencecase':
      return text
        .toLowerCase()
        .replace(/(^\s*\w|[.!?]\s+\w)/g, (c) => c.toUpperCase());
    case 'camelcase': {
      const words = splitWords(text);
      return words
        .map((w, i) =>
          i === 0
            ? w.toLowerCase()
            : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
        )
        .join('');
    }
    case 'pascalcase': {
      const words = splitWords(text);
      return words
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join('');
    }
    case 'snakecase':
      return splitWords(text).map((w) => w.toLowerCase()).join('_');
    case 'kebabcase':
      return splitWords(text).map((w) => w.toLowerCase()).join('-');
    case 'constantcase':
      return splitWords(text).map((w) => w.toUpperCase()).join('_');
    case 'dotcase':
      return splitWords(text).map((w) => w.toLowerCase()).join('.');
    default:
      return text;
  }
}

export default function TextCaseConverter() {
  const [input, setInput] = useState('');
  const [activeCase, setActiveCase] = useState<CaseType>('lowercase');
  const [copied, setCopied] = useState(false);

  const output = convertCase(input, activeCase);

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

  const handleClear = () => setInput('');

  const handlePaste = async () => {
    try {
      setInput(await navigator.clipboard.readText());
    } catch {}
  };

  const loadSample = () =>
    setInput('Hello World example_text kebab-style camelCaseWord');

  return (
    <div class="space-y-6">
      {/* Input */}
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Input Text</label>
          <div class="flex gap-2">
            <button onClick={handlePaste} class="px-3 py-1 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">Paste</button>
            <button onClick={loadSample} class="px-3 py-1 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">Sample</button>
            <button onClick={handleClear} class="px-3 py-1 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">Clear</button>
          </div>
        </div>
        <textarea
          value={input}
          onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
          placeholder="Enter text to convert..."
          class="w-full h-32 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-mono text-sm resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
          spellcheck={false}
        />
        <div class="text-xs text-gray-400">{input.length} characters &middot; {input ? splitWords(input).length : 0} words</div>
      </div>

      {/* Case Buttons */}
      <div class="space-y-2">
        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Convert To</label>
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {CASES.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCase(c.id)}
              class={`px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                activeCase === c.id
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Output */}
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Result</label>
          <button
            onClick={handleCopy}
            disabled={!output}
            class={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
              copied
                ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <div class="w-full min-h-[8rem] p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-mono text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-all">
          {output || <span class="text-gray-400 dark:text-gray-600 italic font-sans">Output will appear here...</span>}
        </div>
      </div>
    </div>
  );
}
