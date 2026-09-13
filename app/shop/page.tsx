'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import ProductCard from '@/components/ProductCard';
import Reveal from '@/components/Reveal';

function ShopContent() {
  const { products, categories, loading } = useStore();
  const params = useSearchParams();
  const activeSlug = params.get('cat');

  const activeCategory = categories.find(c => c.slug === activeSlug) ?? null;

  const visible = products.filter(p => {
    if (!p.isActive) return false;
    if (!activeCategory) return true;
    return p.categoryIds.includes(activeCategory.id);
  });

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-8 pb-8">
      <div className="py-10 text-center">
        <h1 className="h-display text-4xl md:text-5xl rise">
          {activeCategory ? activeCategory.name : 'Shop All'}
        </h1>
        <p className="mt-2 text-sm text-ink/60 rise rise-1">
          {loading ? '…' : `${visible.length} ${visible.length === 1 ? 'set' : 'sets'}`}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 pb-10">
        <Link
          href="/shop"
          className={`font-display uppercase tracking-widest2 text-[13px] pb-1 border-b ${
            !activeCategory ? 'border-ink' : 'border-transparent text-ink/50 hover:text-ink'
          } transition-colors`}
        >
          All
        </Link>
        {categories.filter(c => c.isActive).sort((a, b) => a.sortOrder - b.sortOrder).map(c => (
          <Link
            key={c.id}
            href={`/shop?cat=${c.slug}`}
            className={`font-display uppercase tracking-widest2 text-[13px] pb-1 border-b ${
              activeCategory?.id === c.id ? 'border-ink' : 'border-transparent text-ink/50 hover:text-ink'
            } transition-colors`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-3 gap-y-10 md:gap-x-4">
          {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
            <div key={i} className="aspect-[3/4] bg-offwhite pulse-fade" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="py-24 text-center">
          <p className="font-display uppercase tracking-widest2 text-lg text-ink/60">
            Nothing here yet
          </p>
          <p className="mt-2 text-sm text-ink/50">New sets are on the way.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-3 gap-y-10 md:gap-x-4">
          {visible.map((p, i) => (
            <Reveal key={p.id} delay={(Math.min(i % 4, 3) as 0 | 1 | 2 | 3)}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense>
      <ShopContent />
    </Suspense>
  );
}
