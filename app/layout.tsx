import type { Metadata } from 'next';
import './globals.css';
import AdminProvider from './layouts/AdminProvider';
import NextTopLoader from 'nextjs-toploader';

export const metadata: Metadata = {
  title: 'Flowin Admin Panel - PDAM Tirta Daroy',
  description:
    'Panel Administrasi Manajemen Air Flowin untuk 14.000 pengguna PDAM Tirta Daroy Banda Aceh',
  icons: {
    // icon & shortcut sengaja dihapus dari metadata — diganti link data URL di <head>
    // di bawah agar browser tidak membuat HTTP request ke /favicon.ico sama sekali.
    apple: '/assets/logo/Aqualink_2.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='id' suppressHydrationWarning>
      <head>
        {/* Favicon inline sebagai data URL — browser baca dari HTML, tidak ada HTTP request.
            Ikon tetesan air biru (#013494) sesuai brand Aqualink. */}
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><path fill='%23013494' d='M16 2C10 10 6 15 6 20a10 10 0 0020 0c0-5-4-10-10-18z'/></svg>" />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <NextTopLoader
          color='#013494'
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing='ease'
          speed={200}
          shadow='0 0 10px #013494,0 0 5px #013494'
        />
        <AdminProvider>{children}</AdminProvider>
      </body>
    </html>
  );
}
