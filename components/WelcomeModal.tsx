'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';

const KEY = 'bikini.welcome.seen.v1';

type Mode = 'welcome' | 'signin' | 'signup';

export default function WelcomeModal() {
  const { user, signInEmail, signUpEmail } = useStore();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('welcome');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Show once, only if the user isn't already signed in
    try {
      const seen = window.localStorage.getItem(KEY);
      if (!seen && !user) {
        const t = setTimeout(() => setOpen(true), 1200);
        return () => clearTimeout(t);
      }
    } catch { /* ignore */ }
  }, [user]);

  const dismiss = () => {
    try { window.localStorage.setItem(KEY, '1'); } catch { /* ignore */ }
    setOpen(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const fn = mode === 'signin' ? signInEmail : signUpEmail;
    const { error: err } = await fn(email.trim(), pass);
    setBusy(false);
    if (err) { setError(err); return; }
    try { window.localStorage.setItem(KEY, '1'); } catch { /* ignore */ }
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/60 px-4 fade-in">
      <div className="relative w-full max-w-md bg-paper p-8 md:p-10 rise">
        {/* Close */}
        <button
          onClick={dismiss}
          aria-label="Close"
          className="absolute top-4 right-4 text-ink/50 hover:text-ink p-1"
        >
          <svg width="14" height="14" viewBox="0 0 14 14">
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>

        {mode === 'welcome' && (
          <>
            <p className="text-xs uppercase tracking-widest2 font-display text-stone text-center">
              Akwaaba
            </p>
            <h2 className="h-display text-3xl md:text-4xl text-center mt-2">
              Welcome to BIKINI
            </h2>
            <p className="text-sm text-ink/70 text-center mt-4">
              Sign in to track your orders and save your details for faster checkout —
              or keep browsing as a guest, no pressure.
            </p>

            <div className="mt-8 space-y-3">
              <button
                className="btn btn-dark w-full"
                onClick={() => { setMode('signup'); setError(null); }}
              >
                Create an account
              </button>
              <button
                className="btn btn-light w-full"
                onClick={() => { setMode('signin'); setError(null); }}
              >
                Sign in
              </button>
              <button
                onClick={dismiss}
                className="w-full text-center text-sm text-stone underline underline-offset-2 hover:text-ink pt-2"
              >
                Continue as guest
              </button>
            </div>
          </>
        )}

        {(mode === 'signin' || mode === 'signup') && (
          <>
            <p className="text-xs uppercase tracking-widest2 font-display text-stone text-center">
              {mode === 'signin' ? 'Welcome back' : 'Create account'}
            </p>
            <h2 className="h-display text-3xl text-center mt-2">
              {mode === 'signin' ? 'Sign in' : 'Get started'}
            </h2>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <label className="label" htmlFor="wm-email">Email</label>
                <input id="wm-email" className="input" type="email" required
                  value={email} onChange={e => setEmail(e.target.value)} autoFocus />
              </div>
              <div>
                <label className="label" htmlFor="wm-pass">Password</label>
                <input id="wm-pass" className="input" type="password" required minLength={6}
                  value={pass} onChange={e => setPass(e.target.value)} />
              </div>

              {error && <p className="text-sm text-error">{error}</p>}

              <button className="btn btn-dark w-full" type="submit" disabled={busy}>
                {busy ? '…' : (mode === 'signin' ? 'Sign in' : 'Create account')}
              </button>

              <div className="flex items-center justify-between text-xs pt-2">
                <button
                  type="button"
                  className="underline underline-offset-2 text-stone hover:text-ink"
                  onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); }}
                >
                  {mode === 'signin' ? 'New here? Create an account' : 'Already have one? Sign in'}
                </button>
                <button
                  type="button"
                  className="underline underline-offset-2 text-stone hover:text-ink"
                  onClick={() => { setMode('welcome'); setError(null); }}
                >
                  Back
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
