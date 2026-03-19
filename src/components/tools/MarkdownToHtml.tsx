import { useState, useCallback, useMemo } from 'preact/hooks';
import DOMPurify from 'dompurify';

type OutputTab = 'preview' | 'source';

function parseMarkdown(md: string): string {
  if (!md.trim()) return '';

  let html = md;

  // Code blocks (``` ... ```) — must be processed before inline rules
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, _lang, code) => {
    const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').trimEnd();
    return `<pre><code>${escaped}</code></pre>`;
  });

  // Split into blocks, preserving <pre> blocks
  const blocks: string[] = [];
  const parts = html.split(/(<pre><code>[\s\S]*?<\/code><\/pre>)/);
  for (const part of parts) {
    if (part.startsWith('<pre><code>')) {
      blocks.push(part);
    } else {
      blocks.push(...processBlocks(part));
    }
  }

  return blocks.join('\n');
}

function processBlocks(text: string): string[] {
  const lines = text.split('\n');
  const result: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Empty line
    if (!line.trim()) {
      i++;
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|_{3,}|\*{3,})\s*$/.test(line.trim())) {
      result.push('<hr />');
      i++;
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const content = inlineFormat(headingMatch[2].trim());
      result.push(`<h${level}>${content}</h${level}>`);
      i++;
      continue;
    }

    // Blockquote
    if (line.trimStart().startsWith('> ')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trimStart().startsWith('> ')) {
        quoteLines.push(lines[i].replace(/^\s*>\s?/, ''));
        i++;
      }
      result.push(`<blockquote><p>${inlineFormat(quoteLines.join(' '))}</p></blockquote>`);
      continue;
    }

    // Unordered list
    if (/^\s*[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        items.push(inlineFormat(lines[i].replace(/^\s*[-*+]\s+/, '')));
        i++;
      }
      result.push('<ul>' + items.map((item) => `<li>${item}</li>`).join('') + '</ul>');
      continue;
    }

    // Ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(inlineFormat(lines[i].replace(/^\s*\d+\.\s+/, '')));
        i++;
      }
      result.push('<ol>' + items.map((item) => `<li>${item}</li>`).join('') + '</ol>');
      continue;
    }

    // Paragraph — collect consecutive non-special lines
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^#{1,6}\s/.test(lines[i]) &&
      !/^\s*[-*+]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !/^\s*>\s/.test(lines[i]) &&
      !/^(-{3,}|_{3,}|\*{3,})\s*$/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      result.push(`<p>${inlineFormat(paraLines.join(' '))}</p>`);
    }
  }

  return result;
}

function inlineFormat(text: string): string {
  // Inline code (must come before bold/italic to avoid conflicts)
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Images
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');
  // Links
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  // Bold
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/__(.+?)__/g, '<strong>$1</strong>');
  // Italic
  text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
  text = text.replace(/_(.+?)_/g, '<em>$1</em>');
  return text;
}

const SAMPLE_MARKDOWN = `# Markdown to HTML Demo

## Features

This tool converts **Markdown** to **HTML** in real-time. It supports *many* common elements.

### Text Formatting

You can use **bold text**, *italic text*, and \`inline code\` in your documents.

### Lists

Unordered list:

- First item
- Second item
- Third item

Ordered list:

1. Step one
2. Step two
3. Step three

### Code Block

\`\`\`javascript
function greet(name) {
  console.log("Hello, " + name + "!");
}
\`\`\`

### Links and Images

Visit [OpenAI](https://openai.com) for more info.

![Placeholder](https://via.placeholder.com/150)

### Blockquote

> The best way to predict the future is to invent it.

---

That's it! Start typing your own Markdown on the left.`;

export default function MarkdownToHtml() {
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState<OutputTab>('preview');
  const [copied, setCopied] = useState(false);

  const htmlOutput = useMemo(() => parseMarkdown(input), [input]);

  const handleCopy = useCallback(async () => {
    if (!htmlOutput) return;
    try {
      await navigator.clipboard.writeText(htmlOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = htmlOutput;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [htmlOutput]);

  const handleClear = () => {
    setInput('');
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
    setInput(SAMPLE_MARKDOWN);
  };

  const outputTabs: { key: OutputTab; label: string; icon: string }[] = [
    { key: 'preview', label: 'Preview', icon: '\u25B6' },
    { key: 'source', label: 'HTML Source', icon: '</>' },
  ];

  return (
    <div class="space-y-6">
      {/* Output Tabs */}
      <div class="flex flex-wrap gap-2">
        {outputTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
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
      </div>

      {/* Editor Area */}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Input */}
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Markdown</label>
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
            placeholder={'Write Markdown here...\n\nExample: # Hello World'}
            class="w-full h-96 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-mono text-sm resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all duration-200"
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
              {activeTab === 'preview' ? 'Preview' : 'HTML Source'}
            </label>
            <button
              onClick={handleCopy}
              disabled={!htmlOutput}
              class={`px-3 py-1 text-xs font-medium rounded-lg transition-all duration-200 ${
                copied
                  ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {copied ? 'Copied!' : 'Copy HTML'}
            </button>
          </div>

          {activeTab === 'preview' ? (
            <div
              class="w-full h-96 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm overflow-auto prose dark:prose-invert max-w-none prose-sm prose-headings:mt-4 prose-headings:mb-2 prose-p:my-2 prose-pre:bg-gray-100 prose-pre:dark:bg-gray-800 prose-code:text-primary-600 prose-code:dark:text-primary-400 prose-blockquote:border-primary-500 prose-a:text-primary-600 prose-a:dark:text-primary-400 prose-img:rounded-lg prose-hr:my-4"
              dangerouslySetInnerHTML={{ __html: htmlOutput ? DOMPurify.sanitize(htmlOutput) : '<span class="text-gray-400">Preview will appear here...</span>' }}
            />
          ) : (
            <textarea
              value={htmlOutput}
              readOnly
              placeholder="HTML source will appear here..."
              class="w-full h-96 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-mono text-sm resize-none outline-none"
              spellcheck={false}
            />
          )}

          {htmlOutput && (
            <div class="flex items-center justify-between text-xs text-gray-400">
              <span>{htmlOutput.length} characters</span>
              <span>{htmlOutput.split('\n').length} lines</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
