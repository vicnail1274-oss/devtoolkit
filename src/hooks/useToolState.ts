import { useState, useEffect, useCallback } from 'preact/hooks';

const STORAGE_PREFIX = 'devtoolkit_';
const MAX_URL_LENGTH = 2000; // Keep URLs reasonable

/**
 * Hook that syncs tool input with URL search params and localStorage.
 * - On mount: reads from URL ?input= first, falls back to localStorage
 * - On change: updates localStorage and URL (if short enough)
 * - Provides a share URL generator
 */
export function useToolState(toolSlug: string, defaultValue = '') {
  const storageKey = `${STORAGE_PREFIX}${toolSlug}_input`;

  const getInitialValue = (): string => {
    if (typeof window === 'undefined') return defaultValue;

    // URL param takes priority (shared link)
    const params = new URLSearchParams(window.location.search);
    const urlInput = params.get('input');
    if (urlInput) return urlInput;

    // Fall back to localStorage
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return saved;
    } catch {}

    return defaultValue;
  };

  const [value, setValue] = useState(getInitialValue);

  // Save to localStorage on change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (value) {
        localStorage.setItem(storageKey, value);
      } else {
        localStorage.removeItem(storageKey);
      }
    } catch {}
  }, [value, storageKey]);

  // Update URL silently when value changes (only if short enough)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (value && value.length < 500) {
      url.searchParams.set('input', value);
    } else {
      url.searchParams.delete('input');
    }
    // Only update if URL actually changed
    if (url.href !== window.location.href) {
      window.history.replaceState(null, '', url.href);
    }
  }, [value]);

  // Generate a shareable URL
  const getShareUrl = useCallback((): string => {
    if (typeof window === 'undefined') return '';
    const url = new URL(window.location.href);
    url.searchParams.delete('input');
    if (value) {
      url.searchParams.set('input', value);
    }
    const result = url.href;
    // If too long, return base URL
    if (result.length > MAX_URL_LENGTH) {
      url.searchParams.delete('input');
      return url.href;
    }
    return result;
  }, [value]);

  return { value, setValue, getShareUrl };
}

/**
 * Simpler version for tools with multiple fields (e.g., Diff Checker).
 * Only does localStorage persistence, no URL params.
 */
export function useToolStorage(toolSlug: string, field: string, defaultValue = '') {
  const storageKey = `${STORAGE_PREFIX}${toolSlug}_${field}`;

  const getInitialValue = (): string => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      return localStorage.getItem(storageKey) || defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const [value, setValue] = useState(getInitialValue);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (value) {
        localStorage.setItem(storageKey, value);
      } else {
        localStorage.removeItem(storageKey);
      }
    } catch {}
  }, [value, storageKey]);

  return { value, setValue };
}
