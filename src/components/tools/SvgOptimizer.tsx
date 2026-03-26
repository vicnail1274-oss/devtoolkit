import { useState, useMemo, useRef } from 'preact/hooks';
import QuickNav from '../QuickNav';

interface OptimizationResult {
  output: string;
  originalSize: number;
  optimizedSize: number;
  savings: number;
  savingsPercent: number;
  operations: string[];
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

interface OptimizeOptions {
  removeComments: boolean;
  removeMetadata: boolean;
  removeEmptyAttrs: boolean;
  removeDefaultValues: boolean;
  cleanupIds: boolean;
  removeDoctype: boolean;
  removeXmlDeclaration: boolean;
  minifyStyles: boolean;
  shortenColors: boolean;
  removeWhitespace: boolean;
  removeDimensions: boolean;
  roundNumbers: boolean;
  precision: number;
}

function optimizeSvg(input: string, options: OptimizeOptions): OptimizationResult {
  const originalSize = new Blob([input]).size;
  const operations: string[] = [];
  let svg = input;

  if (options.removeXmlDeclaration) {
    const before = svg;
    svg = svg.replace(/<\?xml[^?]*\?>\s*/gi, '');
    if (svg !== before) operations.push('Removed XML declaration');
  }

  if (options.removeDoctype) {
    const before = svg;
    svg = svg.replace(/<!DOCTYPE[^>]*>\s*/gi, '');
    if (svg !== before) operations.push('Removed DOCTYPE');
  }

  if (options.removeComments) {
    const before = svg;
    svg = svg.replace(/<!--[\s\S]*?-->/g, '');
    if (svg !== before) operations.push('Removed comments');
  }

  if (options.removeMetadata) {
    const before = svg;
    svg = svg.replace(/<metadata[\s\S]*?<\/metadata>/gi, '');
    svg = svg.replace(/<title[\s\S]*?<\/title>/gi, '');
    svg = svg.replace(/<desc[\s\S]*?<\/desc>/gi, '');
    if (svg !== before) operations.push('Removed metadata (metadata, title, desc)');
  }

  if (options.removeEmptyAttrs) {
    const before = svg;
    svg = svg.replace(/\s+[a-zA-Z-]+=""\s*/g, ' ');
    if (svg !== before) operations.push('Removed empty attributes');
  }

  if (options.removeDefaultValues) {
    const before = svg;
    const defaults: [RegExp, string][] = [
      [/\s+fill-opacity="1"/g, ''],
      [/\s+stroke-opacity="1"/g, ''],
      [/\s+opacity="1"/g, ''],
      [/\s+fill-rule="nonzero"/g, ''],
      [/\s+clip-rule="nonzero"/g, ''],
      [/\s+stroke="none"/g, ''],
      [/\s+stroke-width="1"/g, ''],
      [/\s+stroke-dashoffset="0"/g, ''],
      [/\s+stroke-linejoin="miter"/g, ''],
      [/\s+stroke-linecap="butt"/g, ''],
      [/\s+stroke-miterlimit="4"/g, ''],
      [/\s+font-style="normal"/g, ''],
      [/\s+font-weight="normal"/g, ''],
      [/\s+text-decoration="none"/g, ''],
      [/\s+visibility="visible"/g, ''],
      [/\s+display="inline"/g, ''],
      [/\s+overflow="visible"/g, ''],
    ];
    for (const [pattern, replacement] of defaults) {
      svg = svg.replace(pattern, replacement);
    }
    if (svg !== before) operations.push('Removed default attribute values');
  }

  if (options.minifyStyles) {
    const before = svg;
    svg = svg.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (match, content: string) => {
      let minified = content
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\s+/g, ' ')
        .replace(/\s*{\s*/g, '{')
        .replace(/\s*}\s*/g, '}')
        .replace(/\s*;\s*/g, ';')
        .replace(/\s*:\s*/g, ':')
        .replace(/;}/g, '}')
        .trim();
      return match.replace(content, minified);
    });
    if (svg !== before) operations.push('Minified inline styles');
  }

  if (options.shortenColors) {
    const before = svg;
    svg = svg.replace(/#([0-9a-fA-F])\1([0-9a-fA-F])\2([0-9a-fA-F])\3/g, '#$1$2$3');
    const colorMap: Record<string, string> = {
      '#000000': '#000', '#111111': '#111', '#222222': '#222', '#333333': '#333',
      '#444444': '#444', '#555555': '#555', '#666666': '#666', '#777777': '#777',
      '#888888': '#888', '#999999': '#999', '#aaaaaa': '#aaa', '#bbbbbb': '#bbb',
      '#cccccc': '#ccc', '#dddddd': '#ddd', '#eeeeee': '#eee', '#ffffff': '#fff',
    };
    for (const [long, short] of Object.entries(colorMap)) {
      svg = svg.split(long).join(short);
      svg = svg.split(long.toUpperCase()).join(short);
    }
    if (svg !== before) operations.push('Shortened color values');
  }

  if (options.roundNumbers) {
    const before = svg;
    const precision = options.precision;
    svg = svg.replace(/(\d+\.\d{3,})/g, (match) => {
      const num = parseFloat(match);
      return isNaN(num) ? match : num.toFixed(precision).replace(/\.?0+$/, '') || '0';
    });
    if (svg !== before) operations.push(`Rounded numbers to ${precision} decimal places`);
  }

  if (options.removeDimensions) {
    const before = svg;
    svg = svg.replace(/(<svg[^>]*?)\s+width="[^"]*"/i, '$1');
    svg = svg.replace(/(<svg[^>]*?)\s+height="[^"]*"/i, '$1');
    if (svg !== before) operations.push('Removed width/height (uses viewBox)');
  }

  if (options.removeWhitespace) {
    const before = svg;
    svg = svg.replace(/>\s+</g, '><');
    svg = svg.replace(/\n/g, '');
    svg = svg.replace(/\s{2,}/g, ' ');
    svg = svg.trim();
    if (svg !== before) operations.push('Removed unnecessary whitespace');
  }

  // Clean up multiple consecutive spaces in attribute values
  svg = svg.replace(/  +/g, ' ');

  const optimizedSize = new Blob([svg]).size;
  const savings = originalSize - optimizedSize;
  const savingsPercent = originalSize > 0 ? (savings / originalSize) * 100 : 0;

  return { output: svg, originalSize, optimizedSize, savings, savingsPercent, operations };
}

