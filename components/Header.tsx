'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/lib/store';
import AccountMenu from './AccountMenu';

const NAV = [
  { label: 'New Arrivals', href: '/shop?cat=new-arrivals' },
  { label: 'Best Sellers', href: '/shop?cat=best-sellers' },
  { label: 'Bikinis', href: '/shop?cat=bikinis' },
  { label: 'Swimwear', href: '/shop?cat=swimwear' },
];

export default function Header() {
  const { cartCount, setCartOpen } = useStore();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const lastY = useRef(0);

  // Transparent over the home hero; solid everywhere else.
  const overHero = pathname === '/' && !scrolled;

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      // Hide on scroll down, reveal on scroll up (Triangl-style behavior)
      setHidden(y > 160 && y > lastY.current);
      lastY.current = y;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  // Lock body scroll while the mobile drawer is open, so the underlying
  // page doesn't slide behind it. Restore original overflow on close.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = menuOpen ? 'hidden' : prev;
    return () => { document.body.style.overflow = prev; };
  }, [menuOpen]);

  if (pathname.startsWith('/admin')) return null;
  // Also hide chrome on /account so the auth split-screen is uninterrupted.
  // The account page has its own "Back to store" link.
  if (pathname.startsWith('/account')) return null;

  const tone = overHero ? 'text-paper' : 'text-ink';

  return (
    <>
      <header
        className={[
          'fixed inset-x-0 top-0 z-50 transition-all duration-300',
          hidden ? '-translate-y-full' : 'translate-y-0',
          overHero
            ? 'bg-gradient-to-b from-ink/40 to-transparent'
            : 'bg-paper/95 backdrop-blur border-b border-smoke',
        ].join(' ')}
      >
        {/* Announcement bar */}
        <div className="bg-ink text-paper text-center font-display uppercase tracking-widest2 text-[11px] py-2 px-4">
          Free delivery in Accra on orders over GH₵ 500 · Nationwide delivery across Ghana
        </div>

        <div className={`grid grid-cols-3 items-center px-4 md:px-10 h-20 ${tone}`}>
          {/* Left: nav (desktop) / burger (mobile) */}
          <div className="flex items-center gap-7">
            <button
              className="lg:hidden p-1"
              aria-label="Menu"
              onClick={() => setMenuOpen(v => !v)}
            >
              <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
                <path d="M0 1h20M0 7h20M0 13h20" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            </button>
            <nav className="hidden lg:flex items-center gap-7">
              {NAV.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="font-display uppercase tracking-widest2 text-[13px] hover:opacity-60 transition-opacity"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Center: wordmark */}
          <Link
            href="/"
            aria-label="SWIMZY — home"
            className="justify-self-center flex items-center h-14 select-none"
          >
            <img
              src="https://uxtkieoopckjqvgoiboa.supabase.co/storage/v1/object/public/products/swimzy%20backgroundless.png"
              alt="SWIMZY"
              className="h-full w-auto object-contain"
              style={{ filter: overHero ? 'brightness(0) invert(1)' : 'none' }}
            />
          </Link>

          {/* Right: shop + account + cart */}
          <div className="justify-self-end flex items-center gap-5 md:gap-6">
            <Link
              href="/shop"
              className="hidden sm:block font-display uppercase tracking-widest2 text-[13px] hover:opacity-60 transition-opacity"
            >
              Shop All
            </Link>
            <AccountMenu tone={overHero ? 'paper' : 'ink'} />
            <button
              onClick={() => setCartOpen(true)}
              className="relative flex items-center gap-2"
              aria-label="Open cart"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="2.5" y="6.5" width="15" height="11" stroke="currentColor" />
                <path d="M6.5 6.5a3.5 3.5 0 017 0" stroke="currentColor" />
              </svg>
              <span className="font-display text-sm">{cartCount}</span>
            </button>
          </div>
        </div>

      </header>

      {/* ── Mobile menu drawer (LV-style) ──
          Slides in from the left. Backdrop dims + blurs the page.
          Body scroll is locked while open. Timing tuned for a smooth,
          confident feel ~900ms with a soft cubic-bezier ease. */}
      <div
        className={`fixed inset-0 z-[65] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          menuOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        aria-hidden={!menuOpen}
      >
        {/* Backdrop */}
        <div
          onClick={() => setMenuOpen(false)}
          className={`absolute inset-0 bg-ink/45 backdrop-blur-sm transition-opacity duration-700 ${
            menuOpen ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Drawer panel */}
        <nav
          className={`absolute inset-y-0 left-0 w-[85%] max-w-[22rem] bg-paper shadow-2xl
            transform transition-transform duration-[900ms] ease-[cubic-bezier(0.32,0.72,0,1)]
            ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="flex items-center justify-between px-6 h-16 border-b border-smoke">
            <img
              src="https://uxtkieoopckjqvgoiboa.supabase.co/storage/v1/object/public/products/swimzy%20backgroundless.png"
              alt="SWIMZY"
              className="h-8 w-auto object-contain"
            />
            <button
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              className="p-1 -mr-1"
            >
              <svg width="16" height="16" viewBox="0 0 14 14">
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.2" />
              </svg>
            </button>
          </div>

          <div className="px-2 py-4">
            {NAV.concat({ label: 'Shop All', href: '/shop' }).map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="group/link relative block px-4 py-4 font-display uppercase tracking-widest2 text-[15px] text-ink overflow-hidden"
              >
                <span className="relative inline-block">
                  {item.label}
                  {/* Underline sweeps in from the left on hover/focus */}
                  <span className="absolute -bottom-0.5 left-0 h-px w-full bg-ink
                    origin-left scale-x-0 group-hover/link:scale-x-100
                    transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]" />
                </span>
                {/* Arrow slides in from the right on hover */}
                <span className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 -translate-x-2
                  group-hover/link:opacity-100 group-hover/link:translate-x-0
                  transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                  →
                </span>
              </Link>
            ))}
          </div>

          <div className="border-t border-smoke mx-2 mt-2 pt-4 px-2">
            <Link
              href="/account"
              onClick={() => setMenuOpen(false)}
              className="group/link relative block px-4 py-4 font-display uppercase tracking-widest2 text-[15px] text-ink overflow-hidden"
            >
              <span className="relative inline-block">
                Log in / My account
                <span className="absolute -bottom-0.5 left-0 h-px w-full bg-ink
                  origin-left scale-x-0 group-hover/link:scale-x-100
                  transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]" />
              </span>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 -translate-x-2
                group-hover/link:opacity-100 group-hover/link:translate-x-0
                transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                →
              </span>
            </Link>
          </div>

          <div className="absolute inset-x-0 bottom-0 px-6 py-5 border-t border-smoke bg-paper">
            <p className="text-[11px] uppercase tracking-widest2 font-display text-stone">Support</p>
            <a
              href="https://wa.me/233209948631"
              className="text-sm text-ink mt-1 block hover:opacity-70 transition-opacity"
              onClick={() => setMenuOpen(false)}
            >
              WhatsApp — 020 994 8631
            </a>
          </div>
        </nav>
      </div>

      {/* Spacer so non-home pages don't slide under the fixed header */}
      {pathname !== '/' && <div className="h-[7.25rem]" />}
    </>
  );
}
