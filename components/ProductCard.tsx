'use client';

import Link from 'next/link';
import { Product } from '@/lib/types';
import { formatGhs } from '@/lib/store';
import Img from './Img';

export default function ProductCard({ product }: { product: Product }) {
  const [primary, secondary] = product.images;

  return (
    <Link href={`/product/${product.slug}`} className="group/card block">
      <div className="relative aspect-[3/4] overflow-hidden bg-offwhite">
        <Img
          src={primary}
          alt={product.name}
          className="card-img h-full w-full object-cover"
          fallbackHex={product.colorHex}
          fallbackLabel={product.colorName}
        />
        {secondary && (
          <div className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500">
            <Img
              src={secondary}
              alt={`${product.name} — alternate view`}
              className="h-full w-full object-cover"
              fallbackHex={product.colorHex}
              fallbackLabel={product.colorName}
            />
          </div>
        )}
        {product.isFeatured && (
          <span className="absolute left-3 top-3 bg-paper/90 px-2 py-1 font-display uppercase tracking-widest2 text-[10px]">
            Featured
          </span>
        )}
      </div>

      <div className="pt-3 pb-1 text-center">
        <p className="font-display uppercase tracking-loose text-sm">{product.name}</p>
        <p className="text-sm text-ink/70 mt-0.5">{formatGhs(product.priceGhs)}</p>
      </div>
    </Link>
  );
}
