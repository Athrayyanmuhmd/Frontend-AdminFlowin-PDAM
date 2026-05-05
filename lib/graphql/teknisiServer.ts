'use server';

import crypto from 'crypto';

// ─── Config ──────────────────────────────────────────────────────────────────

const TEKNISI_GRAPHQL_URL =
  process.env.NEXT_GRAPHQL_TEKNISI ??
  'https://flowin-teknisi-graphql.vercel.app/graphql';

const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET ?? '';

// ─── Signature Helper (mirrors backend canonicalize + HMAC-SHA256) ───────────

function canonicalize(obj: unknown): string {
  if (obj === null || obj === undefined) return 'null';
  if (typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return '[' + obj.map(canonicalize).join(',') + ']';

  const sorted = Object.keys(obj as Record<string, unknown>)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = (obj as Record<string, unknown>)[key];
      return acc;
    }, {});

  const entries = Object.entries(sorted).map(
    ([k, v]) => `${JSON.stringify(k)}:${canonicalize(v)}`
  );
  return '{' + entries.join(',') + '}';
}

function generateSignature(payload: Record<string, unknown>): string {
  const canonical = canonicalize(payload);
  return crypto
    .createHmac('sha256', INTERNAL_API_SECRET)
    .update(canonical)
    .digest('hex');
}

// ─── Core Fetch Wrapper ──────────────────────────────────────────────────────
// Token admin dari backend utama sudah terintegrasi dengan backend teknisi,
// jadi cukup forward token yang sama.

interface TeknisiGqlOptions {
  /** Bearer token (admin_token dari localStorage) */
  token?: string;
  /** If the mutation input needs x-signature, pass the raw input object here */
  signaturePayload?: Record<string, unknown>;
}

interface GqlResult<T = Record<string, unknown>> {
  data: T | null;
  errors: Array<{
    message: string;
    extensions?: Record<string, unknown>;
  }> | null;
}

async function teknisiGql<T = Record<string, unknown>>(
  query: string,
  variables?: Record<string, unknown>,
  options?: TeknisiGqlOptions
): Promise<GqlResult<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-api-key': INTERNAL_API_SECRET,
  };

  if (options?.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  if (options?.signaturePayload) {
    headers['x-signature'] = generateSignature(options.signaturePayload);
  }

  const res = await fetch(TEKNISI_GRAPHQL_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
  });

  const json = await res.json();
  return { data: json.data ?? null, errors: json.errors ?? null };
}

// ═════════════════════════════════════════════════════════════════════════════
// QUERIES — token = admin_token dari localStorage (terintegrasi antar backend)
// ═════════════════════════════════════════════════════════════════════════════

// ─── Users ───────────────────────────────────────────────────────────────────

export async function getTeknisiUsers(token: string, search?: string) {
  return teknisiGql(
    `query GetUsers($search: String) {
      users(search: $search) {
        id namaLengkap nip email noHp divisi isActive pekerjaanSekarang createdAt updatedAt
      }
    }`,
    { search },
    { token }
  );
}

export async function getTeknisiUser(token: string, id: string) {
  return teknisiGql(
    `query GetUser($id: ID!) {
      user(id: $id) {
        id namaLengkap nip email noHp divisi isActive pekerjaanSekarang createdAt updatedAt
      }
    }`,
    { id },
    { token }
  );
}

// ─── Work Orders ─────────────────────────────────────────────────────────────

export async function getWorkOrders(
  token: string,
  variables?: {
    pagination?: { page?: number; limit?: number };
    filter?: Record<string, unknown>;
  }
) {
  return teknisiGql(
    `query GetWorkOrders($pagination: PaginationInput, $filter: WorkOrderFilterInput) {
      workOrders(pagination: $pagination, filter: $filter) {
        data {
          id idKoneksiData jenisPekerjaan status statusRespon statusTim catatanTim
          alasanPenolakan catatanReviewPenolakan catatanReview createdAt updatedAt
          koneksiData {
            id alamat statusPengajuan
            pelanggan { id namaLengkap noHp email }
          }
          teknisiPenanggungJawab { id namaLengkap nip divisi }
          tim { id namaLengkap nip divisi }
        }
        pagination { total page limit totalPages }
      }
    }`,
    variables,
    { token }
  );
}

