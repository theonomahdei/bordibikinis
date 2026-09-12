'use client';

import Link from 'next/link';
import { useStore } from '@/lib/store';
import Img from '@/components/Img';
import ProductCard from '@/components/ProductCard';

const HERO_IMG =
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=85&w=2400&auto=format&fit=crop';

export default function HomePage() {
  const { products, categories } = useStore();
  const featured = products.filter(p => p.isActive && p.isFeatured).slice(0, 4);
  const tiles = categories.filter(c => c.isActive).sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <>
      {/* ── HERO — full-bleed image, CTA pinned lower centre ── */}
      <section className="relative h-[100svh] min-h-[560px] w-full overflow-hidden">
        <Img
          src={HERO_IMG}
          alt="Golden-hour beach scene"
          className="absolute inset-0 h-full w-full object-cover"
          fallbackHex="#EFE7DC"
          eager
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/45 via-transparent to-ink/20" />

        <div className="absolute inset-x-0 bottom-[12vh] flex flex-col items-center gap-5 text-paper px-6">
          <h1 className="h-display text-4xl md:text-5xl rise">Best Sellers</h1>
          <Link href="/shop?cat=best-sellers" className="btn btn-ghost rise rise-1">
            Shop now
          </Link>
        </div>
      </section>

      {/* ── CATEGORY TILES ── */}
      <section className="mx-auto max-w-7xl px-4 md:px-8 py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {tiles.map((c, i) => (
            <Link
              key={c.id}
              href={`/shop?cat=${c.slug}`}
              className={`group/card relative aspect-[3/4] overflow-hidden bg-offwhite rise rise-${Math.min(i, 3)}`}
            >
              <Img
                src={c.imageUrl}
                alt={c.name}
                className="card-img h-full w-full object-cover"
                fallbackLabel={c.name}
              />
              <div className="absolute inset-0 bg-ink/15 group-hover/card:bg-ink/30 transition-colors" />
              <span className="absolute inset-x-0 bottom-6 text-center font-display uppercase tracking-widest2 text-paper text-lg drop-shadow">
                {c.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── SPLIT BANNER ── */}
      <section className="grid md:grid-cols-2">
        <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[34rem] overflow-hidden">
          <Img
            src="https://images.unsplash.com/photo-1519046904884-53103b34b206?q=85&w=1600&auto=format&fit=crop"
            alt="Poolside afternoon"
            className="h-full w-full object-cover"
            fallbackHex="#F6DFD4"
          />
        </div>
        <div className="flex flex-col items-center justify-center gap-6 bg-sand px-8 py-20 text-center">
          <p className="font-display uppercase tracking-widest2 text-xs text-ink/60">The Collection</p>
          <h2 className="h-display text-4xl md:text-5xl max-w-md">
            Made for the Ghanaian sun
          </h2>
          <p className="max-w-sm text-sm text-ink/70">
            Twelve signature sets. Independent top and bottom sizing, fully lined fabrics,
            and colours chosen for our light. Priced in cedis, delivered across Ghana.
          </p>
          <Link href="/shop" className="btn btn-dark">Explore all sets</Link>
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ── */}
      <section className="mx-auto max-w-7xl px-4 md:px-8 py-20">
        <div className="flex items-end justify-between mb-8">
          <h2 className="h-display text-3xl">Featured</h2>
          <Link
            href="/shop"
            className="font-display uppercase tracking-widest2 text-xs border-b border-ink pb-0.5 hover:opacity-60 transition-opacity"
          >
            View all
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-8 md:gap-x-4">
          {featured.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>
    </>
  );
}
