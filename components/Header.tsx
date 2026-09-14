'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/lib/store';

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

  if (pathname.startsWith('/admin')) return null;

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

        <div className={`grid grid-cols-3 items-center px-4 md:px-10 h-16 ${tone}`}>
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
            aria-label="BIKINI — home"
            className="justify-self-center font-display text-[2rem] leading-none tracking-[0.14em] select-none"
          >
            Swimzy
          </Link>

          {/* Right: shop + cart */}
          <div className="justify-self-end flex items-center gap-6">
            <Link
              href="/shop"
              className="hidden sm:block font-display uppercase tracking-widest2 text-[13px] hover:opacity-60 transition-opacity"
            >
              Shop All
            </Link>
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

        {/* Mobile nav */}
        {menuOpen && (
          <nav className="lg:hidden bg-paper border-t border-smoke fade-in">
            {NAV.concat({ label: 'Shop All', href: '/shop' }).map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-6 py-4 font-display uppercase tracking-widest2 text-sm text-ink border-b border-smoke/60"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      {/* Spacer so non-home pages don't slide under the fixed header */}
      {pathname !== '/' && <div className="h-[6.5rem]" />}
    </>
  );
}
