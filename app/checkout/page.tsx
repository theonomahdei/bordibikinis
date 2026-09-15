'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useStore, formatGhs } from '@/lib/store';
import Img from '@/components/Img';
import { openPaystack } from '@/lib/paystack';

const REGIONS = [
  'Greater Accra', 'Ashanti', 'Central', 'Eastern', 'Western', 'Volta',
  'Northern', 'Bono', 'Upper East', 'Upper West', 'Other',
];
const DELIVERY: Record<string, number> = { 'Greater Accra': 30 };
const DEFAULT_DELIVERY = 60;

const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ?? '';

type PayMethod = 'paystack' | 'cash_on_delivery';

export default function CheckoutPage() {
  const router = useRouter();
  const {
    cart, products, cartTotal, clearCart, createOrder,
    setOrderPaystackRef, cancelPendingOrder, user,
  } = useStore();

  const [form, setForm] = useState({
    name: '', phone: '',
    email: user?.email ?? '',
    region: 'Greater Accra',
    address: '',
  });
  const [payMethod, setPayMethod] = useState<PayMethod>('paystack');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const delivery = cart.length === 0 ? 0 : (DELIVERY[form.region] ?? DEFAULT_DELIVERY);
  const total = cartTotal + delivery;

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const buildOrderItems = () => cart.map(item => {
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
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError('Please log in to complete your order.');
      return;
    }

    if (payMethod === 'paystack' && !PAYSTACK_PUBLIC_KEY) {
      setError('Paystack is not configured yet. Please choose Cash on Delivery, or contact us on WhatsApp.');
      return;
    }

    setBusy(true);
    try {
      const items = buildOrderItems();
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
        paymentMethod: payMethod,
        items,
      });

      if (payMethod === 'cash_on_delivery') {
        clearCart();
        router.replace(`/checkout/success?order=${orderId}&method=cod`);
        return;
      }

      // Paystack flow
      const reference = `swimzy_${orderId.replace(/-/g, '').slice(0, 20)}_${Date.now().toString(36)}`;
      await setOrderPaystackRef(orderId, reference);

      await openPaystack({
        publicKey: PAYSTACK_PUBLIC_KEY,
        email: form.email,
        amountGhs: total,
        reference,
        metadata: { order_id: orderId, customer_name: form.name },
        onSuccess: async (ref) => {
          // Payment confirmed on Paystack's side. Server-side verify + webhook
          // handle stock and paid status. Just take them to the success page.
          clearCart();
          router.replace(`/checkout/success?order=${orderId}&ref=${ref}`);
        },
        onCancel: async () => {
          // Customer closed the popup without paying.
          await cancelPendingOrder(orderId);
          setBusy(false);
          setError('Payment was cancelled. Your cart is still saved.');
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not place the order. Please try again.');
      setBusy(false);
    }
  };

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
            <div className="bg-ink text-paper px-5 py-4 space-y-2">
              <p className="font-display uppercase tracking-widest2 text-sm">Log in to check out</p>
              <p className="text-xs opacity-80 leading-relaxed">
                We ask everyone to sign in before checkout so we can save your details,
                keep your orders in one place, and follow up if anything comes up. It only takes a minute.
              </p>
              <Link
                href="/account?next=/checkout"
                className="inline-block mt-2 bg-paper text-ink font-display uppercase tracking-widest2 text-xs px-5 py-2 hover:opacity-80 transition-opacity"
              >
                Log in or create account
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

          {/* ── Payment method ─────────────────────────────── */}
          <div>
            <p className="font-display uppercase tracking-widest2 text-sm border-b border-smoke pb-3 mb-4">
              Payment method
            </p>

            <div className="space-y-3">
              <label className={`flex items-start gap-3 p-4 border cursor-pointer transition-colors ${
                payMethod === 'paystack' ? 'border-ink bg-offwhite/50' : 'border-smoke hover:border-ink/60'
              }`}>
                <input type="radio" name="pay" value="paystack" checked={payMethod === 'paystack'}
                  onChange={() => setPayMethod('paystack')} className="mt-1" />
                <div className="flex-1">
                  <p className="font-display uppercase tracking-widest2 text-sm">Pay now — Card or Mobile Money</p>
                  <p className="text-xs text-stone mt-1">
                    Secure payment via Paystack. Supports MTN MoMo, Vodafone Cash, AirtelTigo Money,
                    and Visa / Mastercard.
                  </p>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-4 border cursor-pointer transition-colors ${
                payMethod === 'cash_on_delivery' ? 'border-ink bg-offwhite/50' : 'border-smoke hover:border-ink/60'
              }`}>
                <input type="radio" name="pay" value="cash_on_delivery" checked={payMethod === 'cash_on_delivery'}
                  onChange={() => setPayMethod('cash_on_delivery')} className="mt-1" />
                <div className="flex-1">
                  <p className="font-display uppercase tracking-widest2 text-sm">Cash on delivery / Pay via WhatsApp</p>
                  <p className="text-xs text-stone mt-1">
                    We&apos;ll message you on WhatsApp to arrange payment. Available for Accra and select regions.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {error && <p className="text-sm text-error">{error}</p>}

          {user ? (
            <button type="submit" className="btn btn-dark w-full !h-14" disabled={busy}>
              {busy
                ? (payMethod === 'paystack' ? 'Opening secure payment…' : 'Placing order…')
                : (payMethod === 'paystack' ? `Pay ${formatGhs(total)}` : `Place order — ${formatGhs(total)}`)}
            </button>
          ) : (
            <Link
              href="/account?next=/checkout"
              className="btn btn-dark w-full !h-14"
            >
              Log in to continue
            </Link>
          )}

          <p className="text-xs text-stone text-center">
            {!user
              ? 'Your cart is saved. You\u2019ll come right back here after logging in.'
              : payMethod === 'paystack'
              ? 'Payment is processed securely by Paystack. Your card and MoMo details never touch our servers.'
              : 'By placing this order, you agree we\u2019ll reach out on WhatsApp to arrange payment and delivery.'}
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
