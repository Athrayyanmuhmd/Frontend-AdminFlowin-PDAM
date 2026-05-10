'use client';

/**
 * Return true jika URL mengarah ke PDF (bukan gambar).
 * Digunakan untuk memilih renderer: <img> vs <iframe>.
 */
export function isPdfUrl(url?: string | null): boolean {
  if (!url) return false;
  return url.toLowerCase().endsWith('.pdf');
}

/**
 * Konversi Cloudinary URL agar PDF terbuka inline di browser (bukan download).
 * Hanya efektif untuk raw PDF di Cloudinary.
 */
export function toPdfInlineUrl(url: string): string {
  return url.replace('/upload/', '/upload/fl_attachment:false/');
}

/**
 * Render PDF atau gambar secara konsisten.
 * Kembalikan props yang siap dipakai:
 *   - type: 'pdf' | 'image'
 *   - src: URL yang sudah diproses
 */
export function resolveDocumentUrl(url?: string | null): { type: 'pdf' | 'image'; src: string } | null {
  if (!url) return null;
  if (isPdfUrl(url)) return { type: 'pdf', src: toPdfInlineUrl(url) };
  return { type: 'image', src: url };
}
