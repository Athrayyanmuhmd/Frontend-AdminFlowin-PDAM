'use client';

/**
 * Return true jika URL mengarah ke PDF.
 */
export function isPdfUrl(url?: string | null): boolean {
  if (!url) return false;
  return url.toLowerCase().endsWith('.pdf');
}

/**
 * Build URL proxy dokumen — lewat Next.js API route /api/documents/view (same-origin).
 * Backend menyisipkan canary fingerprint ke file dan mencatat akses ke AksesLog.
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

export function getAdminToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('admin_token') ?? '';
}

export function getClientUserAgent(): string {
  if (typeof navigator === 'undefined') return '';
  return navigator.userAgent;
}

/**
 * Force inline PDF dari Cloudinary (override Content-Disposition: attachment).
 * Dipakai sebagai fallback jika proxy tidak tersedia.
 */
export function toPdfInlineUrl(url: string): string {
  return url.replace('/upload/', '/upload/fl_attachment:false/');
}

/**
 * Resolve URL dokumen ke proxy (jika token tersedia) atau fallback ke URL asli.
 * Gunakan ini di semua komponen yang menampilkan dokumen agar canary + AksesLog jalan.
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
    const params = new URLSearchParams({ url: cloudinaryUrl, token, docType, ownerId, userAgent });
    const proxySrc = `/api/documents/view?${params.toString()}`;
    const type = isPdfUrl(cloudinaryUrl) ? 'pdf' : 'image';
    return { type, src: proxySrc, clientIp: '', userAgent };
  }

  if (isPdfUrl(cloudinaryUrl)) {
    return { type: 'pdf', src: toPdfInlineUrl(cloudinaryUrl), clientIp: '', userAgent };
  }
  return { type: 'image', src: cloudinaryUrl, clientIp: '', userAgent };
}
