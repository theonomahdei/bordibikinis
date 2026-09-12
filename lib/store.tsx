'use client';

import React, {
  createContext, useContext, useEffect, useMemo, useState, useCallback,
} from 'react';
import { Catalog, CartItem, Category, Product, Size } from './types';
import { seedCatalog } from './seed';

// ════════════════════════════════════════════════════════════════
//  DATA LAYER — SUPABASE SWAP POINT
//  Today the catalog lives in seed.ts and admin edits persist to
//  localStorage. When Supabase comes in, only the functions marked
//  [SUPABASE] change: loadCatalog / persistCatalog become queries
//  and mutations against the products / categories tables, and the
//  admin session becomes Supabase Auth. Nothing else in the app
//  needs to change — every component reads through this store.
// ════════════════════════════════════════════════════════════════

const CATALOG_KEY = 'bikini.catalog.v1';
const CART_KEY = 'bikini.cart.v1';
const ADMIN_KEY = 'bikini.admin.session';

// [SUPABASE] replace with: supabase.from('products').select(...)
function loadCatalog(): Catalog {
  if (typeof window === 'undefined') return seedCatalog;
  try {
    const raw = window.localStorage.getItem(CATALOG_KEY);
    if (raw) return JSON.parse(raw) as Catalog;
  } catch { /* fall through to seed */ }
  return seedCatalog;
}

// [SUPABASE] replace with insert/update/delete mutations
function persistCatalog(catalog: Catalog) {
  try { window.localStorage.setItem(CATALOG_KEY, JSON.stringify(catalog)); } catch { /* ignore */ }
}

interface StoreValue {
  ready: boolean;
  products: Product[];
  categories: Category[];
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
  // admin
  isAdmin: boolean;
  login: (user: string, pass: string) => boolean;
  logout: () => void;
  // catalog mutations (admin)
  upsertProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;
  upsertCategory: (c: Category) => void;
  deleteCategory: (id: string) => void;
  setStock: (productId: string, piece: 'top' | 'bottom', size: Size, qty: number) => void;
  resetCatalog: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [catalog, setCatalog] = useState<Catalog>(seedCatalog);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setCatalog(loadCatalog());
    try {
      const rawCart = window.localStorage.getItem(CART_KEY);
      if (rawCart) setCart(JSON.parse(rawCart));
      setIsAdmin(window.sessionStorage.getItem(ADMIN_KEY) === '1');
    } catch { /* ignore */ }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) { try { window.localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch { /* ignore */ } }
  }, [cart, ready]);

  const mutateCatalog = useCallback((fn: (c: Catalog) => Catalog) => {
    setCatalog(prev => { const next = fn(prev); persistCatalog(next); return next; });
  }, []);

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

  // [SUPABASE] admin auth becomes supabase.auth.signInWithPassword.
  // Change these placeholder credentials in this one spot for now.
  const ADMIN_USER = 'admin';
  const ADMIN_PASS = 'bikini-gh-2026';

  const login = useCallback((user: string, pass: string) => {
    const ok = user === ADMIN_USER && pass === ADMIN_PASS;
    if (ok) {
      setIsAdmin(true);
      try { window.sessionStorage.setItem(ADMIN_KEY, '1'); } catch { /* ignore */ }
    }
    return ok;
  }, []);

  const logout = useCallback(() => {
    setIsAdmin(false);
    try { window.sessionStorage.removeItem(ADMIN_KEY); } catch { /* ignore */ }
  }, []);

  const upsertProduct = useCallback((p: Product) => mutateCatalog(c => {
    const exists = c.products.some(x => x.id === p.id);
    return {
      ...c,
      products: exists ? c.products.map(x => (x.id === p.id ? p : x)) : [p, ...c.products],
    };
  }), [mutateCatalog]);

  const deleteProduct = useCallback((id: string) => mutateCatalog(c => ({
    ...c, products: c.products.filter(x => x.id !== id),
  })), [mutateCatalog]);

  const upsertCategory = useCallback((cat: Category) => mutateCatalog(c => {
    const exists = c.categories.some(x => x.id === cat.id);
    return {
      ...c,
      categories: exists ? c.categories.map(x => (x.id === cat.id ? cat : x)) : [...c.categories, cat],
    };
  }), [mutateCatalog]);

  const deleteCategory = useCallback((id: string) => mutateCatalog(c => ({
    ...c,
    categories: c.categories.filter(x => x.id !== id),
    products: c.products.map(p => ({ ...p, categoryIds: p.categoryIds.filter(cid => cid !== id) })),
  })), [mutateCatalog]);

  const setStock = useCallback((productId: string, piece: 'top' | 'bottom', size: Size, qty: number) =>
    mutateCatalog(c => ({
      ...c,
      products: c.products.map(p => {
        if (p.id !== productId) return p;
        const key = piece === 'top' ? 'topStock' : 'bottomStock';
        return { ...p, [key]: { ...p[key], [size]: Math.max(0, qty) } };
      }),
    })), [mutateCatalog]);

  const resetCatalog = useCallback(() => {
    try { window.localStorage.removeItem(CATALOG_KEY); } catch { /* ignore */ }
    setCatalog(seedCatalog);
  }, []);

  const cartTotal = useMemo(() => cart.reduce((sum, item) => {
    const p = catalog.products.find(x => x.id === item.productId);
    return sum + (p ? p.priceGhs * item.quantity : 0);
  }, 0), [cart, catalog.products]);

  const cartCount = useMemo(() => cart.reduce((n, x) => n + x.quantity, 0), [cart]);

  const value: StoreValue = {
    ready,
    products: catalog.products,
    categories: catalog.categories,
    cart, cartOpen, setCartOpen, addToCart, removeFromCart, updateQuantity, clearCart,
    cartTotal, cartCount,
    isAdmin, login, logout,
    upsertProduct, deleteProduct, upsertCategory, deleteCategory, setStock, resetCatalog,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}

export const formatGhs = (n: number) => `GH₵ ${n.toFixed(0)}`;
