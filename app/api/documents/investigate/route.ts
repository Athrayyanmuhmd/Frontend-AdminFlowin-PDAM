import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = (process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:5000/api')
  .replace(/\/api$/, '');

/**
 * POST /api/documents/investigate
 * Body: multipart/form-data { file: <pdf atau gambar> }
 *
 * Same-origin relay to BE_backend /documents/investigate.
 */
export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!token) {
    return NextResponse.json({ error: 'Token wajib.' }, { status: 401 });
  }

  try {
    const formData = await request.formData();

    const backendRes = await fetch(`${BACKEND_URL}/documents/investigate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
      signal: AbortSignal.timeout(30_000),
    });

    const json = await backendRes.json();
    return NextResponse.json(json, { status: backendRes.status });
  } catch (err: any) {
    console.error('[documents/investigate relay]', err);
    return NextResponse.json({ error: 'Gagal memproses file investigasi.' }, { status: 500 });
  }
}
