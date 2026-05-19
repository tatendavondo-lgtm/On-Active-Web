import type { Metadata } from 'next';
// import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

// const geistSans = Geist({
//   variable: '--font-geist-sans',
//   subsets: ['latin'],
// });

// const geistMono = Geist_Mono({
//   variable: '--font-geist-mono',
//   subsets: ['latin'],
// });

export const metadata: Metadata = {
  title: 'On Active Wear | Premium Fitness Apparel',
  description: 'Own It, Wear It, Feel It. High-performance fitness apparel for the active mind.',
  manifest: '/manifest.json',
  icons: {
    icon: '/images/logo.jpg',
    apple: '/images/logo.jpg',
  },
};

import { Preloader } from '@/components/preloader';

// Root layout: bare HTML shell only.
// - Storefront providers (CartProvider, Preloader, CustomCursor) -> src/app/(store)/layout.tsx
// - Admin shell -> src/app/admin/(hub)/layout.tsx
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col font-sans">
        <Preloader />
        {children}
      </body>
    </html>
  );
}




