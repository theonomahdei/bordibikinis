import type { Metadata } from 'next';
import './globals.css';
import { StoreProvider } from '@/lib/store';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import WhatsAppButton from '@/components/WhatsAppButton';

export const metadata: Metadata = {
  title: 'BIKINI — Swimwear, Made in Ghana',
  description:
    'Bold colour, clean lines, signature fits. Bikinis and swimwear designed for the Ghanaian sun — delivered anywhere in Ghana.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Brand fonts: Bebas Neue (display) + Archivo Narrow (body).
            Loaded as a stylesheet so builds never depend on network;
            can be swapped to next/font/google for self-hosting later. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Archivo+Narrow:wght@400;500;600&display=block"
          rel="stylesheet"
        />
      </head>
      <body>
        <StoreProvider>
          <Header />
          <main className="min-h-screen">{children}</main>
          <Footer />
          <CartDrawer />
          <WhatsAppButton />
        </StoreProvider>
      </body>
    </html>
  );
}
