'use client';

import { usePathname } from 'next/navigation';

// Support number — change here when the business number changes.
const WHATSAPP_NUMBER = '233538144603';

export default function WhatsAppButton() {
  const pathname = usePathname();
  if (pathname.startsWith('/admin')) return null;

  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi BIKINI! I have a question about an order.')}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-ink text-paper
        px-5 h-12 font-display uppercase tracking-widest2 text-xs
        hover:bg-paper hover:text-ink border border-ink transition-colors"
    >
      Chat now
    </a>
  );
}
