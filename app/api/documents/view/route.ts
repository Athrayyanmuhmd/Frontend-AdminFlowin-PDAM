import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = (process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:5000/api')
  .replace(/\/api$/, '');

/** Extract real client IP from Vercel / Cloudflare headers set on every incoming request. */
function getRealClientIp(request: NextRequest): string {
  // Vercel adds this header — contains original visitor IP
  const vercelForwarded = request.headers.get('x-vercel-forwarded-for');
  if (vercelForwarded) return vercelForwarded.split(',')[0].trim();

  // Cloudflare
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp;

  // Standard proxy header
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();

  return '';
}

/**
 * GET /api/documents/view?url=<cloudinaryUrl>&token=<jwt>&docType=<type>&ownerId=<id>
 *
 * Same-origin relay to BE_backend /documents/view.
 * Same-origin relay avoids X-Frame-Options / CSP cross-origin restrictions
 * that would block the backend response from loading inside a dialog iframe.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const url       = searchParams.get('url');
  const token     = searchParams.get('token');
  const docType   = searchParams.get('docType') ?? 'UNKNOWN';
  const ownerId   = searchParams.get('ownerId') ?? 'unknown';
  const userAgent = searchParams.get('userAgent') ?? request.headers.get('user-agent') ?? '';

  if (!url || !token) {
    return NextResponse.json({ error: 'Parameter url dan token wajib diisi.' }, { status: 400 });
  }

  const clientIp = getRealClientIp(request);

  try {
    const backendParams = new URLSearchParams({ url, docType, ownerId });
    const backendRes = await fetch(
      `${BACKEND_URL}/documents/view?${backendParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Real-IP':        clientIp,
          'X-Client-User-Agent': userAgent,
        },
        signal: AbortSignal.timeout(30_000),
      }
    );

    if (!backendRes.ok) {
      const text = await backendRes.text().catch(() => '');
      console.error('[documents/view relay] backend error:', backendRes.status, text);
      return NextResponse.json(
        { error: 'Backend error', status: backendRes.status, detail: text.slice(0, 500) },
        { status: backendRes.status }
      );
    }

    const buffer = await backendRes.arrayBuffer();
    const contentType = backendRes.headers.get('content-type') ?? 'application/octet-stream';

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type':        contentType,
        'Content-Disposition': 'inline',
        'Cache-Control':       'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err: any) {
    console.error('[documents/view relay] fetch failed:', err?.message ?? err);
    return NextResponse.json(
      { error: 'Gagal mengambil dokumen.', detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
