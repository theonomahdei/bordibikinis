// ── Core data types ─────────────────────────────────────────────
// These shapes mirror the Supabase tables we'll create later
// (products, product_variants, categories, product_categories),
// so the migration is a data-source swap, not a rewrite.

export type Size = 'XS' | 'S' | 'M' | 'L' | 'XL';

export const SIZES: Size[] = ['XS', 'S', 'M', 'L', 'XL'];

export interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  sortOrder: number;
  isActive: boolean;
}

// Stock is tracked per piece (top sizes and bottom sizes independently),
// matching the top/bottom selection flow on the product page.
export interface Product {
  id: string;
  slug: string;
  name: string;
  colorName: string;
  colorHex: string;
  priceGhs: number;
  description: string;
  fabric: string;
  fit: string;
  care: string;
  categoryIds: string[];
  images: string[];
  topStock: Record<Size, number>;
  bottomStock: Record<Size, number>;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  topSize: Size;
  bottomSize: Size;
  quantity: number;
}

export interface Catalog {
  products: Product[];
  categories: Category[];
}
