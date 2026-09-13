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

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  id?: string;
  productId: string | null;
  productName: string;
  productImage: string;
  colorName: string;
  topSize: Size;
  bottomSize: Size;
  quantity: number;
  unitPriceGhs: number;
}

export interface Order {
  id: string;
  userId: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  region: string;
  deliveryAddress: string;
  subtotalGhs: number;
  deliveryGhs: number;
  totalGhs: number;
  status: OrderStatus;
  notes: string;
  createdAt: string;
  items: OrderItem[];
}

export interface SessionUser {
  id: string;
  email: string;
  isAdmin: boolean;
}