const SAMPLE_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Generator: Adobe Illustrator 24.0, SVG Export -->
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="200px" height="200px" viewBox="0 0 200 200">
  <metadata>
    <title>Sample Icon</title>
    <desc>A sample SVG icon for optimization testing</desc>
  </metadata>
  <defs>
    <linearGradient id="myGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1.000000"/>
      <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1.000000"/>
    </linearGradient>
    <style type="text/css">
      .icon-bg {
        fill: url(#myGradient);
        fill-opacity: 1;
        stroke: none;
        stroke-width: 1;
      }
      .icon-text {
        fill: #ffffff;
        font-family: sans-serif;
        font-weight: normal;
        font-style: normal;
        text-decoration: none;
      }
    </style>
  </defs>
  <rect class="icon-bg" x="0" y="0" width="200" height="200" rx="20.000000" ry="20.000000" display="inline" visibility="visible" overflow="visible" />
  <text class="icon-text" x="100" y="115" text-anchor="middle" font-size="48">&lt;/&gt;</text>
</svg>`;

export default function SvgOptimizer() {
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [options, setOptions] = useState<OptimizeOptions>({
    removeComments: true,
    removeMetadata: true,
    removeEmptyAttrs: true,
    removeDefaultValues: true,
    cleanupIds: false,
    removeDoctype: true,
    removeXmlDeclaration: true,
    minifyStyles: true,
    shortenColors: true,
    removeWhitespace: true,
    removeDimensions: false,
    roundNumbers: true,
    precision: 2,
  });

  const result = useMemo(() => {
    if (!input.trim()) return null;
    return optimizeSvg(input, options);
  }, [input, options]);

  const handleFileUpload = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.svg') && file.type !== 'image/svg+xml') return;
    const reader = new FileReader();
    reader.onload = () => setInput(reader.result as string);
    reader.readAsText(file);
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.output);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = result.output;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result.output], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'optimized.svg';
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleOption = (key: keyof OptimizeOptions) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const optionGroups = [
    {
      title: 'Cleanup',
      items: [
        { key: 'removeComments' as const, label: 'Remove comments' },
        { key: 'removeMetadata' as const, label: 'Remove metadata (title, desc, metadata)' },
        { key: 'removeDoctype' as const, label: 'Remove DOCTYPE' },
        { key: 'removeXmlDeclaration' as const, label: 'Remove XML declaration' },
      ],
    },
    {
      title: 'Attributes',
      items: [
        { key: 'removeEmptyAttrs' as const, label: 'Remove empty attributes' },
        { key: 'removeDefaultValues' as const, label: 'Remove default values' },
        { key: 'removeDimensions' as const, label: 'Remove width/height (prefer viewBox)' },
      ],
    },
    {
      title: 'Minification',
      items: [
        { key: 'minifyStyles' as const, label: 'Minify inline CSS' },
        { key: 'shortenColors' as const, label: 'Shorten hex colors' },
        { key: 'removeWhitespace' as const, label: 'Remove whitespace' },
        { key: 'roundNumbers' as const, label: 'Round decimal numbers' },
      ],
    },
  ];

  const selectAll = () => {
    setOptions(prev => {
      const next = { ...prev };
      for (const group of optionGroups) {
        for (const item of group.items) {
          (next as any)[item.key] = true;
        }
      }
      return next;
    });
  };

  const deselectAll = () => {
    setOptions(prev => {
      const next = { ...prev };
      for (const group of optionGroups) {
        for (const item of group.items) {
          (next as any)[item.key] = false;
        }
      }
      return next;
    });
  };

  return (
    <div class="space-y-6">
      <QuickNav links={[
        { label: 'SVG to PNG', href: '/tools/svg-to-png' },
        { label: 'CSS Minifier', href: '/tools/css-minifier' },
        { label: 'HTML Formatter', href: '/tools/html-formatter' },
      ]} />

      {/* Input Section */}
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">SVG Input</label>
          <div class="flex gap-2">
            <button
              onClick={() => { setInput(SAMPLE_SVG); }}
              class="px-3 py-1 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
            >
              Load Sample
            </button>
            <label class="px-3 py-1 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 cursor-pointer">
              Upload SVG
              <input ref={fileInputRef} type="file" accept=".svg,image/svg+xml" class="hidden" onChange={handleFileUpload} />
            </label>
            <button
              onClick={() => setInput('')}
              class="px-3 py-1 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
            >
              Clear
            </button>
          </div>
        </div>
        <textarea
          value={input}
          onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
          placeholder="Paste your SVG code here or upload an SVG file..."
          class="w-full h-48 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-mono text-xs resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all duration-200"
          spellcheck={false}
        />
        {input && (
          <div class="text-xs text-gray-400 text-right">{formatBytes(new Blob([input]).size)}</div>
        )}
      </div>

      {/* Optimization Options */}
      <div class="bg-gray-50 dark:bg-gray-800 rounded-xl p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">Optimization Options</h3>
          <div class="flex gap-2">
            <button
              onClick={selectAll}
              class="px-2 py-1 text-xs font-medium rounded bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors"
            >
              Select All
            </button>
            <button
              onClick={deselectAll}
              class="px-2 py-1 text-xs font-medium rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Deselect All
            </button>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          {optionGroups.map((group) => (
            <div key={group.title}>
              <h4 class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{group.title}</h4>
              <div class="space-y-2">
                {group.items.map((item) => (
                  <label key={item.key} class="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options[item.key] as boolean}
                      onChange={() => toggleOption(item.key)}
                      class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span class="text-gray-700 dark:text-gray-300 text-xs">{item.label}</span>
                  </label>
                ))}
                {group.title === 'Minification' && options.roundNumbers && (
                  <div class="flex items-center gap-2 ml-6">
                    <label class="text-xs text-gray-500 dark:text-gray-400">Precision:</label>
                    <select
                      value={options.precision}
                      onChange={(e) => setOptions(prev => ({ ...prev, precision: parseInt((e.target as HTMLSelectElement).value) }))}
                      class="text-xs px-2 py-1 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                    >
                      <option value={1}>1 decimal</option>
                      <option value={2}>2 decimals</option>
                      <option value={3}>3 decimals</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Results */}
      {result && (
        <>
          {/* Stats */}
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 text-center">
              <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">Original</div>
              <div class="text-lg font-bold text-gray-900 dark:text-gray-100">{formatBytes(result.originalSize)}</div>
            </div>
            <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 text-center">
              <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">Optimized</div>
              <div class="text-lg font-bold text-primary-600 dark:text-primary-400">{formatBytes(result.optimizedSize)}</div>
            </div>
            <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 text-center">
              <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">Saved</div>
              <div class="text-lg font-bold text-green-600 dark:text-green-400">{formatBytes(result.savings)}</div>
            </div>
            <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 text-center">
              <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">Reduction</div>
              <div class={`text-lg font-bold ${result.savingsPercent > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                {result.savingsPercent.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Operations performed */}
          {result.operations.length > 0 && (
            <div class="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-xl p-4">
              <h4 class="text-xs font-semibold text-green-700 dark:text-green-300 mb-2">Optimizations Applied ({result.operations.length})</h4>
              <div class="flex flex-wrap gap-2">
                {result.operations.map((op, i) => (
                  <span key={i} class="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-md">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    {op}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Preview */}
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* SVG Preview */}
            <div class="space-y-2">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Preview</label>
              <div
                class="h-48 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden p-4"
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='10' height='10' fill='%23f0f0f0'/%3E%3Crect x='10' y='10' width='10' height='10' fill='%23f0f0f0'/%3E%3C/svg%3E\")" }}
                dangerouslySetInnerHTML={{ __html: result.output }}
              />
            </div>

            {/* Optimized Output */}
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Optimized SVG</label>
                <div class="flex gap-2">
                  <button
                    onClick={handleCopy}
                    class={`px-3 py-1 text-xs font-medium rounded-lg transition-all duration-200 ${
                      copied
                        ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={handleDownload}
                    class="px-3 py-1 text-xs font-medium rounded-lg bg-primary-600 hover:bg-primary-700 text-white transition-all duration-200"
                  >
                    Download
                  </button>
                </div>
              </div>
              <textarea
                value={result.output}
                readOnly
                class="w-full h-48 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-mono text-xs resize-none outline-none"
                spellcheck={false}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
