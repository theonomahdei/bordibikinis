'use client';

import Link from 'next/link';
import { useStore, formatGhs } from '@/lib/store';
import Img from './Img';

export default function CartDrawer() {
  const {
    cart, cartOpen, setCartOpen, products, removeFromCart, updateQuantity, cartTotal,
  } = useStore();

  return (
    <>
      <div className="drawer-dim" data-open={cartOpen} onClick={() => setCartOpen(false)} />

      <aside className="drawer" data-open={cartOpen} aria-label="Shopping bag" aria-hidden={!cartOpen}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-smoke">
          <p className="font-display uppercase tracking-widest2 text-base">Shopping Bag</p>
          <button onClick={() => setCartOpen(false)} aria-label="Close cart" className="p-1">
            <svg width="14" height="14" viewBox="0 0 14 14">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8 text-center">
            <p className="font-display uppercase tracking-widest2 text-lg">Your bag is empty</p>
            <p className="text-sm text-ink/60">
              Free delivery in Accra over GH₵ 500 · 7-day exchange on unworn sets
            </p>
            <button className="btn btn-dark" onClick={() => setCartOpen(false)}>
              Continue shopping
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto thin-scroll px-6 py-4 space-y-6">
              {cart.map((item, i) => {
                const p = products.find(x => x.id === item.productId);
                if (!p) return null;
                return (
                  <div key={`${item.productId}-${item.topSize}-${item.bottomSize}`} className="flex gap-4">
                    <Link
                      href={`/product/${p.slug}`}
                      onClick={() => setCartOpen(false)}
                      className="block w-20 shrink-0 aspect-[3/4] overflow-hidden bg-offwhite"
                    >
                      <Img
                        src={p.images[0]}
                        alt={p.name}
                        className="h-full w-full object-cover"
                        fallbackHex={p.colorHex}
                        fallbackLabel={p.colorName}
                      />
                    </Link>

                    <div className="flex-1 min-w-0">
                      <p className="font-display uppercase tracking-loose text-sm truncate">{p.name}</p>
                      <p className="text-xs text-ink/60 mt-1">
                        Top {item.topSize} · Bottom {item.bottomSize}
                      </p>
                      <p className="text-sm mt-1">{formatGhs(p.priceGhs)}</p>

                      <div className="mt-2 flex items-center gap-3">
                        <div className="flex items-center border border-smoke">
                          <button
                            className="px-2 py-1 text-sm"
                            onClick={() => updateQuantity(i, item.quantity - 1)}
                            aria-label="Decrease quantity"
                          >−</button>
                          <span className="px-2 text-sm">{item.quantity}</span>
                          <button
                            className="px-2 py-1 text-sm"
                            onClick={() => updateQuantity(i, item.quantity + 1)}
                            aria-label="Increase quantity"
                          >+</button>
                        </div>
                        <button
                          className="text-xs text-stone underline underline-offset-2 hover:text-ink"
                          onClick={() => removeFromCart(i)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-smoke px-6 py-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-display uppercase tracking-widest2 text-sm">Subtotal</span>
                <span className="font-display text-lg">{formatGhs(cartTotal)}</span>
              </div>
              <p className="text-xs text-stone">Delivery calculated at checkout.</p>
              <Link
                href="/checkout"
                onClick={() => setCartOpen(false)}
                className="btn btn-dark w-full"
              >
                Checkout
              </Link>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
