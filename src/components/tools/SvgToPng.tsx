import { useState, useRef, useCallback } from 'preact/hooks';

export default function SvgToPng() {
  const [svgInput, setSvgInput] = useState('');
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [transparent, setTransparent] = useState(false);
  const [scale, setScale] = useState(1);
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const sampleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366f1"/>
      <stop offset="100%" style="stop-color:#8b5cf6"/>
    </linearGradient>
  </defs>
  <rect width="200" height="200" rx="20" fill="url(#g)"/>
  <text x="100" y="115" text-anchor="middle" fill="white" font-size="48" font-family="sans-serif" font-weight="bold">&lt;/&gt;</text>
</svg>`;

  const handleFileUpload = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.svg') && file.type !== 'image/svg+xml') {
      setError('Please upload an SVG file');
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setSvgInput(reader.result as string);
      setError('');
    };
    reader.readAsText(file);
  };

  const handleConvert = useCallback(() => {
    if (!svgInput.trim()) {
      setError('Please paste SVG code or upload an SVG file');
      return;
    }
    setError('');

    try {
      // Parse SVG to get intrinsic dimensions
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgInput, 'image/svg+xml');
      const svgEl = doc.querySelector('svg');
      if (!svgEl) {
        setError('Invalid SVG: no <svg> element found');
        return;
      }

      const errNode = doc.querySelector('parsererror');
      if (errNode) {
        setError('Invalid SVG: parse error');
        return;
      }

      // Set explicit dimensions on SVG for rendering
      const svgClone = svgEl.cloneNode(true) as SVGSVGElement;
      svgClone.setAttribute('width', String(width * scale));
      svgClone.setAttribute('height', String(height * scale));

      const serializer = new XMLSerializer();
      const svgStr = serializer.serializeToString(svgClone);
      const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (!transparent) {
          ctx.fillStyle = bgColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);

        const pngUrl = canvas.toDataURL('image/png');
        setPreviewUrl(pngUrl);
      };
      img.onerror = () => {
        setError('Failed to render SVG. Please check your SVG code.');
        URL.revokeObjectURL(url);
      };
      img.src = url;
    } catch (e: any) {
      setError(`Conversion failed: ${e.message}`);
    }
  }, [svgInput, width, height, bgColor, transparent, scale]);

  const handleDownload = () => {
    if (!previewUrl) return;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = `${fileName ? fileName.replace('.svg', '') : 'converted'}-${width * scale}x${height * scale}.png`;
    a.click();
  };

  return (
    <div class="space-y-6">
      {/* Input section */}
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">SVG Input</h3>
          <div class="flex gap-2">
            <button
              onClick={() => { setSvgInput(sampleSvg); setError(''); }}
              class="text-xs text-primary-600 hover:underline"
            >
              Load Sample
            </button>
            <label class="text-xs text-primary-600 hover:underline cursor-pointer">
              Upload SVG
              <input type="file" accept=".svg,image/svg+xml" class="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        </div>
        <textarea
          value={svgInput}
          onInput={(e) => setSvgInput((e.target as HTMLTextAreaElement).value)}
          placeholder="Paste your SVG code here..."
          class="w-full h-40 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs font-mono focus:ring-2 focus:ring-primary-500 outline-none"
        />
      </div>

      {/* Settings */}
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Width (px)</label>
          <input
            type="number"
            value={width}
            onInput={(e) => setWidth(parseInt((e.target as HTMLInputElement).value) || 800)}
            min={1}
            max={4096}
            class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Height (px)</label>
          <input
            type="number"
            value={height}
            onInput={(e) => setHeight(parseInt((e.target as HTMLInputElement).value) || 600)}
            min={1}
            max={4096}
            class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Scale</label>
          <select
            value={scale}
            onChange={(e) => setScale(parseInt((e.target as HTMLSelectElement).value))}
            class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          >
            <option value={1}>1x</option>
            <option value={2}>2x (Retina)</option>
            <option value={3}>3x</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Background</label>
          <div class="flex items-center gap-2">
            {!transparent && (
              <input
                type="color"
                value={bgColor}
                onInput={(e) => setBgColor((e.target as HTMLInputElement).value)}
                class="w-9 h-9 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
            )}
            <label class="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={transparent}
                onChange={(e) => setTransparent((e.target as HTMLInputElement).checked)}
                class="rounded"
              />
              Transparent
            </label>
          </div>
        </div>
      </div>

      {/* Quick size presets */}
      <div class="flex flex-wrap gap-2">
        <span class="text-xs text-gray-500 dark:text-gray-400 self-center">Presets:</span>
        {[
          { label: 'OG Image', w: 1200, h: 630 },
          { label: 'Favicon', w: 512, h: 512 },
          { label: 'Twitter', w: 1200, h: 675 },
          { label: 'Instagram', w: 1080, h: 1080 },
          { label: 'HD', w: 1920, h: 1080 },
        ].map((preset) => (
          <button
            key={preset.label}
            onClick={() => { setWidth(preset.w); setHeight(preset.h); }}
            class="px-2.5 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {preset.label} ({preset.w}x{preset.h})
          </button>
        ))}
      </div>

      <button
        onClick={handleConvert}
        class="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        Convert to PNG
      </button>

      {/* Error */}
      {error && (
        <div class="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Hidden canvas */}
      <canvas ref={canvasRef} class="hidden" />

      {/* Preview and download */}
      {previewUrl && (
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Preview ({width * scale}x{height * scale}px)
            </h3>
            <button
              onClick={handleDownload}
              class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Download PNG
            </button>
          </div>
          <div
            class="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex items-center justify-center p-4"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect width=\'10\' height=\'10\' fill=\'%23f0f0f0\'/%3E%3Crect x=\'10\' y=\'10\' width=\'10\' height=\'10\' fill=\'%23f0f0f0\'/%3E%3C/svg%3E")' }}
          >
            <img src={previewUrl} alt="Converted PNG" class="max-w-full max-h-96 object-contain" />
          </div>

          {/* Branding */}
          <p class="text-center text-xs text-gray-400 dark:text-gray-600">
            Made with <a href="https://devtoolkit.cc" class="text-primary-500 hover:underline">DevToolkit</a>
          </p>
        </div>
      )}
    </div>
  );
}
