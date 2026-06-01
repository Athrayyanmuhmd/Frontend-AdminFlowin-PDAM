import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = (process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:5000/api')
  .replace(/\/api$/, '');

/** Extract real client IP from Vercel / Cloudflare headers. */
function getRealClientIp(request: NextRequest): string {
  const vercelForwarded = request.headers.get('x-vercel-forwarded-for');
  if (vercelForwarded) return vercelForwarded.split(',')[0].trim();
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp;
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return '';
}

/**
 * GET /api/documents/view?url=<cloudinaryUrl>&token=<jwt>&docType=<type>&ownerId=<id>
 *
 * Same-origin relay ke BE_backend /documents/view.
 * Backend streams file dengan Content-Disposition: inline → PDF preview di iframe.
 * Jika backend redirect 302 (fallback saat Cloudinary tidak bisa di-fetch),
 * teruskan redirect tersebut ke browser.
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
        redirect: 'manual',
        signal: AbortSignal.timeout(30_000),
      }
    );

    // Backend fallback redirect ke Cloudinary → teruskan ke browser
    if (backendRes.status >= 300 && backendRes.status < 400) {
      const location = backendRes.headers.get('location');
      if (location) return NextResponse.redirect(location, 302);
    }

    if (!backendRes.ok) {
      const text = await backendRes.text().catch(() => '');
      console.error('[documents/view relay] backend error:', backendRes.status, text);
      return NextResponse.json(
        { error: 'Backend error', status: backendRes.status, detail: text.slice(0, 500) },
        { status: backendRes.status }
      );
    }

    // Stream-through: ambil body backend dan teruskan dengan header yang sama
    const buffer = await backendRes.arrayBuffer();
    const contentType = backendRes.headers.get('content-type') ?? 'application/octet-stream';

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type':           contentType,
        'Content-Disposition':    'inline',
        'Cache-Control':          'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err: any) {
    console.error('[documents/view relay] fetch failed:', err?.message ?? err);
    // Backend tidak bisa dihubungi → fallback redirect ke Cloudinary langsung
    return NextResponse.redirect(url, 302);
  }
}
