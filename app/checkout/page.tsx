'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useStore, formatGhs } from '@/lib/store';
import Img from '@/components/Img';

const REGIONS = [
  'Greater Accra', 'Ashanti', 'Central', 'Eastern', 'Western', 'Volta',
  'Northern', 'Bono', 'Upper East', 'Upper West', 'Other',
];

// Flat placeholder rates until the admin Settings screen + Supabase land.
const DELIVERY: Record<string, number> = { 'Greater Accra': 30 };
const DEFAULT_DELIVERY = 60;

export default function CheckoutPage() {
  const { cart, products, cartTotal, clearCart } = useStore();
  const [form, setForm] = useState({ name: '', phone: '', email: '', region: 'Greater Accra', address: '' });
  const [placed, setPlaced] = useState(false);

  const delivery = cart.length === 0 ? 0 : (DELIVERY[form.region] ?? DEFAULT_DELIVERY);
  const total = cartTotal + delivery;

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  if (placed) {
    return (
      <div className="mx-auto max-w-xl px-6 py-28 text-center">
        <h1 className="h-display text-4xl">Order received</h1>
        <p className="mt-4 text-sm text-ink/70">
          Thank you! This is a preview flow — when Paystack is integrated, payment
          (card &amp; mobile money) will happen right here before confirmation.
        </p>
        <Link href="/shop" className="btn btn-dark mt-10">Keep shopping</Link>
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
      <h1 className="h-display text-4xl py-10 text-center">Checkout</h1>

      <div className="grid gap-12 lg:grid-cols-[1fr_24rem]">
        {/* ── Delivery details ── */}
        <form
          className="space-y-6"
          onSubmit={e => {
            e.preventDefault();
            // ═══ PAYSTACK INTEGRATION POINT ═══
            // Next iteration: create order (status PENDING), call Paystack
            // Initialize Transaction, redirect to Paystack, confirm via
            // webhook, then decrement stock. For now we simulate success.
            clearCart();
            setPlaced(true);
          }}
        >
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

          <button type="submit" className="btn btn-dark w-full !h-14">
            Place order — {formatGhs(total)}
          </button>
          <p className="text-xs text-stone text-center">
            Payment by card or mobile money will be added with Paystack in the next phase.
          </p>
        </form>

        {/* ── Summary ── */}
        <aside className="h-max border border-smoke p-6 space-y-5">
          <p className="font-display uppercase tracking-widest2 text-sm border-b border-smoke pb-3">
            Order summary
          </p>
          {cart.map((item, i) => {
            const p = products.find(x => x.id === item.productId);
            if (!p) return null;
            return (
              <div key={i} className="flex gap-3 text-sm">
                <div className="w-14 shrink-0 aspect-[3/4] overflow-hidden bg-offwhite">
                  <Img src={p.images[0]} alt={p.name} className="h-full w-full object-cover"
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
