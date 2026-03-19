import { useState, useRef, useEffect, useCallback } from 'preact/hooks';
import QRCode from 'qrcode';

type QrType = 'text' | 'url' | 'wifi' | 'vcard' | 'email';
type ErrorLevel = 'L' | 'M' | 'Q' | 'H';

interface WifiData {
  ssid: string;
  password: string;
  encryption: 'WPA' | 'WEP' | 'nopass';
  hidden: boolean;
}

interface VCardData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  org: string;
  url: string;
}

interface EmailData {
  to: string;
  subject: string;
  body: string;
}

function buildQrContent(type: QrType, text: string, wifi: WifiData, vcard: VCardData, emailData: EmailData): string {
  switch (type) {
    case 'url':
    case 'text':
      return text;
    case 'wifi':
      return `WIFI:T:${wifi.encryption};S:${wifi.ssid};P:${wifi.password};H:${wifi.hidden ? 'true' : 'false'};;`;
    case 'vcard':
      return [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `N:${vcard.lastName};${vcard.firstName}`,
        `FN:${vcard.firstName} ${vcard.lastName}`,
        vcard.org ? `ORG:${vcard.org}` : '',
        vcard.phone ? `TEL:${vcard.phone}` : '',
        vcard.email ? `EMAIL:${vcard.email}` : '',
        vcard.url ? `URL:${vcard.url}` : '',
        'END:VCARD',
      ].filter(Boolean).join('\n');
    case 'email':
      return `mailto:${emailData.to}?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.body)}`;
    default:
      return text;
  }
}

