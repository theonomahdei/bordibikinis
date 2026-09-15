'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore, formatGhs } from '@/lib/store';
import type { Order, OrderStatus } from '@/lib/types';
import Img from '@/components/Img';

// ── EDIT ME (once your images are uploaded) ────────────────────
// Split-screen background image on the login/register page.
// Same image as the homepage hero, per the design decision.
const AUTH_IMAGE =
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=85&w=1600&auto=format&fit=crop';

// The round SWIMZY brand logo shown top-left of the auth form.
// Leave empty to render the plain "SWIMZY" wordmark instead.
const BRAND_LOGO = 'https://uxtkieoopckjqvgoiboa.supabase.co/storage/v1/object/public/products/swimzy%20backgroundless.png';

function AccountContent() {
  const { user, ready } = useStore();
  const router = useRouter();
  const params = useSearchParams();
  const nextPath = params.get('next');

  useEffect(() => {
    if (!ready || !user) return;
    // Admin users go straight to the admin dashboard — no need to see the
    // customer profile page. Guest-to-admin still works via the /admin route.
    if (user.isAdmin) {
      router.replace('/admin');
      return;
    }
    if (nextPath) router.replace(nextPath);
  }, [ready, user, nextPath, router]);

  if (!ready) return <div className="min-h-screen bg-paper" />;
  // Admin users flash the profile screen for a split second before redirect —
  // return null instead of ProfilePane while the redirect is in flight.
  if (user?.isAdmin) return <div className="min-h-screen bg-paper" />;

  return user ? <ProfilePane /> : <AuthPane />;
}

/* ── AUTH PANE (logged out) ─────────────────────────────── */
function AuthPane() {
  const { signInEmail, signUpEmail } = useStore();
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setNotice(null);
    if (tab === 'signup' && pass !== confirm) {
      setError('Passwords do not match.'); return;
    }
    setBusy(true);
    const fn = tab === 'signin' ? signInEmail : signUpEmail;
    const { error: err } = await fn(email.trim(), pass);
    setBusy(false);
    if (err) { setError(err); return; }
    if (tab === 'signup') setNotice('Account created. You are signed in.');
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-paper">
      <div className="flex items-start justify-center px-6 md:px-16 py-16 lg:py-24">
        <div className="w-full max-w-md">
          <div className="mb-14 -ml-3 md:-ml-4">
            {BRAND_LOGO ? (
              <img src={BRAND_LOGO} alt="SWIMZY"
                className="h-auto w-[15rem] md:w-[18rem] object-contain" />
            ) : (
              <p className="font-display text-4xl tracking-[0.18em] leading-none">SWIMZY</p>
            )}
          </div>

          <div className="flex gap-8 border-b border-smoke mb-10">
            {(['signin', 'signup'] as const).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(null); setNotice(null); }}
                className={`pb-3 -mb-px font-display uppercase tracking-widest2 text-[13px] border-b-2 transition-colors ${
                  tab === t ? 'border-ink text-ink' : 'border-transparent text-stone hover:text-ink'
                }`}
              >
                {t === 'signin' ? 'Log in' : 'Register'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-6 rise">
            <div>
              <label className="label" htmlFor="ae">Email</label>
              <input id="ae" className="input" type="email" required autoFocus
                value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="ap">Password</label>
              <div className="relative">
                <input id="ap" className="input pr-16" type={showPass ? 'text' : 'password'} required minLength={6}
                  value={pass} onChange={e => setPass(e.target.value)} />
                <button type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-[11px] font-display uppercase tracking-widest2 text-stone hover:text-ink px-2"
                  aria-label={showPass ? 'Hide password' : 'Show password'}>
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
              {tab === 'signup' && (
                <p className="text-xs text-stone mt-1">At least 6 characters.</p>
              )}
            </div>
            {tab === 'signup' && (
              <div>
                <label className="label" htmlFor="ac">Confirm password</label>
                <input id="ac" className="input" type={showPass ? 'text' : 'password'} required minLength={6}
                  value={confirm} onChange={e => setConfirm(e.target.value)} />
              </div>
            )}

            {error && <p className="text-error text-sm">{error}</p>}
            {notice && <p className="text-sm text-ink/70">{notice}</p>}

            <button className="btn btn-dark w-full !h-12" type="submit" disabled={busy}>
              {busy ? '...' : (tab === 'signin' ? 'Log in' : 'Create account')}
            </button>

            {tab === 'signin' ? (
              <p className="text-xs text-center text-stone">
                New to SWIMZY?{' '}
                <button type="button" className="underline underline-offset-2 text-ink hover:opacity-70"
                  onClick={() => { setTab('signup'); setError(null); setNotice(null); }}>
                  Create an account
                </button>
              </p>
            ) : (
              <p className="text-xs text-center text-stone">
                Already have an account?{' '}
                <button type="button" className="underline underline-offset-2 text-ink hover:opacity-70"
                  onClick={() => { setTab('signin'); setError(null); setNotice(null); }}>
                  Log in
                </button>
              </p>
            )}
          </form>

          <p className="text-[11px] text-stone mt-10 leading-relaxed">
            By continuing, you agree to receive order updates and occasional messages
            from SWIMZY. You can unsubscribe anytime. We do not share your details.
          </p>

          <Link href="/" className="block text-center text-xs text-stone mt-8 underline underline-offset-2">
            Back to store
          </Link>
        </div>
      </div>

      <div className="hidden lg:block relative overflow-hidden bg-offwhite">
        <Img src={AUTH_IMAGE} alt=""
          className="absolute inset-0 h-full w-full object-cover"
          fallbackHex="#EFE7DC" eager />
      </div>
    </div>
  );
}

