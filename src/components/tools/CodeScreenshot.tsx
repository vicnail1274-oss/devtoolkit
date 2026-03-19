import { useState, useRef, useCallback } from 'preact/hooks';

const THEMES = {
  'Dracula': { bg: '#282a36', text: '#f8f8f2', keyword: '#ff79c6', string: '#f1fa8c', comment: '#6272a4', func: '#50fa7b', number: '#bd93f9' },
  'One Dark': { bg: '#282c34', text: '#abb2bf', keyword: '#c678dd', string: '#98c379', comment: '#5c6370', func: '#61afef', number: '#d19a66' },
  'Monokai': { bg: '#272822', text: '#f8f8f2', keyword: '#f92672', string: '#e6db74', comment: '#75715e', func: '#a6e22e', number: '#ae81ff' },
  'Nord': { bg: '#2e3440', text: '#d8dee9', keyword: '#81a1c1', string: '#a3be8c', comment: '#616e88', func: '#88c0d0', number: '#b48ead' },
  'GitHub Dark': { bg: '#0d1117', text: '#c9d1d9', keyword: '#ff7b72', string: '#a5d6ff', comment: '#8b949e', func: '#d2a8ff', number: '#79c0ff' },
  'Solarized': { bg: '#002b36', text: '#839496', keyword: '#859900', string: '#2aa198', comment: '#586e75', func: '#268bd2', number: '#d33682' },
};

const LANGUAGES = ['javascript', 'typescript', 'python', 'html', 'css', 'json', 'bash', 'sql', 'go', 'rust'];

const PADDINGS = [16, 32, 48, 64, 96, 128];

const FONTS = ['JetBrains Mono', 'Fira Code', 'Source Code Pro', 'Cascadia Code', 'monospace'];

