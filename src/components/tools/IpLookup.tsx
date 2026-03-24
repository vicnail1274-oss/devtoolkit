import { useState, useEffect, useCallback } from 'preact/hooks';
import QuickNav from '../QuickNav';

interface IpInfo {
  ip: string;
  city?: string;
  region?: string;
  country?: string;
  loc?: string;
  org?: string;
  timezone?: string;
  postal?: string;
}

async function fetchIpInfo(ip?: string): Promise<IpInfo> {
  const url = ip
    ? `https://ipinfo.io/${encodeURIComponent(ip)}/json`
    : 'https://ipinfo.io/json';
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Lookup failed (${res.status})`);
  return res.json();
}

function isValidIp(value: string): boolean {
  const v4 = /^(\d{1,3}\.){3}\d{1,3}$/;
  const v6 = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  if (v4.test(value)) {
    return value.split('.').every((p) => {
      const n = Number(p);
      return n >= 0 && n <= 255;
    });
  }
  return v6.test(value);
}

export default function IpLookup() {
  const [myIp, setMyIp] = useState<IpInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [lookupResult, setLookupResult] = useState<IpInfo | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [copied, setCopied] = useState('');

  useEffect(() => {
    fetchIpInfo()
      .then((data) => {
        setMyIp(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Unable to detect your IP address.');
        setLoading(false);
      });
  }, []);

  const handleLookup = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    if (!isValidIp(trimmed)) {
      setLookupError('Please enter a valid IPv4 or IPv6 address.');
      return;
    }
    setLookupLoading(true);
    setLookupError('');
    setLookupResult(null);
    try {
      const data = await fetchIpInfo(trimmed);
      setLookupResult(data);
    } catch {
      setLookupError('Lookup failed. Please check the IP address and try again.');
    } finally {
      setLookupLoading(false);
    }
  }, [query]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') handleLookup();
  };

  const copyText = async (text: string, label: string) => {
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
    setTimeout(() => setCopied(''), 2000);
  };

  const InfoRow = ({ label, value, copyKey }: { label: string; value: string; copyKey: string }) => (
    <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
      <div class="min-w-0">
        <div class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">{label}</div>
        <div class="font-mono text-sm text-gray-900 dark:text-gray-100 break-all">{value}</div>
      </div>
      <button
        onClick={() => copyText(value, copyKey)}
        class={`ml-3 flex-shrink-0 px-2 py-1 text-xs font-medium rounded transition-colors ${
          copied === copyKey
            ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
            : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300'
        }`}
      >
        {copied === copyKey ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );

  const renderInfoCard = (info: IpInfo, prefix: string) => {
    const rows: { label: string; value: string }[] = [
      { label: 'IP Address', value: info.ip },
    ];
    if (info.city) rows.push({ label: 'City', value: info.city });
    if (info.region) rows.push({ label: 'Region', value: info.region });
    if (info.country) rows.push({ label: 'Country', value: info.country });
    if (info.loc) rows.push({ label: 'Location', value: info.loc });
    if (info.postal) rows.push({ label: 'Postal Code', value: info.postal });
    if (info.timezone) rows.push({ label: 'Timezone', value: info.timezone });
    if (info.org) rows.push({ label: 'Organization / ISP', value: info.org });

    return (
      <div class="space-y-3">
        {rows.map(({ label, value }) => (
          <InfoRow key={`${prefix}-${label}`} label={label} value={value} copyKey={`${prefix}-${label}`} />
        ))}
      </div>
    );
  };

  return (
    <div class="space-y-6">
      <QuickNav
        links={[
          { label: 'Hash Generator', href: '/tools/hash-generator' },
          { label: 'Password Generator', href: '/tools/password-generator' },
        ]}
      />

      {/* Your IP */}
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Your IP Address</h2>
        {loading ? (
          <div class="flex items-center justify-center h-24 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div class="flex items-center gap-2 text-gray-400">
              <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span class="text-sm">Detecting...</span>
            </div>
          </div>
        ) : error ? (
          <div class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        ) : myIp ? (
          <>
            <div class="flex items-center gap-3 mb-4 p-4 bg-primary-50 dark:bg-primary-950/30 border border-primary-200 dark:border-primary-800 rounded-lg">
              <span class="font-mono text-2xl font-bold text-gray-900 dark:text-gray-100">{myIp.ip}</span>
              <button
                onClick={() => copyText(myIp.ip, 'my-ip')}
                class={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  copied === 'my-ip'
                    ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
              >
                {copied === 'my-ip' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            {renderInfoCard(myIp, 'my')}
          </>
        ) : null}
      </div>

      {/* Lookup */}
      <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">IP Address Lookup</h2>
        <div class="flex gap-2">
          <input
            type="text"
            value={query}
            onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter an IP address (e.g. 8.8.8.8)"
            class="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
          <button
            onClick={handleLookup}
            disabled={lookupLoading}
            class="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {lookupLoading ? 'Looking up...' : 'Lookup'}
          </button>
        </div>

        {lookupError && (
          <div class="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
            {lookupError}
          </div>
        )}

        {lookupResult && (
          <div class="mt-4">{renderInfoCard(lookupResult, 'lookup')}</div>
        )}

        {!lookupResult && !lookupError && !lookupLoading && (
          <div class="mt-4 flex items-center justify-center h-24 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl">
            <p class="text-gray-400 dark:text-gray-500 text-sm">Enter an IP address above and click Lookup</p>
          </div>
        )}
      </div>
    </div>
  );
}
