'use client';

import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useStore, formatGhs } from '@/lib/store';
import { SIZES, Size } from '@/lib/types';
import Img from '@/components/Img';
import SizeGuideModal from '@/components/SizeGuideModal';
import ProductCard from '@/components/ProductCard';

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const { products, addToCart, ready } = useStore();

  const product = useMemo(() => products.find(p => p.slug === slug), [products, slug]);

  const [topSize, setTopSize] = useState<Size | null>(null);
  const [bottomSize, setBottomSize] = useState<Size | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [imgIndex, setImgIndex] = useState(0);
  const [openPanel, setOpenPanel] = useState<string | null>('description');

  if (!ready) return <div className="min-h-[60vh]" />;

  if (!product || !product.isActive) {
    return (
      <div className="mx-auto max-w-xl px-6 py-32 text-center">
        <h1 className="h-display text-3xl">Set not found</h1>
        <p className="mt-3 text-sm text-ink/60">
          It may have sold out or been removed.
        </p>
        <Link href="/shop" className="btn btn-dark mt-8">Back to shop</Link>
      </div>
    );
  }

  const related = products
    .filter(p => p.isActive && p.id !== product.id &&
      p.categoryIds.some(c => product.categoryIds.includes(c)))
    .slice(0, 4);

  const canAdd = topSize !== null && bottomSize !== null;

  const handleAdd = () => {
    setAttempted(true);
    if (!canAdd) return;
    addToCart({ productId: product.id, topSize: topSize!, bottomSize: bottomSize!, quantity: 1 });
  };

  const panels = [
    { key: 'description', title: 'Description', body: product.description },
    { key: 'fabric', title: 'Fabric & Lining', body: product.fabric },
    { key: 'fit', title: 'Fit', body: product.fit },
    { key: 'care', title: 'Care', body: product.care },
  ];

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 md:px-8 grid gap-10 lg:grid-cols-2 lg:gap-16 pb-8">
        {/* ── Gallery ── */}
        <div>
          <div className="relative aspect-[3/4] overflow-hidden bg-offwhite">
            <Img
              key={imgIndex}
              src={product.images[imgIndex] ?? product.images[0]}
              alt={product.name}
              className="h-full w-full object-cover fade-in"
              fallbackHex={product.colorHex}
              fallbackLabel={product.colorName}
              eager
            />
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-3">
              {product.images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setImgIndex(i)}
                  className={`w-20 aspect-[3/4] overflow-hidden border ${
                    i === imgIndex ? 'border-ink' : 'border-transparent opacity-70'
                  }`}
                  aria-label={`View image ${i + 1}`}
                >
                  <Img
                    src={src}
                    alt=""
                    className="h-full w-full object-cover"
                    fallbackHex={product.colorHex}
                    fallbackLabel=""
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Details ── */}
        <div className="lg:pt-6">
          <p className="text-xs uppercase tracking-widest2 text-stone font-display">
            {product.colorName}
          </p>
          <h1 className="h-display text-3xl md:text-4xl mt-1">{product.name}</h1>
          <p className="mt-3 text-lg">{formatGhs(product.priceGhs)}</p>

          {/* Colour dot */}
          <div className="mt-5 flex items-center gap-2">
            <span
              className="inline-block h-5 w-5 rounded-full border border-smoke"
              style={{ backgroundColor: product.colorHex }}
              aria-label={product.colorName}
            />
            <span className="text-xs text-ink/60">{product.colorName}</span>
          </div>

          {/* ── TOP size ── */}
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <p className="font-display uppercase tracking-widest2 text-sm">
                Top — select size
              </p>
              <button
                onClick={() => setGuideOpen(true)}
                className="text-xs underline underline-offset-2 text-ink/60 hover:text-ink"
              >
                Size guide
              </button>
            </div>
            <div className="mt-3 flex gap-6">
              {SIZES.map(s => {
                const out = product.topStock[s] <= 0;
                return (
                  <button
                    key={s}
                    className="size-pill"
                    data-checked={topSize === s}
                    data-disabled={out}
                    disabled={out}
                    onClick={() => setTopSize(s)}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── BOTTOM size ── */}
          <div className="mt-6">
            <p className="font-display uppercase tracking-widest2 text-sm">
              Bottom — select size
            </p>
            <div className="mt-3 flex gap-6">
              {SIZES.map(s => {
                const out = product.bottomStock[s] <= 0;
                return (
                  <button
                    key={s}
                    className="size-pill"
                    data-checked={bottomSize === s}
                    data-disabled={out}
                    disabled={out}
                    onClick={() => setBottomSize(s)}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {attempted && !canAdd && (
            <p className="mt-4 text-sm text-error">
              Please select {!topSize && !bottomSize ? 'a top and bottom size'
                : !topSize ? 'a top size' : 'a bottom size'}.
            </p>
          )}

          <button className="btn btn-dark w-full mt-6" onClick={handleAdd}>
            {canAdd ? 'Add to bag' : 'Select sizes'}
          </button>

          <p className="mt-3 text-xs text-stone text-center">
            Mix sizes freely — tops and bottoms are sized independently.
          </p>

          {/* ── Info accordions ── */}
          <div className="mt-10 border-t border-smoke">
            {panels.map(panel => (
              <div key={panel.key} className="border-b border-smoke">
                <button
                  className="flex w-full items-center justify-between py-4 text-left"
                  onClick={() => setOpenPanel(openPanel === panel.key ? null : panel.key)}
                >
                  <span className="font-display uppercase tracking-widest2 text-sm">
                    {panel.title}
                  </span>
                  <span className="text-lg leading-none">
                    {openPanel === panel.key ? '−' : '+'}
                  </span>
                </button>
                {openPanel === panel.key && (
                  <p className="pb-5 text-sm text-ink/70 fade-in">{panel.body}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Related ── */}
      {related.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 md:px-8 py-16">
          <h2 className="h-display text-2xl mb-8">You may also like</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-8 md:gap-x-4">
            {related.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      <SizeGuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />
    </>
  );
}
