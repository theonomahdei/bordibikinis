'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function SuccessContent() {
  const params = useSearchParams();
  const orderId = params.get('order');
  const ref = params.get('ref');
  const method = params.get('method'); // 'cod' or absent (paystack)

  const [verifying, setVerifying] = useState(!!ref);
  const [paystackStatus, setPaystackStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!ref) return;
    (async () => {
      try {
        const res = await fetch('/api/paystack/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference: ref }),
        });
        const body = await res.json();
        setPaystackStatus(body?.status ?? 'unknown');
      } catch {
        setPaystackStatus('unknown');
      } finally {
        setVerifying(false);
      }
    })();
  }, [ref]);

  const isCod = method === 'cod';
  const isPaid = paystackStatus === 'success';

  return (
    <div className="mx-auto max-w-xl px-6 py-28 text-center">
      {verifying ? (
        <>
          <h1 className="h-display text-4xl rise pulse-fade">Verifying payment…</h1>
          <p className="mt-4 text-sm text-ink/70">Just a moment.</p>
        </>
      ) : isCod ? (
        <>
          <h1 className="h-display text-4xl rise">Order received</h1>
          <p className="mt-4 text-sm text-ink/70 rise rise-1">
            Thank you! We&apos;ll message you on WhatsApp shortly to arrange payment and delivery.
          </p>
          {orderId && (
            <p className="mt-3 text-xs text-stone rise rise-2">
              Reference: <span className="font-mono">{orderId.slice(0, 8)}</span>
            </p>
          )}
        </>
      ) : isPaid ? (
        <>
          <h1 className="h-display text-4xl rise">Payment confirmed</h1>
          <p className="mt-4 text-sm text-ink/70 rise rise-1">
            Your order is being prepared for delivery. You&apos;ll get an update as soon as it ships.
          </p>
          {orderId && (
            <p className="mt-3 text-xs text-stone rise rise-2">
              Reference: <span className="font-mono">{orderId.slice(0, 8)}</span>
            </p>
          )}
        </>
      ) : (
        <>
          <h1 className="h-display text-4xl rise">Payment status pending</h1>
          <p className="mt-4 text-sm text-ink/70 rise rise-1">
            We couldn&apos;t verify your payment right now. If your money was debited, don&apos;t worry —
            it will reflect within a few minutes. Otherwise, please try again.
          </p>
        </>
      )}

      <div className="mt-10 rise rise-3 space-x-3">
        <Link href="/shop" className="btn btn-dark">Keep shopping</Link>
        <Link href="/account" className="btn btn-light">View my orders</Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <SuccessContent />
    </Suspense>
  );
}
