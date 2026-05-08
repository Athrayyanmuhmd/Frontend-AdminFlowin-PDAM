'use client';

import { useState, useEffect } from 'react';

// Persist filter/search state ke localStorage per halaman
// Key unik per halaman, auto-expire setelah 24 jam (tidak stale saat sesi baru)
export function useFilterPersist<T>(key: string, defaultValue: T): [T, (v: T) => void] {
  const storageKey = `filter_${key}`;

  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return defaultValue;
      const { data, ts } = JSON.parse(stored);
      // Expire setelah 24 jam
      if (Date.now() - ts > 86400000) {
        localStorage.removeItem(storageKey);
        return defaultValue;
      }
      return data as T;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ data: value, ts: Date.now() }));
    } catch {
      // Storage penuh atau private mode — fail silently
    }
  }, [storageKey, value]);

  return [value, setValue];
}
