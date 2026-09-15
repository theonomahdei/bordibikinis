'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const CARE = [
  { label: 'Contact Us', href: 'https://wa.me/233538144603' },
  { label: 'Delivery', href: '/shop' },
  { label: 'Size Guide', href: '/shop' },
  { label: 'Returns', href: '/shop' },
];

const BRAND = [
  { label: 'Shop All', href: '/shop' },
  { label: 'New Arrivals', href: '/shop?cat=new-arrivals' },
  { label: 'Best Sellers', href: '/shop?cat=best-sellers' },
  { label: 'Admin', href: '/admin' },
];

export default function Footer() {
  const pathname = usePathname();
  const [email, setEmail] = useState('');
  const [joined, setJoined] = useState(false);

  if (pathname.startsWith('/admin')) return null;
  if (pathname.startsWith('/account')) return null;

  return (
    <footer className="border-t border-smoke bg-paper mt-24">
      <div className="mx-auto max-w-6xl px-6 py-16 grid gap-12 md:grid-cols-4">
        <div>
          <p className="font-display uppercase tracking-widest2 text-sm mb-4">Customer Care</p>
          <ul className="space-y-2">
            {CARE.map(x => (
              <li key={x.label}>
                <Link href={x.href} className="text-sm text-ink/60 hover:text-ink transition-colors">
                  {x.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-display uppercase tracking-widest2 text-sm mb-4">Brand</p>
          <ul className="space-y-2">
            {BRAND.map(x => (
              <li key={x.label}>
                <Link href={x.href} className="text-sm text-ink/60 hover:text-ink transition-colors">
                  {x.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-display uppercase tracking-widest2 text-sm mb-4">Social</p>
          <ul className="space-y-2 text-sm text-ink/60">
            <li><a className="hover:text-ink transition-colors" href="#">Instagram</a></li>
            <li><a className="hover:text-ink transition-colors" href="#">TikTok</a></li>
            <li>
              <a className="hover:text-ink transition-colors" href="https://wa.me/233538144603">
                WhatsApp — 053 814 4603
              </a>
            </li>
          </ul>
        </div>

        <div>
          <p className="font-display uppercase tracking-widest2 text-sm mb-4">Stay in the sun</p>
          {joined ? (
            <p className="text-sm text-ink/70">You&apos;re on the list. Akwaaba.</p>
          ) : (
            <form
              onSubmit={e => { e.preventDefault(); if (email.includes('@')) setJoined(true); }}
              className="flex gap-2"
            >
              <input
                className="input"
                type="email"
                required
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <button className="btn btn-dark !min-w-0 !px-6 !h-10" type="submit">Join</button>
            </form>
          )}
          <p className="mt-4 text-xs text-stone">
            New drops, restocks and Accra pop-ups — straight to your inbox.
          </p>
        </div>
      </div>

      <div className="border-t border-smoke py-6 text-center text-xs text-stone">
        © {new Date().getFullYear()} SWIMZY · Accra, Ghana · All prices in Ghana Cedis (GH₵)
      </div>
    </footer>
  );
}
