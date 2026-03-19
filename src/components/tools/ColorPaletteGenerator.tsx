import { useState, useCallback, useMemo } from 'preact/hooks';

// ─── Color utilities ───────────────────────────────────
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  };
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(l * 100)];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslColor(h: number, s: number, l: number) {
  const [r, g, b] = hslToRgb(h, s, l);
  const hex = rgbToHex(r, g, b);
  return { hex, rgb: `rgb(${r}, ${g}, ${b})`, hsl: `hsl(${h}, ${s}%, ${l}%)`, h, s, l, r, g, b };
}

type Color = ReturnType<typeof hslColor>;

// ─── Harmony functions ──────────────────────────────────
type HarmonyType = 'random' | 'complementary' | 'triadic' | 'analogous' | 'split-complementary' | 'monochromatic';

function randomHue(): number {
  return Math.floor(Math.random() * 360);
}

function randomSL(): [number, number] {
  return [40 + Math.floor(Math.random() * 40), 40 + Math.floor(Math.random() * 25)];
}

function generateHarmony(type: HarmonyType, count: number): Color[] {
  const baseH = randomHue();
  const [baseS, baseL] = randomSL();

  switch (type) {
    case 'complementary': {
      const colors = [hslColor(baseH, baseS, baseL), hslColor((baseH + 180) % 360, baseS, baseL)];
      while (colors.length < count) {
        const offset = Math.floor(Math.random() * 30) - 15;
        colors.push(hslColor((baseH + offset + 360) % 360, baseS + Math.floor(Math.random() * 20) - 10, baseL + Math.floor(Math.random() * 20) - 10));
      }
      return colors.slice(0, count);
    }
    case 'triadic': {
      const colors = [0, 120, 240].map((off) => hslColor((baseH + off) % 360, baseS, baseL));
      while (colors.length < count) {
        colors.push(hslColor((baseH + Math.floor(Math.random() * 360)) % 360, baseS, baseL + Math.floor(Math.random() * 20) - 10));
      }
      return colors.slice(0, count);
    }
    case 'analogous': {
      const step = 30;
      return Array.from({ length: count }, (_, i) => {
        const offset = (i - Math.floor(count / 2)) * step;
        return hslColor((baseH + offset + 360) % 360, baseS, baseL);
      });
    }
    case 'split-complementary': {
      const colors = [hslColor(baseH, baseS, baseL), hslColor((baseH + 150) % 360, baseS, baseL), hslColor((baseH + 210) % 360, baseS, baseL)];
      while (colors.length < count) {
        colors.push(hslColor((baseH + Math.floor(Math.random() * 60) + 150) % 360, baseS, baseL + Math.floor(Math.random() * 20) - 10));
      }
      return colors.slice(0, count);
    }
    case 'monochromatic': {
      return Array.from({ length: count }, (_, i) => {
        const l = Math.max(15, Math.min(85, baseL - 30 + Math.round((60 / (count - 1 || 1)) * i)));
        return hslColor(baseH, baseS, l);
      });
    }
    default: {
      // random
      return Array.from({ length: count }, () => {
        const [s, l] = randomSL();
        return hslColor(randomHue(), s, l);
      });
    }
  }
}

// ─── Export formats ─────────────────────────────────────
type ExportFormat = 'css' | 'scss' | 'tailwind' | 'json';

function exportPalette(colors: Color[], format: ExportFormat): string {
  switch (format) {
    case 'css':
      return `:root {\n${colors.map((c, i) => `  --color-${i + 1}: ${c.hex};`).join('\n')}\n}`;
    case 'scss':
      return colors.map((c, i) => `$color-${i + 1}: ${c.hex};`).join('\n');
    case 'tailwind':
      return `module.exports = {\n  theme: {\n    extend: {\n      colors: {\n        palette: {\n${colors.map((c, i) => `          '${i + 1}': '${c.hex}',`).join('\n')}\n        },\n      },\n    },\n  },\n};`;
    case 'json':
      return JSON.stringify(colors.map((c) => ({ hex: c.hex, rgb: c.rgb, hsl: c.hsl })), null, 2);
  }
}

// ─── Share via URL ──────────────────────────────────────
function colorsToHash(colors: Color[]): string {
  return colors.map((c) => c.hex.slice(1)).join('-');
}

function hashToColors(hash: string): Color[] | null {
  const parts = hash.split('-');
  if (parts.length === 0 || parts.some((p) => !/^[0-9a-fA-F]{6}$/.test(p))) return null;
  return parts.map((hex) => {
    const [h, s, l] = hexToHsl('#' + hex);
    return hslColor(h, s, l);
  });
}