export default function CodeScreenshot() {
  const [code, setCode] = useState(`function fibonacci(n) {
  // Calculate nth Fibonacci number
  if (n <= 1) return n;
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) {
    [a, b] = [b, a + b];
  }
  return b;
}

console.log(fibonacci(10)); // 55`);
  const [theme, setTheme] = useState<keyof typeof THEMES>('Dracula');
  const [language, setLanguage] = useState('javascript');
  const [padding, setPadding] = useState(48);
  const [fontSize, setFontSize] = useState(14);
  const [fontFamily, setFontFamily] = useState('JetBrains Mono');
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [showWindowControls, setShowWindowControls] = useState(true);
  const [windowTitle, setWindowTitle] = useState('');
  const [bgType, setBgType] = useState<'gradient' | 'solid' | 'none'>('gradient');
  const [gradientFrom, setGradientFrom] = useState('#667eea');
  const [gradientTo, setGradientTo] = useState('#764ba2');
  const [borderRadius, setBorderRadius] = useState(12);
  const [shadow, setShadow] = useState(true);
  const previewRef = useRef<HTMLDivElement>(null);

  const t = THEMES[theme];

  const simpleHighlight = useCallback((line: string): string => {
    // Very basic syntax highlighting - works for demos
    let html = line
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Comments
    html = html.replace(/(\/\/.*$)/gm, `<span style="color:${t.comment}">$1</span>`);
    // Strings
    html = html.replace(/(&quot;[^&]*&quot;|'[^']*'|`[^`]*`|"[^"]*")/g, `<span style="color:${t.string}">$1</span>`);
    // Keywords
    html = html.replace(/\b(function|const|let|var|if|else|for|while|return|import|export|from|class|new|this|async|await|try|catch|throw|switch|case|break|default|continue|do|typeof|instanceof|in|of|yield|void|delete|with)\b/g, `<span style="color:${t.keyword}">$1</span>`);
    // Numbers
    html = html.replace(/\b(\d+\.?\d*)\b/g, `<span style="color:${t.number}">$1</span>`);
    // Function calls
    html = html.replace(/\b([a-zA-Z_]\w*)\s*(?=\()/g, `<span style="color:${t.func}">$1</span>`);

    return html;
  }, [t]);

  const handleExport = useCallback(async () => {
    const el = previewRef.current;
    if (!el) return;

    // Use html2canvas-like approach with SVG foreignObject
    const canvas = document.createElement('canvas');
    const scale = 2;
    canvas.width = el.offsetWidth * scale;
    canvas.height = el.offsetHeight * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Render to SVG foreignObject, then to canvas
    const svgData = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${el.offsetWidth * scale}" height="${el.offsetHeight * scale}">
        <foreignObject width="100%" height="100%" style="transform: scale(${scale}); transform-origin: 0 0;">
          ${new XMLSerializer().serializeToString(el)}
        </foreignObject>
      </svg>`;

    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = `code-screenshot-${Date.now()}.png`;
      a.click();
    };
    img.onerror = () => {
      // Fallback: copy the SVG itself
      URL.revokeObjectURL(url);
      const a = document.createElement('a');
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml' });
      a.href = URL.createObjectURL(svgBlob);
      a.download = `code-screenshot-${Date.now()}.svg`;
      a.click();
    };
    img.src = url;
  }, []);

  const handleCopySvg = useCallback(async () => {
    const el = previewRef.current;
    if (!el) return;
    const svgData = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${el.offsetWidth * 2}" height="${el.offsetHeight * 2}">
        <foreignObject width="100%" height="100%" style="transform: scale(2); transform-origin: 0 0;">
          ${new XMLSerializer().serializeToString(el)}
        </foreignObject>
      </svg>`;
    try {
      await navigator.clipboard.writeText(svgData);
    } catch {}
  }, []);

  const lines = code.split('\n');
  const lineNumWidth = String(lines.length).length * 10 + 16;

  const bgStyle = bgType === 'gradient'
    ? `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`
    : bgType === 'solid'
    ? gradientFrom
    : 'transparent';

  return (
    <div class="space-y-6">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings */}
        <div class="space-y-4">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Settings</h3>

          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Theme</label>
            <select
              value={theme}
              onChange={(e) => setTheme((e.target as HTMLSelectElement).value as any)}
              class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            >
              {Object.keys(THEMES).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage((e.target as HTMLSelectElement).value)}
              class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            >
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Font</label>
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily((e.target as HTMLSelectElement).value)}
              class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            >
              {FONTS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Font Size ({fontSize}px)</label>
              <input type="range" min={10} max={24} value={fontSize} onInput={(e) => setFontSize(parseInt((e.target as HTMLInputElement).value))} class="w-full" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Padding ({padding}px)</label>
              <select
                value={padding}
                onChange={(e) => setPadding(parseInt((e.target as HTMLSelectElement).value))}
                class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              >
                {PADDINGS.map((p) => (
                  <option key={p} value={p}>{p}px</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Background</label>
            <div class="flex gap-2 mb-2">
              {(['gradient', 'solid', 'none'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setBgType(t)}
                  class={`px-3 py-1 text-xs rounded-md transition-colors capitalize ${
                    bgType === t
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            {bgType !== 'none' && (
              <div class="flex gap-2">
                <input type="color" value={gradientFrom} onInput={(e) => setGradientFrom((e.target as HTMLInputElement).value)} class="w-9 h-9 rounded border border-gray-300 cursor-pointer" />
                {bgType === 'gradient' && (
                  <input type="color" value={gradientTo} onInput={(e) => setGradientTo((e.target as HTMLInputElement).value)} class="w-9 h-9 rounded border border-gray-300 cursor-pointer" />
                )}
              </div>
            )}
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Border Radius ({borderRadius}px)</label>
            <input type="range" min={0} max={24} value={borderRadius} onInput={(e) => setBorderRadius(parseInt((e.target as HTMLInputElement).value))} class="w-full" />
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Window Title</label>
            <input
              type="text"
              value={windowTitle}
              onInput={(e) => setWindowTitle((e.target as HTMLInputElement).value)}
              placeholder="app.js"
              class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>

          <div class="space-y-2">
            <label class="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
              <input type="checkbox" checked={showLineNumbers} onChange={(e) => setShowLineNumbers((e.target as HTMLInputElement).checked)} class="rounded" />
              Show line numbers
            </label>
            <label class="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
              <input type="checkbox" checked={showWindowControls} onChange={(e) => setShowWindowControls((e.target as HTMLInputElement).checked)} class="rounded" />
              Show window controls
            </label>
            <label class="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
              <input type="checkbox" checked={shadow} onChange={(e) => setShadow((e.target as HTMLInputElement).checked)} class="rounded" />
              Drop shadow
            </label>
          </div>

          {/* Gradient presets */}
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Quick Gradients</label>
            <div class="flex flex-wrap gap-2">
              {[
                { from: '#667eea', to: '#764ba2' },
                { from: '#f093fb', to: '#f5576c' },
                { from: '#4facfe', to: '#00f2fe' },
                { from: '#43e97b', to: '#38f9d7' },
                { from: '#fa709a', to: '#fee140' },
                { from: '#a18cd1', to: '#fbc2eb' },
                { from: '#fccb90', to: '#d57eeb' },
                { from: '#0c3483', to: '#a2b6df' },
              ].map((g, i) => (
                <button
                  key={i}
                  onClick={() => { setGradientFrom(g.from); setGradientTo(g.to); setBgType('gradient'); }}
                  class="w-8 h-8 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                  style={{ background: `linear-gradient(135deg, ${g.from}, ${g.to})` }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Code input + Preview */}
        <div class="lg:col-span-2 space-y-4">
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Code</label>
            <textarea
              value={code}
              onInput={(e) => setCode((e.target as HTMLTextAreaElement).value)}
              class="w-full h-40 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm font-mono focus:ring-2 focus:ring-primary-500 outline-none"
              spellcheck={false}
            />
          </div>

          {/* Preview */}
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Preview</h3>
            <div class="flex gap-2">
              <button
                onClick={handleCopySvg}
                class="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Copy SVG
              </button>
              <button
                onClick={handleExport}
                class="px-3 py-1.5 text-xs font-medium bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
              >
                Export PNG
              </button>
            </div>
          </div>

          <div
            ref={previewRef}
            style={{
              background: bgStyle,
              padding: `${padding}px`,
              borderRadius: bgType !== 'none' ? `${borderRadius}px` : '0',
              display: 'inline-block',
              width: '100%',
            }}
          >
            <div
              style={{
                background: t.bg,
                borderRadius: `${borderRadius}px`,
                overflow: 'hidden',
                boxShadow: shadow ? '0 20px 68px rgba(0,0,0,0.55)' : 'none',
              }}
            >
              {/* Window title bar */}
              {showWindowControls && (
                <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f57' }} />
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#febc2e' }} />
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#28c840' }} />
                  </div>
                  {windowTitle && (
                    <span style={{ color: t.comment, fontSize: '12px', marginLeft: '8px', fontFamily: fontFamily }}>
                      {windowTitle}
                    </span>
                  )}
                </div>
              )}

              {/* Code */}
              <div style={{ padding: showWindowControls ? '0 16px 16px' : '16px', overflowX: 'auto' }}>
                <pre style={{ margin: 0, fontSize: `${fontSize}px`, lineHeight: '1.6', fontFamily: `'${fontFamily}', monospace` }}>
                  {lines.map((line, i) => (
                    <div key={i} style={{ display: 'flex' }}>
                      {showLineNumbers && (
                        <span
                          style={{
                            color: t.comment,
                            opacity: 0.5,
                            minWidth: `${lineNumWidth}px`,
                            textAlign: 'right',
                            paddingRight: '16px',
                            userSelect: 'none',
                          }}
                        >
                          {i + 1}
                        </span>
                      )}
                      <span
                        style={{ color: t.text, flex: 1 }}
                        dangerouslySetInnerHTML={{ __html: simpleHighlight(line) || '&nbsp;' }}
                      />
                    </div>
                  ))}
                </pre>
              </div>

              {/* Branding watermark */}
              <div style={{ padding: '4px 16px 8px', textAlign: 'right' }}>
                <span style={{ color: t.comment, fontSize: '10px', opacity: 0.4 }}>
                  devtoolkit.cc
                </span>
              </div>
            </div>
          </div>

          {/* Branding */}
          <p class="text-center text-xs text-gray-400 dark:text-gray-600">
            Made with <a href="https://devtoolkit.cc" class="text-primary-500 hover:underline">DevToolkit</a>
          </p>
        </div>
      </div>
    </div>
  );
}
