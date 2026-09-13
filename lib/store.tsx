'use client';

import React, {
  createContext, useContext, useEffect, useMemo, useState, useCallback,
} from 'react';
import { supabase, ADMIN_EMAIL } from './supabase';
import type {
  CartItem, Category, Product, Size, Order, OrderItem, OrderStatus, SessionUser,
} from './types';

// ═══════════════════════════════════════════════════════════════
//  DATA LAYER — SUPABASE
//  Products, categories, orders live in Supabase.
//  Cart lives in localStorage (never left the client anyway).
//  Auth is Supabase Auth. Admin is: authenticated + email matches.
// ═══════════════════════════════════════════════════════════════

const CART_KEY = 'bikini.cart.v1';

// ── DB row shapes ──────────────────────────────────────────
interface ProductRow {
  id: string; slug: string; name: string; color_name: string; color_hex: string;
  price_ghs: number; description: string; fabric: string; fit: string; care: string;
  images: string[]; top_stock: Record<Size, number>; bottom_stock: Record<Size, number>;
  is_active: boolean; is_featured: boolean; created_at: string;
  product_categories?: { category_id: string }[];
}
interface CategoryRow {
  id: string; name: string; slug: string; image_url: string;
  sort_order: number; is_active: boolean;
}

const productFromRow = (r: ProductRow): Product => ({
  id: r.id, slug: r.slug, name: r.name, colorName: r.color_name, colorHex: r.color_hex,
  priceGhs: Number(r.price_ghs), description: r.description, fabric: r.fabric,
  fit: r.fit, care: r.care, images: r.images ?? [], topStock: r.top_stock,
  bottomStock: r.bottom_stock, isActive: r.is_active, isFeatured: r.is_featured,
  createdAt: r.created_at,
  categoryIds: (r.product_categories ?? []).map(pc => pc.category_id),
});

const categoryFromRow = (r: CategoryRow): Category => ({
  id: r.id, name: r.name, slug: r.slug, imageUrl: r.image_url,
  sortOrder: r.sort_order, isActive: r.is_active,
});

// ── Context shape ─────────────────────────────────────────
interface StoreValue {
  ready: boolean;
  loading: boolean;
  products: Product[];
  categories: Category[];
  refresh: () => Promise<void>;

  // cart
  cart: CartItem[];
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (item: CartItem) => void;
  removeFromCart: (index: number) => void;
  updateQuantity: (index: number, qty: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;

  // auth
  user: SessionUser | null;
  isAdmin: boolean;
  signInEmail: (email: string, pass: string) => Promise<{ error: string | null }>;
  signUpEmail: (email: string, pass: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;

  // catalog mutations (admin)
  upsertProduct: (p: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  upsertCategory: (c: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // orders
  createOrder: (o: Omit<Order, 'id' | 'createdAt' | 'status' | 'userId'>) => Promise<string>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
  fetchOrders: () => Promise<Order[]>;

  // image upload
  uploadImage: (file: File) => Promise<string>;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);

  // ── Load catalog from Supabase ─────────────────────────
  const refresh = useCallback(async () => {
    setLoading(true);
    const [pRes, cRes] = await Promise.all([
      supabase.from('products').select('*, product_categories(category_id)').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('sort_order'),
    ]);
    if (pRes.data) setProducts(pRes.data.map(productFromRow));
    if (cRes.data) setCategories(cRes.data.map(categoryFromRow));
    setLoading(false);
  }, []);

  // ── Boot ───────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      // Cart from localStorage
      try {
        const raw = window.localStorage.getItem(CART_KEY);
        if (raw) setCart(JSON.parse(raw));
      } catch { /* ignore */ }

      // Existing session (if any)
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          isAdmin: session.user.email === ADMIN_EMAIL,
        });
      }

      // Listen for auth changes across tabs
      supabase.auth.onAuthStateChange((_evt, session) => {
        if (session?.user?.email) {
          setUser({
            id: session.user.id,
            email: session.user.email,
            isAdmin: session.user.email === ADMIN_EMAIL,
          });
        } else {
          setUser(null);
        }
      });

