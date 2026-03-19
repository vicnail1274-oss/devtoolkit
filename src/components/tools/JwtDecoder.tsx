import { useState } from 'preact/hooks';
import { useToolState } from '../../hooks/useToolState';
import QuickNav from '../QuickNav';

interface JwtParts {
  header: Record<string, unknown> | null;
  payload: Record<string, unknown> | null;
  signature: string;
  isValid: boolean;
  error?: string;
}

function decodeJwt(token: string): JwtParts {
  const empty: JwtParts = { header: null, payload: null, signature: '', isValid: false };
  const trimmed = token.trim();
  if (!trimmed) return { ...empty, error: 'Paste a JWT token above to decode it.' };

  const parts = trimmed.split('.');
  if (parts.length !== 3) return { ...empty, error: 'Invalid JWT: must have 3 parts separated by dots.' };

  try {
    const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return { header, payload, signature: parts[2], isValid: true };
  } catch {
    return { ...empty, error: 'Failed to decode JWT. Check that the token is valid.' };
  }
}

function formatTimestamp(ts: number): string {
  try {
    const date = new Date(ts * 1000);
    if (isNaN(date.getTime())) return String(ts);
    const now = Date.now();
    const diff = ts * 1000 - now;
    const expired = diff < 0;
    const label = expired ? 'expired' : 'from now';
    const absDiff = Math.abs(diff);
    const mins = Math.floor(absDiff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    let relative = '';
    if (days > 0) relative = `${days}d ${hours % 24}h`;
    else if (hours > 0) relative = `${hours}h ${mins % 60}m`;
    else relative = `${mins}m`;
    return `${date.toISOString()} (${relative} ${label})`;
  } catch {
    return String(ts);
  }
}

const KNOWN_CLAIMS: Record<string, string> = {
  iss: 'Issuer',
  sub: 'Subject',
  aud: 'Audience',
  exp: 'Expiration',
  nbf: 'Not Before',
  iat: 'Issued At',
  jti: 'JWT ID',
};

const TIME_CLAIMS = new Set(['exp', 'nbf', 'iat']);

export default function JwtDecoder() {
  const { value: input, setValue: setInput, getShareUrl } = useToolState('jwt-decoder');
  const result = decodeJwt(input);

  const isExpired = result.payload?.exp
    ? (result.payload.exp as number) * 1000 < Date.now()
    : null;

  return (
    <div class="space-y-6">
      <QuickNav links={[
        { label: 'Base64', href: '/tools/base64' },
        { label: 'Hash Generator', href: '/tools/hash-generator' },
        { label: 'Password Generator', href: '/tools/password-generator' },
      ]} />
      {/* Input */}
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          JWT Token
        </label>
        <textarea
          value={input}
          onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U"
          rows={4}
          class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-y"
          spellcheck={false}
        />
      </div>

      {/* Status Badge */}
      {result.isValid && (
        <div class="flex items-center gap-3">
          {isExpired === true && (
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
              <span class="w-2 h-2 rounded-full bg-red-500" /> Expired
            </span>
          )}
          {isExpired === false && (
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
              <span class="w-2 h-2 rounded-full bg-green-500" /> Valid
            </span>
          )}
          {result.header?.alg && (
            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
              Algorithm: {String(result.header.alg)}
            </span>
          )}
        </div>
      )}

      {/* Error */}
      {result.error && input.trim() && (
        <div class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
          {result.error}
        </div>
      )}

      {/* Decoded Sections */}
      {result.isValid && (
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Header */}
          <div>
            <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">
              Header
            </h3>
            <pre class="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-mono overflow-x-auto text-blue-700 dark:text-blue-400">
              {JSON.stringify(result.header, null, 2)}
            </pre>
          </div>

          {/* Payload */}
          <div>
            <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">
              Payload
            </h3>
            <pre class="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-mono overflow-x-auto text-green-700 dark:text-green-400">
              {JSON.stringify(result.payload, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Claims Table */}
      {result.isValid && result.payload && (
        <div>
          <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">
            Claims
          </h3>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th class="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Claim</th>
                  <th class="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Name</th>
                  <th class="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Value</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(result.payload).map(([key, value]) => (
                  <tr key={key} class="border-b border-gray-100 dark:border-gray-800">
                    <td class="py-2 px-3 font-mono text-primary-600 dark:text-primary-400">{key}</td>
                    <td class="py-2 px-3 text-gray-500 dark:text-gray-400">
                      {KNOWN_CLAIMS[key] || 'Custom'}
                    </td>
                    <td class="py-2 px-3 font-mono text-gray-900 dark:text-gray-100">
                      {TIME_CLAIMS.has(key) && typeof value === 'number'
                        ? formatTimestamp(value)
                        : JSON.stringify(value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Signature */}
      {result.isValid && (
        <div>
          <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">
            Signature
          </h3>
          <div class="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-mono text-gray-500 dark:text-gray-400 break-all">
            {result.signature}
          </div>
          <p class="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Signature verification requires the secret key and is not performed client-side.
          </p>
        </div>
      )}
    </div>
  );
}
