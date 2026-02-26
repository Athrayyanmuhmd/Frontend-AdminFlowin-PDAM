import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import AdminProvider from './layouts/AdminProvider';
import NextTopLoader from 'nextjs-toploader';

export const metadata: Metadata = {
  title: 'Flowin Admin Panel - PDAM Tirta Daroy',
  description:
    'Panel Administrasi Manajemen Air Flowin untuk 14.000 pengguna PDAM Tirta Daroy Banda Aceh',
  icons: {
    icon: '/assets/logo/Aqualink_2.png',
    shortcut: '/assets/logo/Aqualink_2.png',
    apple: '/assets/logo/Aqualink_2.png',
    other: {
      rel: 'apple-touch-icon-precomposed',
      url: '/assets/logo/Aqualink_2.png',
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='id' suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <NextTopLoader
          color='#1976d2'
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing='ease'
          speed={200}
          shadow='0 0 10px #1976d2,0 0 5px #1976d2'
        />
        <AdminProvider>{children}</AdminProvider>
      </body>
    </html>
  );
}