      await refresh();
      setReady(true);
    })();
  }, [refresh]);

  // ── Cart persistence ───────────────────────────────────
  useEffect(() => {
    if (!ready) return;
    try { window.localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch { /* ignore */ }
  }, [cart, ready]);

  const addToCart = useCallback((item: CartItem) => {
    setCart(prev => {
      const i = prev.findIndex(x =>
        x.productId === item.productId && x.topSize === item.topSize && x.bottomSize === item.bottomSize);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], quantity: next[i].quantity + item.quantity };
        return next;
      }
      return [...prev, item];
    });
    setCartOpen(true);
  }, []);

  const removeFromCart = useCallback((index: number) =>
    setCart(prev => prev.filter((_, i) => i !== index)), []);

  const updateQuantity = useCallback((index: number, qty: number) =>
    setCart(prev => prev.map((x, i) => (i === index ? { ...x, quantity: Math.max(1, qty) } : x))), []);

  const clearCart = useCallback(() => setCart([]), []);

  // ── Auth ────────────────────────────────────────────────
  const signInEmail = useCallback(async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    return { error: error?.message ?? null };
  }, []);

  const signUpEmail = useCallback(async (email: string, pass: string) => {
    const { error } = await supabase.auth.signUp({ email, password: pass });
    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  // ── Catalog mutations (admin only, enforced by RLS too) ─
  const upsertProduct = useCallback(async (p: Product) => {
    const row = {
      id: p.id, slug: p.slug, name: p.name, color_name: p.colorName, color_hex: p.colorHex,
      price_ghs: p.priceGhs, description: p.description, fabric: p.fabric, fit: p.fit, care: p.care,
      images: p.images, top_stock: p.topStock, bottom_stock: p.bottomStock,
      is_active: p.isActive, is_featured: p.isFeatured,
    };
    const { error } = await supabase.from('products').upsert(row);
    if (error) throw new Error(error.message);
    // Rewrite category joins
    await supabase.from('product_categories').delete().eq('product_id', p.id);
    if (p.categoryIds.length) {
      await supabase.from('product_categories').insert(
        p.categoryIds.map(cid => ({ product_id: p.id, category_id: cid }))
      );
    }
    await refresh();
  }, [refresh]);

  const deleteProduct = useCallback(async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw new Error(error.message);
    await refresh();
  }, [refresh]);

  const upsertCategory = useCallback(async (c: Category) => {
    const row = {
      id: c.id, name: c.name, slug: c.slug, image_url: c.imageUrl,
      sort_order: c.sortOrder, is_active: c.isActive,
    };
    const { error } = await supabase.from('categories').upsert(row);
    if (error) throw new Error(error.message);
    await refresh();
  }, [refresh]);

  const deleteCategory = useCallback(async (id: string) => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw new Error(error.message);
    await refresh();
  }, [refresh]);

  // ── Orders ─────────────────────────────────────────────
  const createOrder = useCallback(async (
    o: Omit<Order, 'id' | 'createdAt' | 'status' | 'userId'>
  ) => {
    const { data: orderData, error } = await supabase.from('orders').insert({
      user_id: user?.id ?? null,
      customer_name: o.customerName,
      customer_phone: o.customerPhone,
      customer_email: o.customerEmail,
      region: o.region,
      delivery_address: o.deliveryAddress,
      subtotal_ghs: o.subtotalGhs,
      delivery_ghs: o.deliveryGhs,
      total_ghs: o.totalGhs,
      notes: o.notes ?? '',
    }).select('id').single();
    if (error || !orderData) throw new Error(error?.message ?? 'Order failed');

    const rows = o.items.map(item => ({
      order_id: orderData.id,
      product_id: item.productId,
      product_name: item.productName,
      product_image: item.productImage,
      color_name: item.colorName,
      top_size: item.topSize,
      bottom_size: item.bottomSize,
      quantity: item.quantity,
      unit_price_ghs: item.unitPriceGhs,
    }));
    const { error: itemsErr } = await supabase.from('order_items').insert(rows);
    if (itemsErr) throw new Error(itemsErr.message);

    return orderData.id as string;
  }, [user]);

  const updateOrderStatus = useCallback(async (id: string, status: OrderStatus) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (error) throw new Error(error.message);
  }, []);

  const fetchOrders = useCallback(async (): Promise<Order[]> => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map((r: any): Order => ({
      id: r.id,
      userId: r.user_id,
      customerName: r.customer_name,
      customerPhone: r.customer_phone,
      customerEmail: r.customer_email,
      region: r.region,
      deliveryAddress: r.delivery_address,
      subtotalGhs: Number(r.subtotal_ghs),
      deliveryGhs: Number(r.delivery_ghs),
      totalGhs: Number(r.total_ghs),
      status: r.status,
      notes: r.notes ?? '',
      createdAt: r.created_at,
      items: (r.order_items ?? []).map((i: any): OrderItem => ({
        id: i.id,
        productId: i.product_id,
        productName: i.product_name,
        productImage: i.product_image,
        colorName: i.color_name,
        topSize: i.top_size,
        bottomSize: i.bottom_size,
        quantity: i.quantity,
        unitPriceGhs: Number(i.unit_price_ghs),
      })),
    }));
  }, []);

  // ── Image upload ───────────────────────────────────────
  const uploadImage = useCallback(async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from('products').upload(path, file, {
      cacheControl: '31536000', upsert: false,
    });
    if (error) throw new Error(error.message);
    const { data } = supabase.storage.from('products').getPublicUrl(path);
    return data.publicUrl;
  }, []);

  const cartTotal = useMemo(() => cart.reduce((sum, item) => {
    const p = products.find(x => x.id === item.productId);
    return sum + (p ? p.priceGhs * item.quantity : 0);
  }, 0), [cart, products]);

  const cartCount = useMemo(() => cart.reduce((n, x) => n + x.quantity, 0), [cart]);

  const value: StoreValue = {
    ready, loading, products, categories, refresh,
    cart, cartOpen, setCartOpen, addToCart, removeFromCart, updateQuantity, clearCart,
    cartTotal, cartCount,
    user, isAdmin: user?.isAdmin ?? false,
    signInEmail, signUpEmail, signOut,
    upsertProduct, deleteProduct, upsertCategory, deleteCategory,
    createOrder, updateOrderStatus, fetchOrders,
    uploadImage,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}

export const formatGhs = (n: number) => `GH₵ ${n.toFixed(0)}`;
