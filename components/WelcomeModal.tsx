'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';

const KEY = 'bikini.welcome.seen.v1';

// Soft first-visit prompt. Routes to /account for the actual auth flow,
// so there's one source of truth for sign-in and register.
export default function WelcomeModal() {
  const { user, ready } = useStore();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!ready) return;
    try {
      const seen = window.localStorage.getItem(KEY);
      if (!seen && !user) {
        const t = setTimeout(() => setOpen(true), 1400);
        return () => clearTimeout(t);
      }
    } catch { /* ignore */ }
  }, [user, ready]);

  const dismiss = () => {
    try { window.localStorage.setItem(KEY, '1'); } catch { /* ignore */ }
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/60 px-4 fade-in">
      <div className="relative w-full max-w-md bg-paper p-8 md:p-10 rise">
        <button
          onClick={dismiss}
          aria-label="Close"
          className="absolute top-4 right-4 text-ink/50 hover:text-ink p-1"
        >
          <svg width="14" height="14" viewBox="0 0 14 14">
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>

        <p className="text-xs uppercase tracking-widest2 font-display text-stone text-center">
          Akwaaba
        </p>
        <h2 className="h-display text-3xl md:text-4xl text-center mt-2">
          Welcome to SWIMZY
        </h2>
        <p className="text-sm text-ink/70 text-center mt-4">
          Create an account to track orders and save your details for faster checkout —
          or keep browsing as a guest, no pressure.
        </p>

        <div className="mt-8 space-y-3">
          <Link
            href="/account"
            onClick={dismiss}
            className="btn btn-dark w-full"
          >
            Log in or register
          </Link>
          <button
            onClick={dismiss}
            className="w-full text-center text-sm text-stone underline underline-offset-2 hover:text-ink pt-2"
          >
            Continue as guest
          </button>
        </div>
      </div>
    </div>
  );
}
