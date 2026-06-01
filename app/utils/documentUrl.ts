'use client';

/**
 * Return true jika URL mengarah ke PDF.
 * Digunakan sebagai backward-compat check untuk data lama (JPG) vs baru (PDF).
 */
export function isPdfUrl(url?: string | null): boolean {
  if (!url) return false;
  return url.toLowerCase().endsWith('.pdf');
}

/**
 * Build URL dokumen — untuk demo, load langsung dari Cloudinary tanpa proxy.
 */
export function buildProxyUrl(
  cloudinaryUrl: string,
  _token: string,
  _docType: string,
  _ownerId: string,
): string {
  if (isPdfUrl(cloudinaryUrl)) return toPdfInlineUrl(cloudinaryUrl);
  return cloudinaryUrl;
}

/**
 * Ambil admin_token dari localStorage.
 * Return string kosong jika tidak ditemukan (SSR-safe).
 */
export function getAdminToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('admin_token') ?? '';
}

/**
 * Ambil user agent browser saat ini.
 * Return string kosong jika tidak tersedia (SSR-safe).
 */
export function getClientUserAgent(): string {
  if (typeof navigator === 'undefined') return '';
  return navigator.userAgent;
}

/**
 * Kembalikan URL inline Cloudinary (fallback jika proxy dimatikan).
 * Hanya efektif untuk raw PDF di Cloudinary.
 */
export function toPdfInlineUrl(url: string): string {
  return url.replace('/upload/', '/upload/fl_attachment:false/');
}

/**
 * Resolve URL dokumen ke proxy (jika token tersedia) atau fallback ke URL asli.
 * Gunakan ini di semua komponen yang menampilkan dokumen.
 */
export function resolveDocumentUrl(
  cloudinaryUrl?: string | null,
  _docType = 'UNKNOWN',
  _ownerId = 'unknown',
): { type: 'pdf' | 'image'; src: string; clientIp: string; userAgent: string } | null {
  if (!cloudinaryUrl) return null;

  const userAgent = getClientUserAgent();

  // Demo mode: load langsung dari Cloudinary
  if (isPdfUrl(cloudinaryUrl)) {
    return { type: 'pdf', src: toPdfInlineUrl(cloudinaryUrl), clientIp: '', userAgent };
  }
  return { type: 'image', src: cloudinaryUrl, clientIp: '', userAgent };
}
