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
 * Build URL proxy dokumen — lewat Next.js API route /api/documents/view (same-origin).
 * Same-origin relay menghindari X-Frame-Options / CSP cross-origin restrictions
 * yang muncul saat iframe mencoba load URL dari domain backend langsung.
 *
 * @param cloudinaryUrl  - URL Cloudinary asli dari database
 * @param token          - admin_token dari localStorage
 * @param docType        - jenis dokumen: 'NIK' | 'KK' | 'IMB' | 'RAB' | 'SURVEI'
 * @param ownerId        - _id KoneksiData atau dokumen terkait
 */
export function buildProxyUrl(
  cloudinaryUrl: string,
  token: string,
  docType: string,
  ownerId: string,
): string {
  const params = new URLSearchParams({
    url:       cloudinaryUrl,
    token,
    docType,
    ownerId,
    userAgent: getClientUserAgent(),
  });
  return `/api/documents/view?${params.toString()}`;
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
  docType = 'UNKNOWN',
  ownerId = 'unknown',
): { type: 'pdf' | 'image'; src: string; clientIp: string; userAgent: string } | null {
  if (!cloudinaryUrl) return null;

  const token = getAdminToken();
  const userAgent = getClientUserAgent();

  if (token) {
    // Proxy aktif — semua dokumen lewat backend (canary + access log)
    const params = new URLSearchParams({ url: cloudinaryUrl, token, docType, ownerId, userAgent });
    const proxySrc = `/api/documents/view?${params.toString()}`;
    const type = isPdfUrl(cloudinaryUrl) ? 'pdf' : 'image';
    return { type, src: proxySrc, clientIp: '', userAgent };
  }

  // Fallback: tidak ada token (seharusnya tidak terjadi di halaman yang sudah auth)
  if (isPdfUrl(cloudinaryUrl)) {
    return { type: 'pdf', src: toPdfInlineUrl(cloudinaryUrl), clientIp: '', userAgent };
  }
  return { type: 'image', src: cloudinaryUrl, clientIp: '', userAgent };
}
