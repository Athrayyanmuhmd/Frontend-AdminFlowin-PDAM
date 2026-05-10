import { NextRequest, NextResponse } from 'next/server';

// Derive backend base URL from env — strip /api suffix if present
const BACKEND_URL = (process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:5000/api')
  .replace(/\/api$/, '');

/**
 * GET /api/documents/view?url=<cloudinaryUrl>&token=<jwt>&docType=<type>&ownerId=<id>
 *
 * Same-origin relay to BE_backend /documents/view.
 * Using a relay route avoids cross-origin iframe restrictions (X-Frame-Options, CSP)
 * that would block the backend response from loading inside a dialog iframe.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const url     = searchParams.get('url');
  const token   = searchParams.get('token');
  const docType = searchParams.get('docType') ?? 'UNKNOWN';
  const ownerId = searchParams.get('ownerId') ?? 'unknown';

  if (!url || !token) {
    return NextResponse.json({ error: 'Parameter url dan token wajib diisi.' }, { status: 400 });
  }

  try {
    const backendParams = new URLSearchParams({ url, docType, ownerId });
    const backendRes = await fetch(
      `${BACKEND_URL}/documents/view?${backendParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        // 30s timeout via AbortController
        signal: AbortSignal.timeout(30_000),
      }
    );

    if (!backendRes.ok) {
      const text = await backendRes.text().catch(() => '');
      return NextResponse.json(
        { error: 'Backend error', detail: text },
        { status: backendRes.status }
      );
    }

    const buffer = await backendRes.arrayBuffer();
    const contentType = backendRes.headers.get('content-type') ?? 'application/octet-stream';

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(buffer.byteLength),
        'Content-Disposition': 'inline',
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (err: any) {
    console.error('[documents/view relay]', err);
    return NextResponse.json({ error: 'Gagal mengambil dokumen.' }, { status: 500 });
  }
}
