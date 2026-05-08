'use client';
import { useState, useMemo } from 'react';

type Order = 'asc' | 'desc';

/** Traverse a dot-notation path on an object (e.g. "koneksiData.pelanggan.namaLengkap") */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((acc: any, key: string) => acc?.[key], obj);
}

/**
 * Client-side sort hook for MUI tables.
 *
 * Usage:
 *   const { sorted, sortKey, sortOrder, handleSort } = useTableSort(filteredData);
 *   const onSort = (key: string) => { handleSort(key); setPage(1); };
 *
 * In JSX:
 *   <TableSortLabel active={sortKey === 'field'} direction={sortKey === 'field' ? sortOrder : 'asc'} onClick={() => onSort('field')}>
 *     Column Label
 *   </TableSortLabel>
 */
export function useTableSort<T>(data: T[]) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<Order>('asc');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const av = getNestedValue(a, sortKey);
      const bv = getNestedValue(b, sortKey);
      // Null/undefined always sorts to bottom regardless of order
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp =
        typeof av === 'string' && typeof bv === 'string'
          ? av.localeCompare(bv, 'id')
          : av < bv
          ? -1
          : av > bv
          ? 1
          : 0;
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [data, sortKey, sortOrder]);

  return { sorted, sortKey, sortOrder, handleSort };
}