export async function getWorkOrder(token: string, id: string) {
  return teknisiGql(
    `query GetWorkOrder($id: ID!) {
      workOrder(id: $id) {
        id idKoneksiData jenisPekerjaan status statusRespon statusTim catatanTim
        alasanPenolakan catatanReviewPenolakan catatanReview createdAt updatedAt
        koneksiData {
          id alamat kelurahan kecamatan statusPengajuan
          tanggalVerifikasi alasanPenolakan createdAt updatedAt
          pelanggan { id namaLengkap noHp email alamat }
        }
        teknisiPenanggungJawab { id namaLengkap nip divisi }
        tim { id namaLengkap nip divisi }
        workOrderSebelumnya { id jenisPekerjaan status }
        riwayatRespon { aksi alasan tanggal oleh }
        riwayatReview { status catatan tanggal oleh }
        idSurvei idRAB idPemasangan idPengawasanPemasangan
        idPengawasanSetelahPemasangan idPenyelesaianLaporan idLaporan
      }
    }`,
    { id },
    { token }
  );
}

export async function getWorkOrdersByKoneksiData(
  token: string,
  idKoneksiData: string
) {
  return teknisiGql(
    `query GetWorkOrdersByKoneksiData($idKoneksiData: ID!) {
      workOrdersByKoneksiData(idKoneksiData: $idKoneksiData) {
        id idKoneksiData jenisPekerjaan status statusRespon statusTim catatanTim
        alasanPenolakan createdAt updatedAt
        koneksiData {
          id alamat statusPengajuan
          pelanggan { id namaLengkap noHp email }
        }
        teknisiPenanggungJawab { id namaLengkap nip divisi }
        tim { id namaLengkap nip divisi }
      }
    }`,
    { idKoneksiData },
    { token }
  );
}

export async function getWorkflowChain(token: string, idKoneksiData: string) {
  return teknisiGql(
    `query GetWorkflowChain($idKoneksiData: ID!) {
      workflowChain(idKoneksiData: $idKoneksiData) {
        jenisPekerjaan
        workOrder { id status statusRespon statusTim catatanTim createdAt teknisiPenanggungJawab { namaLengkap } }
        chainStatus urutan bisaDibuat
      }
    }`,
    { idKoneksiData },
    { token }
  );
}

export async function cekPrerequisitePekerjaan(
  token: string,
  idKoneksiData: string,
  jenisPekerjaan: string
) {
  return teknisiGql(
    `query CekPrerequisitePekerjaan($idKoneksiData: ID!, $jenisPekerjaan: JenisPekerjaan!) {
      cekPrerequisitePekerjaan(idKoneksiData: $idKoneksiData, jenisPekerjaan: $jenisPekerjaan)
    }`,
    { idKoneksiData, jenisPekerjaan },
    { token }
  );
}

export async function getProgresWorkOrder(token: string, workOrderId: string) {
  return teknisiGql(
    `query GetProgresWorkOrder($workOrderId: ID!) {
      progresWorkOrder(workOrderId: $workOrderId) {
        jenisPekerjaan
        koordinat { longitude latitude }
        urlJaringan diameterPipa urlPosisiBak posisiMeteran jumlahPenghuni standar
        totalBiaya urlRab
        seriMeteran fotoRumah fotoMeteran fotoMeteranDanRumah
        kondisiSebelumDaya kondisiSebelumKoneksi fotoSebelum
        kondisiSetelahDaya kondisiSetelahKoneksi fotoSetelah
        urlGambar
        catatan
      }
    }`,
    { workOrderId },
    { token }
  );
}

export async function getWorkOrdersByJenis(
  token: string,
  jenisPekerjaan: string,
  limit = 500
) {
  return teknisiGql(
    `query GetWorkOrdersByJenis($pagination: PaginationInput, $filter: WorkOrderFilterInput) {
      workOrders(pagination: $pagination, filter: $filter) {
        data {
          id idKoneksiData jenisPekerjaan status statusRespon catatanReview idLaporan createdAt updatedAt
          koneksiData {
            id alamat statusPengajuan kelurahan kecamatan
            pelanggan { id namaLengkap noHp email }
          }
          teknisiPenanggungJawab { id namaLengkap nip divisi }
          tim { id namaLengkap nip divisi }
        }
        pagination { total page limit totalPages }
      }
    }`,
    { filter: { jenisPekerjaan }, pagination: { limit, page: 1 } },
    { token }
  );
}