// ─── Luminance for text contrast ────────────────────────
function luminance(r: number, g: number, b: number): number {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

function textColor(r: number, g: number, b: number): string {
  return luminance(r, g, b) > 0.179 ? '#000000' : '#ffffff';
}

// ─── Component ──────────────────────────────────────────
const HARMONIES: { value: HarmonyType; label: string }[] = [
  { value: 'random', label: 'Random' },
  { value: 'complementary', label: 'Complementary' },
  { value: 'triadic', label: 'Triadic' },
  { value: 'analogous', label: 'Analogous' },
  { value: 'split-complementary', label: 'Split-Complementary' },
  { value: 'monochromatic', label: 'Monochromatic' },
];

const FORMATS: { value: ExportFormat; label: string }[] = [
  { value: 'css', label: 'CSS' },
  { value: 'scss', label: 'SCSS' },
  { value: 'tailwind', label: 'Tailwind' },
  { value: 'json', label: 'JSON' },
];

export default function ColorPaletteGenerator() {
  // Init from URL hash if present
  const initFromHash = (): Color[] | null => {
    if (typeof window === 'undefined') return null;
    const hash = window.location.hash.slice(1);
    if (!hash) return null;
    return hashToColors(hash);
  };

  const [colors, setColors] = useState<Color[]>(() => initFromHash() || generateHarmony('random', 5));
  const [harmony, setHarmony] = useState<HarmonyType>('random');
  const [count, setCount] = useState(5);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('css');
  const [copied, setCopied] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [lockedIndices, setLockedIndices] = useState<Set<number>>(new Set());

  const handleGenerate = useCallback(() => {
    const newColors = generateHarmony(harmony, count);
    // Keep locked colors in place
    const merged = newColors.map((c, i) => (lockedIndices.has(i) && i < colors.length ? colors[i] : c));
    setColors(merged);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', '#' + colorsToHash(merged));
    }
  }, [harmony, count, lockedIndices, colors]);

  const toggleLock = (idx: number) => {
    setLockedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleCopy = async (text: string, label: string) => {
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
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return window.location.origin + window.location.pathname + '#' + colorsToHash(colors);
  }, [colors]);

  const exportCode = useMemo(() => exportPalette(colors, exportFormat), [colors, exportFormat]);

  return (
    <div class="space-y-6">
      {/* Controls */}
      <div class="flex flex-wrap gap-4 items-end">
        <div>
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Harmony</label>
          <select
            value={harmony}
            onChange={(e) => setHarmony((e.target as HTMLSelectElement).value as HarmonyType)}
            class="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {HARMONIES.map((h) => (
              <option key={h.value} value={h.value}>{h.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Colors</label>
          <div class="flex gap-1">
            {[3, 4, 5, 6, 7, 8].map((n) => (
              <button
                key={n}
                onClick={() => { setCount(n); setLockedIndices((prev) => { const next = new Set<number>(); prev.forEach((i) => { if (i < n) next.add(i); }); return next; }); }}
                class={`w-9 h-9 text-sm rounded-lg transition-all duration-200 ${
                  count === n
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={handleGenerate}
          class="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
        >
          Generate
        </button>
      </div>

      {/* Palette Display */}
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {colors.map((color, idx) => (
          <div
            key={idx}
            class="group relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200"
          >
            {/* Color swatch */}
            <div
              class="h-32 sm:h-40 flex items-center justify-center cursor-pointer"
              style={{ backgroundColor: color.hex }}
              onClick={() => handleCopy(color.hex, `hex-${idx}`)}
              title="Click to copy HEX"
            >
              <span
                class="text-lg font-mono font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{ color: textColor(color.r, color.g, color.b) }}
              >
                {copied === `hex-${idx}` ? 'Copied!' : color.hex}
              </span>
            </div>
            {/* Lock button */}
            <button
              onClick={() => toggleLock(idx)}
              class="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/40 transition-all"
              title={lockedIndices.has(idx) ? 'Unlock color' : 'Lock color'}
            >
              <span class="text-white text-xs">{lockedIndices.has(idx) ? '\u{1F512}' : '\u{1F513}'}</span>
            </button>
            {/* Color info */}
            <div class="p-3 bg-white dark:bg-gray-900 space-y-1">
              <button
                onClick={() => handleCopy(color.hex, `hex2-${idx}`)}
                class="w-full text-left text-sm font-mono font-semibold text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                {copied === `hex2-${idx}` ? 'Copied!' : color.hex.toUpperCase()}
              </button>
              <button
                onClick={() => handleCopy(color.rgb, `rgb-${idx}`)}
                class="w-full text-left text-xs font-mono text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                {copied === `rgb-${idx}` ? 'Copied!' : color.rgb}
              </button>
              <button
                onClick={() => handleCopy(color.hsl, `hsl-${idx}`)}
                class="w-full text-left text-xs font-mono text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                {copied === `hsl-${idx}` ? 'Copied!' : color.hsl}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Export & Share */}
      <div class="flex flex-wrap gap-3">
        <button
          onClick={() => setShowExport(!showExport)}
          class={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 border ${
            showExport
              ? 'bg-primary-50 dark:bg-primary-950 border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          Export Code
        </button>
        <button
          onClick={() => handleCopy(shareUrl, 'share')}
          class={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 border ${
            copied === 'share'
              ? 'bg-green-100 dark:bg-green-900 border-green-300 dark:border-green-700 text-green-600 dark:text-green-400'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          {copied === 'share' ? 'Link Copied!' : 'Share URL'}
        </button>
      </div>

      {/* Export Panel */}
      {showExport && (
        <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
          <div class="flex gap-2">
            {FORMATS.map((f) => (
              <button
                key={f.value}
                onClick={() => setExportFormat(f.value)}
                class={`px-3 py-1.5 text-sm rounded-lg transition-all duration-200 ${
                  exportFormat === f.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div class="relative">
            <pre class="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-sm font-mono text-gray-800 dark:text-gray-200 overflow-x-auto">
              {exportCode}
            </pre>
            <button
              onClick={() => handleCopy(exportCode, 'export')}
              class={`absolute top-2 right-2 px-3 py-1 text-xs font-medium rounded-lg transition-all duration-200 ${
                copied === 'export'
                  ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {copied === 'export' ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