/* ── PROFILE PANE (logged in) ───────────────────────────── */
function ProfilePane() {
  const { user, signOut, fetchMyOrders } = useStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setOrders(await fetchMyOrders());
      setLoading(false);
    })();
  }, [fetchMyOrders]);

  const initial = user?.email?.[0]?.toUpperCase() ?? '?';

  const badge = (s: OrderStatus) => {
    const map: Record<OrderStatus, string> = {
      pending_payment: 'bg-blush/60 text-ink',
      pending: 'bg-blush text-ink',
      confirmed: 'bg-sand text-ink',
      shipped: 'bg-smoke text-ink',
      delivered: 'bg-ink text-paper',
      cancelled: 'bg-error/20 text-error',
    };
    return map[s];
  };

  return (
    <div className="mx-auto max-w-4xl px-4 md:px-8 py-16">
      <div className="flex items-center gap-5 pb-8 border-b border-smoke">
        <div className="h-14 w-14 rounded-full bg-ink text-paper flex items-center justify-center font-display text-lg">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display uppercase tracking-widest2 text-sm text-stone">My account</p>
          <p className="text-lg truncate">{user?.email}</p>
        </div>
        <button onClick={signOut} className="text-sm underline underline-offset-2 hover:opacity-70">
          Log out
        </button>
      </div>

      <div className="mt-10">
        <h2 className="h-display text-2xl mb-6">Orders</h2>

        {loading ? (
          <p className="text-stone">Loading...</p>
        ) : orders.length === 0 ? (
          <div className="py-10 text-center border border-smoke bg-offwhite/40">
            <p className="text-sm text-stone">You have not placed any orders yet.</p>
            <Link href="/shop" className="btn btn-dark mt-4">Start shopping</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(o => (
              <div key={o.id} className="border border-smoke bg-paper p-5 space-y-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <p className="font-display uppercase tracking-widest2 text-sm">
                      Order #{o.id.slice(0, 8)}
                    </p>
                    <p className="text-xs text-stone">
                      {new Date(o.createdAt).toLocaleDateString('en-GH', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-[10px] font-display uppercase tracking-widest2 ${badge(o.status)}`}>
                    {o.status}
                  </span>
                  <span className="font-display text-lg">{formatGhs(o.totalGhs)}</span>
                </div>

                <div className="space-y-2 border-t border-smoke pt-4">
                  {o.items.map((it, i) => (
                    <div key={i} className="flex gap-3 text-sm">
                      <div className="w-14 shrink-0 aspect-[3/4] overflow-hidden bg-offwhite">
                        <Img src={it.productImage} alt={it.productName}
                          className="h-full w-full object-cover" fallbackLabel="" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display uppercase tracking-loose truncate">{it.productName}</p>
                        <p className="text-xs text-stone">
                          {it.colorName} - Top {it.topSize} - Bottom {it.bottomSize} - Qty {it.quantity}
                        </p>
                      </div>
                      <p>{formatGhs(it.unitPriceGhs * it.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense>
      <AccountContent />
    </Suspense>
  );
}
