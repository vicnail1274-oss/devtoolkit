import { useState, useCallback, useMemo, useEffect, useRef } from 'preact/hooks';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import css from 'highlight.js/lib/languages/css';
import xml from 'highlight.js/lib/languages/xml';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import sql from 'highlight.js/lib/languages/sql';
import markdown from 'highlight.js/lib/languages/markdown';
import yaml from 'highlight.js/lib/languages/yaml';
import go from 'highlight.js/lib/languages/go';
import rust from 'highlight.js/lib/languages/rust';
import java from 'highlight.js/lib/languages/java';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('ts', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('py', python);
hljs.registerLanguage('css', css);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('json', json);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('sh', bash);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('md', markdown);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('yml', yaml);
hljs.registerLanguage('go', go);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('java', java);

type ViewMode = 'split' | 'editor' | 'preview';

const STORAGE_KEY = 'devtoolkit-md-editor-content';

const SAMPLE_MARKDOWN = `# Markdown Preview & Editor

## GFM Features

This editor supports **GitHub Flavored Markdown** with live preview.

### Task Lists

- [x] GFM table support
- [x] Task list checkboxes
- [x] Syntax highlighting
- [ ] Your next great idea

### Tables

| Feature | Status | Notes |
|---------|--------|-------|
| Bold/Italic | ✅ | \`**bold**\` and \`*italic*\` |
| Code blocks | ✅ | With syntax highlighting |
| Tables | ✅ | GFM style |
| Links | ✅ | \`[text](url)\` |

### Code with Syntax Highlighting

\`\`\`javascript
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10)); // 55
\`\`\`

\`\`\`python
def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)
\`\`\`

### Blockquote

> The best way to predict the future is to invent it.
> — Alan Kay

### Horizontal Rule

---

### Links & Images

Visit [DevToolkit](https://devtoolkit-db7.pages.dev/) for more free tools.

Start editing on the left to see your changes in real-time!`;

marked.setOptions({
  gfm: true,
  breaks: true,
  async: false,
  pedantic: false,
});

marked.use({
  renderer: {
    code({ text, lang }: { text: string; lang?: string }) {
      const language = lang && hljs.getLanguage(lang) ? lang : null;
      let highlighted: string;
      if (language) {
        try {
          highlighted = hljs.highlight(text, { language }).value;
        } catch {
          highlighted = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }
      } else {
        highlighted = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      }
      return `<pre class="hljs"><code class="language-${language || 'text'}">${highlighted}</code></pre>`;
    },
  },
});

function renderMarkdown(md: string): string {
  if (!md.trim()) return '';
  try {
    return marked.parse(md) as string;
  } catch {
    return '<p style="color:red;">Error parsing markdown</p>';
  }
}

interface ToolbarAction {
  label: string;
  icon: string;
  prefix: string;
  suffix: string;
  block?: boolean;
}

const toolbarActions: ToolbarAction[] = [
  { label: 'Bold', icon: 'B', prefix: '**', suffix: '**' },
  { label: 'Italic', icon: 'I', prefix: '*', suffix: '*' },
  { label: 'Code', icon: '< >', prefix: '`', suffix: '`' },
  { label: 'Link', icon: '🔗', prefix: '[', suffix: '](url)' },
  { label: 'Heading', icon: 'H', prefix: '## ', suffix: '', block: true },
  { label: 'List', icon: '•', prefix: '- ', suffix: '', block: true },
  { label: 'Task', icon: '☑', prefix: '- [ ] ', suffix: '', block: true },
  { label: 'Quote', icon: '❝', prefix: '> ', suffix: '', block: true },
  { label: 'Code Block', icon: '{ }', prefix: '```\n', suffix: '\n```', block: true },
  { label: 'Table', icon: '⊞', prefix: '| Column 1 | Column 2 | Column 3 |\n|----------|----------|----------|\n| ', suffix: ' | data | data |', block: true },
];

export default function MarkdownPreviewEditor() {
  const [input, setInput] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [copied, setCopied] = useState<'md' | 'html' | null>(null);
  const [wordCount, setWordCount] = useState({ words: 0, chars: 0, lines: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setInput(saved);
      }
    } catch {
      // localStorage not available
    }
    setLoaded(true);
  }, []);

  // Auto-save to localStorage
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, input);
    } catch {
      // localStorage not available
    }
  }, [input, loaded]);

  // Word count
  useEffect(() => {
    const text = input.trim();
    setWordCount({
      words: text ? text.split(/\s+/).length : 0,
      chars: input.length,
      lines: input ? input.split('\n').length : 0,
    });
  }, [input]);

  const htmlOutput = useMemo(() => renderMarkdown(input), [input]);

  const handleToolbarAction = useCallback((action: ToolbarAction) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = input.substring(start, end);

    let newText: string;
    let cursorPos: number;

    if (action.block && start === end) {
      // For block actions with no selection, add on new line
      const beforeCursor = input.substring(0, start);
      const needsNewline = beforeCursor.length > 0 && !beforeCursor.endsWith('\n');
      const prefix = (needsNewline ? '\n' : '') + action.prefix;
      newText = input.substring(0, start) + prefix + action.suffix + input.substring(end);
      cursorPos = start + prefix.length;
    } else {
      newText = input.substring(0, start) + action.prefix + selected + action.suffix + input.substring(end);
      cursorPos = start + action.prefix.length + selected.length + action.suffix.length;
    }

    setInput(newText);
    // Restore focus and cursor position
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(cursorPos, cursorPos);
    }, 0);
  }, [input]);

  const handleCopy = useCallback(async (type: 'md' | 'html') => {
    const text = type === 'md' ? input : htmlOutput;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }, [input, htmlOutput]);

  const handleExportHtml = useCallback(() => {
    if (!htmlOutput) return;
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Markdown Export</title>
<style>
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #333; }
h1, h2, h3 { margin-top: 1.5em; }
code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-size: 0.9em; }
pre { background: #f4f4f4; padding: 16px; border-radius: 8px; overflow-x: auto; }
pre code { background: none; padding: 0; }
blockquote { border-left: 4px solid #ddd; margin: 1em 0; padding: 0.5em 1em; color: #666; }
table { border-collapse: collapse; width: 100%; margin: 1em 0; }
th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
th { background: #f8f8f8; font-weight: 600; }
img { max-width: 100%; }
a { color: #0066cc; }
hr { border: none; border-top: 1px solid #ddd; margin: 2em 0; }
ul.contains-task-list { list-style: none; padding-left: 0; }
</style>
</head>
<body>
${htmlOutput}
</body>
</html>`;
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'markdown-export.html';
    a.click();
    URL.revokeObjectURL(url);
  }, [htmlOutput]);

  const handleClear = () => {
    setInput('');
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
    } catch {}
  };

  const loadSample = () => setInput(SAMPLE_MARKDOWN);

  const viewModes: { key: ViewMode; label: string; icon: string }[] = [
    { key: 'split', label: 'Split', icon: '⬜⬜' },
    { key: 'editor', label: 'Editor', icon: '✏️' },
    { key: 'preview', label: 'Preview', icon: '👁' },
  ];

  return (
    <div class="space-y-4">
      {/* Top bar: view mode + actions */}
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex gap-2">
          {viewModes.map((mode) => (
            <button
              key={mode.key}
              onClick={() => setViewMode(mode.key)}
              class={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                viewMode === mode.key
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
              }`}
            >
              <span class="mr-1">{mode.icon}</span>
              {mode.label}
            </button>
          ))}
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            onClick={handlePaste}
            class="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
          >
            Paste
          </button>
          <button
            onClick={loadSample}
            class="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
          >
            Sample
          </button>
          <button
            onClick={() => handleCopy('md')}
            disabled={!input}
            class={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
              copied === 'md'
                ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {copied === 'md' ? 'Copied!' : 'Copy MD'}
          </button>
          <button
            onClick={() => handleCopy('html')}
            disabled={!htmlOutput}
            class={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
              copied === 'html'
                ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {copied === 'html' ? 'Copied!' : 'Copy HTML'}
          </button>
          <button
            onClick={handleExportHtml}
            disabled={!htmlOutput}
            class="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Export HTML
          </button>
          <button
            onClick={handleClear}
            class="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Toolbar */}
      {viewMode !== 'preview' && (
        <div class="flex flex-wrap gap-1 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          {toolbarActions.map((action) => (
            <button
              key={action.label}
              onClick={() => handleToolbarAction(action)}
              title={action.label}
              class="px-2.5 py-1.5 text-xs font-medium rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 transition-all duration-150"
            >
              {action.icon}
            </button>
          ))}
        </div>
      )}

      {/* Editor + Preview */}
      <div class={`grid gap-4 ${
        viewMode === 'split' ? 'grid-cols-1 lg:grid-cols-2' :
        'grid-cols-1'
      }`}>
        {/* Editor */}
        {viewMode !== 'preview' && (
          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Markdown</label>
            <textarea
              ref={textareaRef}
              value={input}
              onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
              placeholder="Start typing Markdown here..."
              class="w-full p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-mono text-sm resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all duration-200"
              style={{ minHeight: viewMode === 'editor' ? '600px' : '500px' }}
              spellcheck={false}
              onKeyDown={(e) => {
                // Tab key inserts spaces
                if (e.key === 'Tab') {
                  e.preventDefault();
                  const ta = e.target as HTMLTextAreaElement;
                  const start = ta.selectionStart;
                  const end = ta.selectionEnd;
                  const newVal = input.substring(0, start) + '  ' + input.substring(end);
                  setInput(newVal);
                  setTimeout(() => {
                    ta.selectionStart = ta.selectionEnd = start + 2;
                  }, 0);
                }
              }}
            />
          </div>
        )}

        {/* Preview */}
        {viewMode !== 'editor' && (
          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Preview</label>
            <div
              class="w-full p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm overflow-auto prose dark:prose-invert max-w-none prose-sm prose-headings:mt-4 prose-headings:mb-2 prose-p:my-2 prose-pre:bg-gray-100 prose-pre:dark:bg-gray-800 prose-code:text-primary-600 prose-code:dark:text-primary-400 prose-blockquote:border-primary-500 prose-a:text-primary-600 prose-a:dark:text-primary-400 prose-img:rounded-lg prose-hr:my-4 prose-table:border-collapse prose-th:border prose-th:border-gray-300 prose-th:dark:border-gray-600 prose-th:p-2 prose-th:bg-gray-50 prose-th:dark:bg-gray-800 prose-td:border prose-td:border-gray-300 prose-td:dark:border-gray-600 prose-td:p-2"
              style={{ minHeight: viewMode === 'preview' ? '600px' : '500px' }}
              dangerouslySetInnerHTML={{
                __html: htmlOutput ? DOMPurify.sanitize(htmlOutput) : '<span class="text-gray-400 italic">Preview will appear here as you type...</span>',
              }}
            />
          </div>
        )}
      </div>

      {/* Status bar */}
      <div class="flex flex-wrap items-center justify-between text-xs text-gray-400 gap-2">
        <div class="flex gap-4">
          <span>{wordCount.words} words</span>
          <span>{wordCount.chars} characters</span>
          <span>{wordCount.lines} lines</span>
        </div>
        <div class="flex gap-4">
          <span>Auto-saved to browser</span>
          <span>GFM enabled</span>
        </div>
      </div>
    </div>
  );
}
