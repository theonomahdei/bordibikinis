'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';

export default function AccountMenu({ tone = 'ink' }: { tone?: 'ink' | 'paper' }) {
  const { user, signOut } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const initial = user?.email?.[0]?.toUpperCase() ?? '';
  const toneClass = tone === 'paper' ? 'text-paper' : 'text-ink';

  // Logged out — just a link
  if (!user) {
    return (
      <Link
        href="/account"
        className={`hidden sm:flex items-center gap-2 font-display uppercase tracking-widest2 text-[13px] hover:opacity-60 transition-opacity ${toneClass}`}
      >
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="10" cy="7" r="3.2" stroke="currentColor" strokeWidth="1.2" />
          <path d="M3.5 17c1-3.2 3.5-5 6.5-5s5.5 1.8 6.5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        <span>Log in / Sign up</span>
      </Link>
    );
  }

  // Logged in — icon + dropdown
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Account menu"
        aria-expanded={open}
        className={`flex items-center gap-2 hover:opacity-60 transition-opacity ${toneClass}`}
      >
        <span className={`h-8 w-8 rounded-full flex items-center justify-center font-display text-xs ${
          tone === 'paper' ? 'bg-paper text-ink' : 'bg-ink text-paper'
        }`}>
          {initial}
        </span>
        <span className="hidden md:inline font-display uppercase tracking-widest2 text-[13px]">
          Account
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-paper border border-smoke shadow-lg z-50 fade-in">
          <div className="px-4 py-3 border-b border-smoke">
            <p className="text-[11px] uppercase tracking-widest2 font-display text-stone">Signed in</p>
            <p className="text-sm truncate text-ink">{user.email}</p>
          </div>
          <Link
            href="/account"
            onClick={() => setOpen(false)}
            className="block px-4 py-3 text-sm text-ink hover:bg-offwhite border-b border-smoke/60"
          >
            My account &amp; orders
          </Link>
          {user.isAdmin && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="block px-4 py-3 text-sm text-ink hover:bg-offwhite border-b border-smoke/60"
            >
              Admin dashboard
            </Link>
          )}
          <button
            onClick={async () => { await signOut(); setOpen(false); }}
            className="block w-full text-left px-4 py-3 text-sm text-ink hover:bg-offwhite"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
