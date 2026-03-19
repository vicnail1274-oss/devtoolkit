import { useState, useCallback } from 'preact/hooks';

// --- Conversion functions ---

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleaned = hex.replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) return null;
  return {
    r: parseInt(cleaned.slice(0, 2), 16),
    g: parseInt(cleaned.slice(2, 4), 16),
    b: parseInt(cleaned.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360;
  s /= 100;
  l /= 100;

  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  };
}

// --- Component ---

const SWATCHES = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#8b5cf6', '#ec4899', '#000000', '#ffffff',
];

type CopiedKey = 'hex' | 'rgb' | 'hsl' | null;

export default function ColorConverter() {
  const [hex, setHex] = useState('#3b82f6');
  const [r, setR] = useState(59);
  const [g, setG] = useState(130);
  const [b, setB] = useState(246);
  const [h, setH] = useState(217);
  const [s, setS] = useState(91);
  const [l, setL] = useState(60);
  const [copied, setCopied] = useState<CopiedKey>(null);

  // --- Updaters ---

  const updateFromHex = useCallback((newHex: string) => {
    setHex(newHex);
    const rgb = hexToRgb(newHex);
    if (rgb) {
      setR(rgb.r);
      setG(rgb.g);
      setB(rgb.b);
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      setH(hsl.h);
      setS(hsl.s);
      setL(hsl.l);
    }
  }, []);

  const updateFromRgb = useCallback((nr: number, ng: number, nb: number) => {
    setR(nr);
    setG(ng);
    setB(nb);
    setHex(rgbToHex(nr, ng, nb));
    const hsl = rgbToHsl(nr, ng, nb);
    setH(hsl.h);
    setS(hsl.s);
    setL(hsl.l);
  }, []);

  const updateFromHsl = useCallback((nh: number, ns: number, nl: number) => {
    setH(nh);
    setS(ns);
    setL(nl);
    const rgb = hslToRgb(nh, ns, nl);
    setR(rgb.r);
    setG(rgb.g);
    setB(rgb.b);
    setHex(rgbToHex(rgb.r, rgb.g, rgb.b));
  }, []);

  // --- Copy ---

  const copyText = async (text: string, key: CopiedKey) => {
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
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const hexStr = hex.toUpperCase();
  const rgbStr = `rgb(${r}, ${g}, ${b})`;
  const hslStr = `hsl(${h}, ${s}%, ${l}%)`;

  // --- Clamp helpers ---

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, Math.round(v)));

  const handleRgbChange = (channel: 'r' | 'g' | 'b', value: string) => {
    const n = clamp(Number(value) || 0, 0, 255);
    const newR = channel === 'r' ? n : r;
    const newG = channel === 'g' ? n : g;
    const newB = channel === 'b' ? n : b;
    updateFromRgb(newR, newG, newB);
  };

  const handleHslChange = (channel: 'h' | 's' | 'l', value: string) => {
    const max = channel === 'h' ? 360 : 100;
    const n = clamp(Number(value) || 0, 0, max);
    const newH = channel === 'h' ? n : h;
    const newS = channel === 's' ? n : s;
    const newL = channel === 'l' ? n : l;
    updateFromHsl(newH, newS, newL);
  };

  const handleHexInput = (value: string) => {
    let v = value.startsWith('#') ? value : `#${value}`;
    setHex(v);
    if (/^#[0-9a-fA-F]{6}$/.test(v)) {
      updateFromHex(v);
    }
  };

  // --- Copy button ---

  const CopyButton = ({ label, value, copyKey }: { label: string; value: string; copyKey: CopiedKey }) => (
    <button
      onClick={() => copyText(value, copyKey)}
      class={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
        copied === copyKey
          ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
      }`}
    >
      {copied === copyKey ? 'Copied!' : `Copy ${label}`}
    </button>
  );

  // --- Number input ---

  const NumberInput = ({
    label,
    value,
    max,
    onChange,
  }: {
    label: string;
    value: number;
    max: number;
    onChange: (v: string) => void;
  }) => (
    <div class="flex flex-col gap-1">
      <label class="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</label>
      <input
        type="number"
        min={0}
        max={max}
        value={value}
        onInput={(e) => onChange((e.target as HTMLInputElement).value)}
        class="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-mono text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all duration-200"
      />
    </div>
  );

  return (
    <div class="space-y-6">
      {/* Color Preview */}
      <div class="flex flex-col sm:flex-row gap-4">
        <div
          class="w-full sm:w-48 h-32 rounded-xl border border-gray-200 dark:border-gray-700 shadow-inner transition-all duration-200"
          style={{ backgroundColor: hexStr }}
        />
        <div class="flex-1 space-y-3">
          {/* Color Picker + HEX */}
          <div class="flex items-end gap-3">
            <div class="flex flex-col gap-1">
              <label class="text-xs font-medium text-gray-500 dark:text-gray-400">Pick</label>
              <input
                type="color"
                value={hex}
                onInput={(e) => updateFromHex((e.target as HTMLInputElement).value)}
                class="w-12 h-10 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer bg-transparent"
              />
            </div>
            <div class="flex-1 flex flex-col gap-1">
              <label class="text-xs font-medium text-gray-500 dark:text-gray-400">HEX</label>
              <input
                type="text"
                value={hex}
                onInput={(e) => handleHexInput((e.target as HTMLInputElement).value)}
                maxLength={7}
                class="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-mono text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all duration-200"
                spellcheck={false}
              />
            </div>
          </div>

          {/* Copy buttons */}
          <div class="flex flex-wrap gap-2">
            <CopyButton label="HEX" value={hexStr} copyKey="hex" />
            <CopyButton label="RGB" value={rgbStr} copyKey="rgb" />
            <CopyButton label="HSL" value={hslStr} copyKey="hsl" />
          </div>
        </div>
      </div>

      {/* RGB Inputs */}
      <div class="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">RGB</span>
          <span class="text-xs font-mono text-gray-400">{rgbStr}</span>
        </div>
        <div class="grid grid-cols-3 gap-3">
          <NumberInput label="R" value={r} max={255} onChange={(v) => handleRgbChange('r', v)} />
          <NumberInput label="G" value={g} max={255} onChange={(v) => handleRgbChange('g', v)} />
          <NumberInput label="B" value={b} max={255} onChange={(v) => handleRgbChange('b', v)} />
        </div>
      </div>

      {/* HSL Inputs */}
      <div class="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">HSL</span>
          <span class="text-xs font-mono text-gray-400">{hslStr}</span>
        </div>
        <div class="grid grid-cols-3 gap-3">
          <NumberInput label="H" value={h} max={360} onChange={(v) => handleHslChange('h', v)} />
          <NumberInput label="S" value={s} max={100} onChange={(v) => handleHslChange('s', v)} />
          <NumberInput label="L" value={l} max={100} onChange={(v) => handleHslChange('l', v)} />
        </div>
      </div>

      {/* Swatches */}
      <div class="space-y-2">
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Swatches</span>
        <div class="flex flex-wrap gap-2">
          {SWATCHES.map((sw) => (
            <button
              key={sw}
              onClick={() => updateFromHex(sw)}
              class={`w-9 h-9 rounded-lg border-2 transition-all duration-200 hover:scale-110 active:scale-95 ${
                hex.toLowerCase() === sw.toLowerCase()
                  ? 'border-primary-600 ring-2 ring-primary-300 dark:ring-primary-700'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
              style={{ backgroundColor: sw }}
              title={sw}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