export async function getLaporan(token: string, idLaporan: string) {
  return teknisiGql(
    `query GetLaporan($id: ID!) {
      laporan(id: $id) {
        id IdPengguna NamaLaporan Masalah Alamat imageUrl JenisLaporan Catatan Status createdAt updatedAt
        pengguna { id namaLengkap email noHp alamat }
        Kordinat { longitude latitude }
      }
    }`,
    { id: idLaporan },
    { token }
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MUTATIONS (Admin-relevant, all require x-signature)
// ═════════════════════════════════════════════════════════════════════════════

export async function registerTeknisi(
  token: string,
  input: {
    namaLengkap: string;
    nip: string;
    email: string;
    noHp: string;
    divisi: string;
    password: string;
  }
) {
  return teknisiGql(
    `mutation Register($input: RegisterInput!) {
      register(input: $input) {
        user { id namaLengkap nip email noHp divisi isActive createdAt }
        tokens { accessToken refreshToken }
      }
    }`,
    { input },
    { token }
  );
}

export async function changeTeknisiPassword(
  token: string,
  input: { oldPassword: string; newPassword: string }
) {
  return teknisiGql(
    `mutation ChangePassword($input: ChangePasswordInput!) {
      changePassword(input: $input) { success message }
    }`,
    { input },
    { token }
  );
}

export async function updateTeknisiUser(
  token: string,
  id: string,
  input: {
    namaLengkap?: string;
    nip?: string;
    email?: string;
    noHp?: string;
    divisi?: string;
  }
) {
  return teknisiGql(
    `mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
      updateUser(id: $id, input: $input) {
        id namaLengkap nip email noHp divisi isActive updatedAt
      }
    }`,
    { id, input },
    { token }
  );
}

export async function deleteTeknisiUser(token: string, id: string) {
  return teknisiGql(
    `mutation DeleteUser($id: ID!) {
      deleteUser(id: $id) { success message }
    }`,
    { id },
    { token }
  );
}

export async function toggleTeknisiUserStatus(token: string, id: string) {
  return teknisiGql(
    `mutation ToggleUserStatus($id: ID!) {
      toggleUserStatus(id: $id) { success message user { id isActive } }
    }`,
    { id },
    { token }
  );
}

// ─── Work Order Mutations (all signed) ───────────────────────────────────────

export async function buatWorkOrder(
  token: string,
  input: {
    idKoneksiData?: string;
    jenisPekerjaan: string;
    teknisiPenanggungJawab: string;
    idLaporan?: string;
  }
) {
  return teknisiGql(
    `mutation BuatWorkOrder($input: BuatWorkOrderInput!) {
      buatWorkOrder(input: $input) {
        success message
        workOrder { id jenisPekerjaan status statusRespon statusTim updatedAt }
      }
    }`,
    { input },
    { token, signaturePayload: input }
  );
}

export async function reviewPenolakan(
  token: string,
  input: {
    workOrderId: string;
    disetujui: boolean;
    catatan?: string;
  }
) {
  return teknisiGql(
    `mutation ReviewPenolakan($input: ReviewPenolakanInput!) {
      reviewPenolakan(input: $input) {
        success message
        workOrder { id status statusRespon updatedAt }
      }
    }`,
    { input },
    { token, signaturePayload: input }
  );
}

export async function reviewTim(
  token: string,
  input: {
    workOrderId: string;
    disetujui: boolean;
    catatan?: string;
  }
) {
  return teknisiGql(
    `mutation ReviewTim($input: ReviewTimInput!) {
      reviewTim(input: $input) {
        success message
        workOrder { id status statusTim catatanTim updatedAt }
      }
    }`,
    { input },
    { token, signaturePayload: input }
  );
}

export async function reviewHasil(
  token: string,
  input: {
    workOrderId: string;
    disetujui: boolean;
    catatan?: string;
  }
) {
  return teknisiGql(
    `mutation ReviewHasil($input: ReviewHasilInput!) {
      reviewHasil(input: $input) {
        success message
        workOrder { id status catatanReview updatedAt }
      }
    }`,
    { input },
    { token, signaturePayload: input }
  );
}

export async function batalkanWorkOrder(
  token: string,
  id: string,
  catatan?: string
) {
  const signaturePayload: Record<string, unknown> = { id };
  if (catatan) signaturePayload.catatan = catatan;

  return teknisiGql(
    `mutation BatalkanWorkOrder($id: ID!, $catatan: String) {
      batalkanWorkOrder(id: $id, catatan: $catatan) { success message }
    }`,
    { id, catatan },
    { token, signaturePayload }
  );
}
