'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useStore, formatGhs } from '@/lib/store';
import Img from '@/components/Img';

const REGIONS = [
  'Greater Accra', 'Ashanti', 'Central', 'Eastern', 'Western', 'Volta',
  'Northern', 'Bono', 'Upper East', 'Upper West', 'Other',
];

const DELIVERY: Record<string, number> = { 'Greater Accra': 30 };
const DEFAULT_DELIVERY = 60;

export default function CheckoutPage() {
  const { cart, products, cartTotal, clearCart, createOrder, user } = useStore();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: user?.email ?? '',
    region: 'Greater Accra',
    address: '',
  });
  const [placed, setPlaced] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const delivery = cart.length === 0 ? 0 : (DELIVERY[form.region] ?? DEFAULT_DELIVERY);
  const total = cartTotal + delivery;

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const orderId = await createOrder({
        customerName: form.name,
        customerPhone: form.phone,
        customerEmail: form.email,
        region: form.region,
        deliveryAddress: form.address,
        subtotalGhs: cartTotal,
        deliveryGhs: delivery,
        totalGhs: total,
        notes: '',
        items: cart.map(item => {
          const p = products.find(x => x.id === item.productId)!;
          return {
            productId: p.id,
            productName: p.name,
            productImage: p.images[0] ?? '',
            colorName: p.colorName,
            topSize: item.topSize,
            bottomSize: item.bottomSize,
            quantity: item.quantity,
            unitPriceGhs: p.priceGhs,
          };
        }),
      });
      clearCart();
      setPlaced(orderId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not place the order. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (placed) {
    return (
      <div className="mx-auto max-w-xl px-6 py-28 text-center">
        <h1 className="h-display text-4xl rise">Order received</h1>
        <p className="mt-4 text-sm text-ink/70 rise rise-1">
          Thank you — we&apos;ve got your order. Reference: <span className="font-mono text-xs">{placed.slice(0, 8)}</span>.
          We&apos;ll message you on WhatsApp shortly to confirm payment and delivery.
        </p>
        <p className="mt-2 text-xs text-stone rise rise-2">
          Payment via Paystack (card + mobile money) is coming in the next phase.
        </p>
        <Link href="/shop" className="btn btn-dark mt-10 rise rise-3">Keep shopping</Link>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-6 py-28 text-center">
        <h1 className="h-display text-4xl">Your bag is empty</h1>
        <Link href="/shop" className="btn btn-dark mt-10">Shop the collection</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 md:px-8 pb-8">
      <h1 className="h-display text-4xl py-10 text-center rise">Checkout</h1>

      <div className="grid gap-12 lg:grid-cols-[1fr_24rem]">
        <form className="space-y-6 rise rise-1" onSubmit={submit}>
          {!user && (
            <div className="bg-offwhite/70 border border-smoke px-4 py-3 flex items-center gap-3 text-sm">
              <span className="flex-1">Have an account? Log in to save these details.</span>
              <Link href="/account?next=/checkout" className="font-display uppercase tracking-widest2 text-xs underline underline-offset-2 hover:opacity-70">
                Log in
              </Link>
            </div>
          )}
          <p className="font-display uppercase tracking-widest2 text-sm border-b border-smoke pb-3">
            Delivery details
          </p>

          <div>
            <label className="label" htmlFor="name">Full name</label>
            <input id="name" className="input" required value={form.name} onChange={set('name')} />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="phone">Phone (MoMo-linked preferred)</label>
              <input id="phone" className="input" required type="tel" placeholder="0XX XXX XXXX"
                value={form.phone} onChange={set('phone')} />
            </div>
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" className="input" required type="email"
                value={form.email} onChange={set('email')} />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="region">Region</label>
              <select id="region" className="input bg-paper" value={form.region} onChange={set('region')}>
                {REGIONS.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="address">Delivery address / landmark</label>
              <input id="address" className="input" required placeholder="Area, street, GhanaPost GPS…"
                value={form.address} onChange={set('address')} />
            </div>
          </div>

          {error && <p className="text-sm text-error">{error}</p>}

          <button type="submit" className="btn btn-dark w-full !h-14" disabled={busy}>
            {busy ? 'Placing order…' : `Place order — ${formatGhs(total)}`}
          </button>
          <p className="text-xs text-stone text-center">
            Payment by card or mobile money will be added with Paystack in the next phase.
          </p>
        </form>

        <aside className="h-max border border-smoke p-6 space-y-5 rise rise-2">
          <p className="font-display uppercase tracking-widest2 text-sm border-b border-smoke pb-3">
            Order summary
          </p>
          {cart.map((item, i) => {
            const p = products.find(x => x.id === item.productId);
            if (!p) return null;
            return (
              <div key={i} className="flex gap-3 text-sm">
                <div className="w-14 shrink-0 aspect-[3/4] overflow-hidden bg-offwhite">
                  <Img src={p.images[0] ?? ''} alt={p.name} className="h-full w-full object-cover"
                    fallbackHex={p.colorHex} fallbackLabel="" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display uppercase tracking-loose truncate">{p.name}</p>
                  <p className="text-xs text-ink/60">
                    Top {item.topSize} · Bottom {item.bottomSize} · Qty {item.quantity}
                  </p>
                </div>
                <p>{formatGhs(p.priceGhs * item.quantity)}</p>
              </div>
            );
          })}
          <div className="border-t border-smoke pt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatGhs(cartTotal)}</span></div>
            <div className="flex justify-between text-ink/60">
              <span>Delivery — {form.region}</span><span>{formatGhs(delivery)}</span>
            </div>
            <div className="flex justify-between font-display text-lg pt-2">
              <span>Total</span><span>{formatGhs(total)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
