import { useState, useRef, useCallback } from 'preact/hooks';

interface FaviconSize {
  size: number;
  label: string;
  use: string;
}

const SIZES: FaviconSize[] = [
  { size: 16, label: '16x16', use: 'Browser tab (standard)' },
  { size: 32, label: '32x32', use: 'Browser tab (retina)' },
  { size: 48, label: '48x48', use: 'Windows shortcut' },
  { size: 57, label: '57x57', use: 'iOS (legacy)' },
  { size: 72, label: '72x72', use: 'iPad (legacy)' },
  { size: 96, label: '96x96', use: 'Google TV' },
  { size: 120, label: '120x120', use: 'iPhone Retina' },
  { size: 144, label: '144x144', use: 'iPad Retina' },
  { size: 152, label: '152x152', use: 'iPad touch icon' },
  { size: 180, label: '180x180', use: 'Apple touch icon' },
  { size: 192, label: '192x192', use: 'Android Chrome' },
  { size: 512, label: '512x512', use: 'PWA splash' },
];

export default function FaviconGenerator() {
  const [imageUrl, setImageUrl] = useState('');
  const [selectedSizes, setSelectedSizes] = useState<number[]>([16, 32, 180, 192, 512]);
  const [generatedIcons, setGeneratedIcons] = useState<{ size: number; url: string }[]>([]);
  const [error, setError] = useState('');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [padding, setPadding] = useState(0);
  const [shape, setShape] = useState<'square' | 'circle' | 'rounded'>('square');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState<'manifest' | 'html' | null>(null);

  const handleFileUpload = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG, SVG)');
      return;
    }
    setError('');
    const reader = new FileReader();
    reader.onload = () => setImageUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const toggleSize = (size: number) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const handleGenerate = useCallback(() => {
    if (!imageUrl) {
      setError('Please upload an image first');
      return;
    }
    if (selectedSizes.length === 0) {
      setError('Please select at least one size');
      return;
    }
    setError('');

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const icons: { size: number; url: string }[] = [];
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      for (const size of selectedSizes.sort((a, b) => a - b)) {
        canvas.width = size;
        canvas.height = size;
        ctx.clearRect(0, 0, size, size);

        // Background
        ctx.fillStyle = bgColor;
        if (shape === 'circle') {
          ctx.beginPath();
          ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.clip();
        } else if (shape === 'rounded') {
          const r = size * 0.15;
          ctx.beginPath();
          ctx.moveTo(r, 0);
          ctx.lineTo(size - r, 0);
          ctx.quadraticCurveTo(size, 0, size, r);
          ctx.lineTo(size, size - r);
          ctx.quadraticCurveTo(size, size, size - r, size);
          ctx.lineTo(r, size);
          ctx.quadraticCurveTo(0, size, 0, size - r);
          ctx.lineTo(0, r);
          ctx.quadraticCurveTo(0, 0, r, 0);
          ctx.fill();
          ctx.clip();
        } else {
          ctx.fillRect(0, 0, size, size);
        }

        // Draw image with padding
        const p = (size * padding) / 100;
        ctx.drawImage(img, p, p, size - p * 2, size - p * 2);

        icons.push({ size, url: canvas.toDataURL('image/png') });

        // Reset clip
        ctx.restore();
        ctx.save();
      }

      setGeneratedIcons(icons);
    };
    img.onerror = () => setError('Failed to load image');
    img.src = imageUrl;
  }, [imageUrl, selectedSizes, bgColor, padding, shape]);

  const handleDownload = (icon: { size: number; url: string }) => {
    const a = document.createElement('a');
    a.href = icon.url;
    a.download = `favicon-${icon.size}x${icon.size}.png`;
    a.click();
  };

  const handleDownloadAll = () => {
    generatedIcons.forEach((icon, i) => {
      setTimeout(() => handleDownload(icon), i * 200);
    });
  };

  const generateManifest = () => {
    const icons = generatedIcons.map((i) => ({
      src: `/favicon-${i.size}x${i.size}.png`,
      sizes: `${i.size}x${i.size}`,
      type: 'image/png',
    }));
    return JSON.stringify({ name: 'My App', short_name: 'App', icons, theme_color: bgColor, background_color: bgColor, display: 'standalone' }, null, 2);
  };

  const generateHtml = () => {
    const lines: string[] = [];
    lines.push(`<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />`);
    lines.push(`<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />`);
    if (selectedSizes.includes(180)) {
      lines.push(`<link rel="apple-touch-icon" sizes="180x180" href="/favicon-180x180.png" />`);
    }
    lines.push(`<link rel="manifest" href="/manifest.json" />`);
    lines.push(`<meta name="theme-color" content="${bgColor}" />`);
    return lines.join('\n');
  };

  const handleCopy = async (type: 'manifest' | 'html') => {
    const text = type === 'manifest' ? generateManifest() : generateHtml();
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
  };

  return (
    <div class="space-y-6">
      {/* Upload */}
      <div class="space-y-3">
        <label class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-primary-500 transition-colors bg-gray-50 dark:bg-gray-800">
          <div class="flex flex-col items-center text-gray-500 dark:text-gray-400">
            {imageUrl ? (
              <img src={imageUrl} alt="Preview" class="w-16 h-16 object-contain" />
            ) : (
              <>
                <svg class="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p class="text-sm">Upload an image (PNG, JPG, SVG)</p>
              </>
            )}
          </div>
          <input type="file" accept="image/*" class="hidden" onChange={handleFileUpload} />
        </label>
      </div>

      {/* Settings */}
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Shape</label>
          <select
            value={shape}
            onChange={(e) => setShape((e.target as HTMLSelectElement).value as any)}
            class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          >
            <option value="square">Square</option>
            <option value="rounded">Rounded</option>
            <option value="circle">Circle</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Background</label>
          <input
            type="color"
            value={bgColor}
            onInput={(e) => setBgColor((e.target as HTMLInputElement).value)}
            class="w-full h-9 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Padding ({padding}%)</label>
          <input
            type="range"
            min={0}
            max={30}
            value={padding}
            onInput={(e) => setPadding(parseInt((e.target as HTMLInputElement).value))}
            class="w-full mt-2"
          />
        </div>
        <div class="flex items-end">
          <button
            onClick={() => setSelectedSizes(SIZES.map((s) => s.size))}
            class="px-3 py-2 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Select All Sizes
          </button>
        </div>
      </div>

      {/* Size selector */}
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {SIZES.map((s) => (
          <label
            key={s.size}
            class={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
              selectedSizes.includes(s.size)
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
            }`}
          >
            <input
              type="checkbox"
              checked={selectedSizes.includes(s.size)}
              onChange={() => toggleSize(s.size)}
              class="rounded"
            />
            <div>
              <p class="text-xs font-medium text-gray-900 dark:text-gray-100">{s.label}</p>
              <p class="text-[10px] text-gray-500">{s.use}</p>
            </div>
          </label>
        ))}
      </div>

      <button
        onClick={handleGenerate}
        class="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        Generate Favicons
      </button>

      {error && (
        <div class="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <canvas ref={canvasRef} class="hidden" />

      {/* Generated icons */}
      {generatedIcons.length > 0 && (
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Generated Favicons ({generatedIcons.length})</h3>
            <button
              onClick={handleDownloadAll}
              class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Download All
            </button>
          </div>

          <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {generatedIcons.map((icon) => (
              <div
                key={icon.size}
                class="flex flex-col items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-primary-500 transition-colors"
                onClick={() => handleDownload(icon)}
              >
                <div class="w-12 h-12 flex items-center justify-center" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'10\' height=\'10\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect width=\'5\' height=\'5\' fill=\'%23eee\'/%3E%3Crect x=\'5\' y=\'5\' width=\'5\' height=\'5\' fill=\'%23eee\'/%3E%3C/svg%3E")' }}>
                  <img src={icon.url} alt={`${icon.size}x${icon.size}`} class="max-w-full max-h-full object-contain" />
                </div>
                <p class="text-[10px] text-gray-500">{icon.size}x{icon.size}</p>
              </div>
            ))}
          </div>

          {/* HTML snippet */}
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-semibold text-gray-900 dark:text-gray-100">HTML Tags</h4>
              <button
                onClick={() => handleCopy('html')}
                class="px-3 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {copied === 'html' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs font-mono text-gray-700 dark:text-gray-300 overflow-x-auto whitespace-pre-wrap border border-gray-200 dark:border-gray-700">
              {generateHtml()}
            </pre>
          </div>

          {/* manifest.json */}
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-semibold text-gray-900 dark:text-gray-100">manifest.json</h4>
              <button
                onClick={() => handleCopy('manifest')}
                class="px-3 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {copied === 'manifest' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs font-mono text-gray-700 dark:text-gray-300 overflow-x-auto whitespace-pre-wrap border border-gray-200 dark:border-gray-700">
              {generateManifest()}
            </pre>
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
