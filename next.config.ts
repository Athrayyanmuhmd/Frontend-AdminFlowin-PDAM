import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'pdam-tirtadaroy.ac.id' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  async redirects() {
    return [
      // Edge-level redirect: GET / → /auth/login tanpa spin up serverless function.
      // Sebelumnya app/page.tsx pakai redirect() yang menjalankan serverless function
      // setiap GET / → salah satu pemicu DDoS mitigation karena setiap hard reload
      // browser meminta / sebelum diarahkan ke halaman tujuan.
      {
        source: '/',
        destination: '/auth/login',
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      // Cache favicon 24 jam di browser. Tanpa ini, browser meminta /favicon.ico
      // pada setiap hard page load — 10 dari 24 denied di Vercel Firewall log
      // adalah favicon request dari IP yang sama dalam satu jam.
      {
        source: '/favicon.ico',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: process.env.NEXT_PUBLIC_BASE_URL?.replace('/api', '') || 'http://localhost:5000' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },
};

export default nextConfig;
