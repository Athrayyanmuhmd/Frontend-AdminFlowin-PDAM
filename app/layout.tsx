import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import AdminProvider from './layouts/AdminProvider';
import NextTopLoader from 'nextjs-toploader';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
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