export default function QrCodeGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [qrType, setQrType] = useState<QrType>('text');
  const [text, setText] = useState('https://devtoolkit.cc');
  const [size, setSize] = useState(256);
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [errorLevel, setErrorLevel] = useState<ErrorLevel>('M');

  const [wifi, setWifi] = useState<WifiData>({ ssid: '', password: '', encryption: 'WPA', hidden: false });
  const [vcard, setVcard] = useState<VCardData>({ firstName: '', lastName: '', phone: '', email: '', org: '', url: '' });
  const [emailData, setEmailData] = useState<EmailData>({ to: '', subject: '', body: '' });

  const content = buildQrContent(qrType, text, wifi, vcard, emailData);

  const generateQr = useCallback(async () => {
    if (!canvasRef.current || !content.trim()) return;
    try {
      await QRCode.toCanvas(canvasRef.current, content, {
        width: size,
        margin: 2,
        color: { dark: fgColor, light: bgColor },
        errorCorrectionLevel: errorLevel,
      });
    } catch {
      // Clear canvas on error
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.fillStyle = '#999';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Enter content to generate QR code', canvasRef.current.width / 2, canvasRef.current.height / 2);
      }
    }
  }, [content, size, fgColor, bgColor, errorLevel]);

  useEffect(() => { generateQr(); }, [generateQr]);

  const downloadAs = (format: 'png' | 'svg') => {
    if (!content.trim()) return;
    if (format === 'png') {
      if (!canvasRef.current) return;
      const link = document.createElement('a');
      link.download = 'qrcode.png';
      link.href = canvasRef.current.toDataURL('image/png');
      link.click();
    } else {
      QRCode.toString(content, {
        type: 'svg',
        width: size,
        margin: 2,
        color: { dark: fgColor, light: bgColor },
        errorCorrectionLevel: errorLevel,
      }).then((svg: string) => {
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const link = document.createElement('a');
        link.download = 'qrcode.svg';
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
      });
    }
  };

  const inputClass = 'w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none text-gray-900 dark:text-gray-100';
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

  return (
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Input Controls */}
      <div class="space-y-4">
        {/* QR Type Selector */}
        <div>
          <label class={labelClass}>QR Code Type</label>
          <div class="flex flex-wrap gap-2">
            {(['text', 'url', 'wifi', 'vcard', 'email'] as QrType[]).map((t) => (
              <button
                key={t}
                onClick={() => setQrType(t)}
                class={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  qrType === t
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {t === 'text' ? 'Text' : t === 'url' ? 'URL' : t === 'wifi' ? 'WiFi' : t === 'vcard' ? 'vCard' : 'Email'}
              </button>
            ))}
          </div>
        </div>

        {/* Content Inputs */}
        {(qrType === 'text' || qrType === 'url') && (
          <div>
            <label class={labelClass}>{qrType === 'url' ? 'URL' : 'Text'}</label>
            <textarea
              value={text}
              onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
              placeholder={qrType === 'url' ? 'https://example.com' : 'Enter text here...'}
              rows={3}
              class={inputClass}
            />
          </div>
        )}

        {qrType === 'wifi' && (
          <div class="space-y-3">
            <div>
              <label class={labelClass}>Network Name (SSID)</label>
              <input type="text" value={wifi.ssid} onInput={(e) => setWifi({ ...wifi, ssid: (e.target as HTMLInputElement).value })} placeholder="MyWiFi" class={inputClass} />
            </div>
            <div>
              <label class={labelClass}>Password</label>
              <input type="text" value={wifi.password} onInput={(e) => setWifi({ ...wifi, password: (e.target as HTMLInputElement).value })} placeholder="password123" class={inputClass} />
            </div>
            <div>
              <label class={labelClass}>Encryption</label>
              <select value={wifi.encryption} onChange={(e) => setWifi({ ...wifi, encryption: (e.target as HTMLSelectElement).value as WifiData['encryption'] })} class={inputClass}>
                <option value="WPA">WPA/WPA2</option>
                <option value="WEP">WEP</option>
                <option value="nopass">None</option>
              </select>
            </div>
            <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input type="checkbox" checked={wifi.hidden} onChange={(e) => setWifi({ ...wifi, hidden: (e.target as HTMLInputElement).checked })} class="rounded" />
              Hidden Network
            </label>
          </div>
        )}

        {qrType === 'vcard' && (
          <div class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class={labelClass}>First Name</label>
                <input type="text" value={vcard.firstName} onInput={(e) => setVcard({ ...vcard, firstName: (e.target as HTMLInputElement).value })} placeholder="John" class={inputClass} />
              </div>
              <div>
                <label class={labelClass}>Last Name</label>
                <input type="text" value={vcard.lastName} onInput={(e) => setVcard({ ...vcard, lastName: (e.target as HTMLInputElement).value })} placeholder="Doe" class={inputClass} />
              </div>
            </div>
            <div>
              <label class={labelClass}>Phone</label>
              <input type="tel" value={vcard.phone} onInput={(e) => setVcard({ ...vcard, phone: (e.target as HTMLInputElement).value })} placeholder="+1234567890" class={inputClass} />
            </div>
            <div>
              <label class={labelClass}>Email</label>
              <input type="email" value={vcard.email} onInput={(e) => setVcard({ ...vcard, email: (e.target as HTMLInputElement).value })} placeholder="john@example.com" class={inputClass} />
            </div>
            <div>
              <label class={labelClass}>Organization</label>
              <input type="text" value={vcard.org} onInput={(e) => setVcard({ ...vcard, org: (e.target as HTMLInputElement).value })} placeholder="Company Inc." class={inputClass} />
            </div>
            <div>
              <label class={labelClass}>Website</label>
              <input type="url" value={vcard.url} onInput={(e) => setVcard({ ...vcard, url: (e.target as HTMLInputElement).value })} placeholder="https://example.com" class={inputClass} />
            </div>
          </div>
        )}

        {qrType === 'email' && (
          <div class="space-y-3">
            <div>
              <label class={labelClass}>To</label>
              <input type="email" value={emailData.to} onInput={(e) => setEmailData({ ...emailData, to: (e.target as HTMLInputElement).value })} placeholder="recipient@example.com" class={inputClass} />
            </div>
            <div>
              <label class={labelClass}>Subject</label>
              <input type="text" value={emailData.subject} onInput={(e) => setEmailData({ ...emailData, subject: (e.target as HTMLInputElement).value })} placeholder="Hello!" class={inputClass} />
            </div>
            <div>
              <label class={labelClass}>Body</label>
              <textarea value={emailData.body} onInput={(e) => setEmailData({ ...emailData, body: (e.target as HTMLTextAreaElement).value })} placeholder="Email body..." rows={3} class={inputClass} />
            </div>
          </div>
        )}

        {/* Customization */}
        <div class="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
          <h4 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Customization</h4>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class={labelClass}>Size (px)</label>
              <select value={size} onChange={(e) => setSize(Number((e.target as HTMLSelectElement).value))} class={inputClass}>
                <option value="128">128</option>
                <option value="256">256</option>
                <option value="512">512</option>
                <option value="1024">1024</option>
              </select>
            </div>
            <div>
              <label class={labelClass}>Error Correction</label>
              <select value={errorLevel} onChange={(e) => setErrorLevel((e.target as HTMLSelectElement).value as ErrorLevel)} class={inputClass}>
                <option value="L">Low (7%)</option>
                <option value="M">Medium (15%)</option>
                <option value="Q">Quartile (25%)</option>
                <option value="H">High (30%)</option>
              </select>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class={labelClass}>Foreground</label>
              <div class="flex items-center gap-2">
                <input type="color" value={fgColor} onInput={(e) => setFgColor((e.target as HTMLInputElement).value)} class="w-8 h-8 rounded cursor-pointer border-0" />
                <input type="text" value={fgColor} onInput={(e) => setFgColor((e.target as HTMLInputElement).value)} class={inputClass} />
              </div>
            </div>
            <div>
              <label class={labelClass}>Background</label>
              <div class="flex items-center gap-2">
                <input type="color" value={bgColor} onInput={(e) => setBgColor((e.target as HTMLInputElement).value)} class="w-8 h-8 rounded cursor-pointer border-0" />
                <input type="text" value={bgColor} onInput={(e) => setBgColor((e.target as HTMLInputElement).value)} class={inputClass} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Preview & Download */}
      <div class="flex flex-col items-center gap-4">
        <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 inline-block">
          <canvas ref={canvasRef} />
        </div>

        <div class="flex gap-3">
          <button
            onClick={() => downloadAs('png')}
            disabled={!content.trim()}
            class="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            Download PNG
          </button>
          <button
            onClick={() => downloadAs('svg')}
            disabled={!content.trim()}
            class="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            Download SVG
          </button>
        </div>

        <p class="text-xs text-gray-500 dark:text-gray-400 text-center max-w-xs">
          Everything runs in your browser. No data is sent to any server.
        </p>
      </div>
    </div>
  );
}
