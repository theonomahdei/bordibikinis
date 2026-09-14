'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useStore, formatGhs } from '@/lib/store';
import type { Category, Order, OrderStatus, Product, Size } from '@/lib/types';
import { SIZES } from '@/lib/types';
import Img from '@/components/Img';

// ────────────────────────────────────────────────────────────
//  ADMIN — Supabase-backed
//  Login: only the email in NEXT_PUBLIC_ADMIN_EMAIL is admin.
//  Everyone else authenticated is treated as a customer.
// ────────────────────────────────────────────────────────────

const emptyStock = (): Record<Size, number> => ({ XS: 0, S: 0, M: 0, L: 0, XL: 0 });

const blankProduct = (): Product => ({
  id: `p-${Date.now()}`, slug: '', name: '',
  colorName: '', colorHex: '#EFE7DC', priceGhs: 300,
  description: '', fabric: '', fit: '',
  care: 'Hand wash cold. Dry flat in shade.',
  categoryIds: [], images: [],
  topStock: emptyStock(), bottomStock: emptyStock(),
  isActive: false, isFeatured: false,
  createdAt: new Date().toISOString(),
});

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

type Tab = 'orders' | 'products' | 'categories';

export default function AdminPage() {
  const store = useStore();
  const [tab, setTab] = useState<Tab>('orders');
  const [editing, setEditing] = useState<Product | null>(null);
  const [editingCat, setEditingCat] = useState<Category | null>(null);

  if (!store.ready) return <div className="min-h-screen bg-offwhite" />;
  if (!store.user) return <Login />;
  if (!store.isAdmin) return <NotAdmin />;

  return (
    <div className="min-h-screen bg-offwhite">
      <div className="bg-ink text-paper px-6 py-4 flex items-center justify-between">
        <p className="font-display uppercase tracking-widest2">SWIMZY · Admin</p>
        <div className="flex items-center gap-5 text-sm">
          <Link href="/" className="underline underline-offset-2 hover:opacity-70">View store</Link>
          <button onClick={store.signOut} className="underline underline-offset-2 hover:opacity-70">
            Log out
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 md:px-6 py-8">
        <div className="flex gap-6 border-b border-smoke mb-8">
          {(['orders', 'products', 'categories'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setEditing(null); setEditingCat(null); }}
              className={`font-display uppercase tracking-widest2 text-sm pb-3 border-b-2 -mb-px ${
                tab === t ? 'border-ink' : 'border-transparent text-stone hover:text-ink'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'orders' && <OrdersList />}
        {tab === 'products' && (
          editing
            ? <ProductForm product={editing} onDone={() => setEditing(null)} />
            : <ProductList onEdit={setEditing} />
        )}
        {tab === 'categories' && (
          editingCat
            ? <CategoryForm category={editingCat} onDone={() => setEditingCat(null)} />
            : <CategoryList onEdit={setEditingCat} />
        )}
      </div>
    </div>
  );
}

/* ── Login ──────────────────────────────────────────────── */
function Login() {
  const { signInEmail } = useStore();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error: err } = await signInEmail(email.trim(), pass);
    setBusy(false);
    if (err) setError(err);
  };

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-6">
      <form className="w-full max-w-sm bg-paper p-10" onSubmit={submit}>
        <p className="font-display uppercase tracking-widest2 text-center text-2xl">SWIMZY</p>
        <p className="text-center text-xs text-stone mt-1 mb-8">Admin access</p>

        <label className="label" htmlFor="ae">Email</label>
        <input id="ae" className="input mb-5" type="email" value={email}
          onChange={e => setEmail(e.target.value)} autoFocus />

        <label className="label" htmlFor="ap">Password</label>
        <input id="ap" className="input mb-6" type="password" value={pass}
          onChange={e => setPass(e.target.value)} />

        {error && <p className="text-error text-sm mb-4">{error}</p>}

        <button className="btn btn-dark w-full" type="submit" disabled={busy}>
          {busy ? '…' : 'Log in'}
        </button>
        <Link href="/" className="block text-center text-xs text-stone mt-5 underline underline-offset-2">
          Back to store
        </Link>
      </form>
    </div>
  );
}

function NotAdmin() {
  const { signOut, user } = useStore();
  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-6">
      <div className="max-w-sm bg-paper p-10 text-center">
        <p className="font-display uppercase tracking-widest2 text-lg">Not authorised</p>
        <p className="text-sm text-ink/60 mt-3">
          {user?.email} isn't the admin account. Sign in with the correct account.
        </p>
        <button onClick={signOut} className="btn btn-dark mt-6 w-full">Sign out</button>
      </div>
    </div>
  );
}

/* ── Orders ─────────────────────────────────────────────── */
function OrdersList() {
  const { fetchOrders, updateOrderStatus } = useStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | OrderStatus>('all');

  const load = async () => {
    setLoading(true);
    setOrders(await fetchOrders());
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const visible = filter === 'all' ? orders : orders.filter(o => o.status === filter);
  const badge = (s: OrderStatus) => {
    const map: Record<OrderStatus, string> = {
      pending: 'bg-blush text-ink',
      confirmed: 'bg-sand text-ink',
      shipped: 'bg-smoke text-ink',
      delivered: 'bg-ink text-paper',
      cancelled: 'bg-error/20 text-error',
    };
    return map[s];
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex gap-2">
          {(['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-xs font-display uppercase tracking-widest2 border ${
                filter === s ? 'bg-ink text-paper border-ink' : 'border-smoke text-stone hover:border-ink hover:text-ink'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <button onClick={load} className="ml-auto text-xs underline underline-offset-2">
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-center py-16 text-stone">Loading orders…</p>
      ) : visible.length === 0 ? (
        <p className="text-center py-16 text-stone">No orders yet.</p>
      ) : (
        <div className="space-y-3">
          {visible.map(order => (
            <div key={order.id} className="bg-paper border border-smoke">
              <button
                className="w-full flex items-center gap-4 px-4 py-3 text-left"
                onClick={() => setExpanded(expanded === order.id ? null : order.id)}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-display uppercase tracking-loose text-sm truncate">
                    {order.customerName}
                  </p>
                  <p className="text-xs text-stone">
                    {new Date(order.createdAt).toLocaleString('en-GH')} · {order.customerPhone} · {order.region}
                  </p>
                </div>
                <span className={`px-2 py-1 text-[10px] font-display uppercase tracking-widest2 ${badge(order.status)}`}>
                  {order.status}
                </span>
                <span className="font-display text-sm w-24 text-right">
                  {formatGhs(order.totalGhs)}
                </span>
                <span className="text-lg leading-none w-4 text-center">
                  {expanded === order.id ? '−' : '+'}
                </span>
              </button>

              {expanded === order.id && (
                <div className="border-t border-smoke p-5 fade-in grid gap-6 md:grid-cols-[1fr_18rem]">
                  <div className="space-y-3">
                    <p className="font-display uppercase tracking-widest2 text-xs text-stone">Items</p>
                    {order.items.map((it, i) => (
                      <div key={i} className="flex gap-3 text-sm">
                        <div className="w-14 shrink-0 aspect-[3/4] overflow-hidden bg-offwhite">
                          <Img src={it.productImage} alt={it.productName}
                            className="h-full w-full object-cover" fallbackLabel="" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-display uppercase tracking-loose truncate">{it.productName}</p>
                          <p className="text-xs text-stone">
                            {it.colorName} · Top {it.topSize} · Bottom {it.bottomSize} · Qty {it.quantity}
                          </p>
                        </div>
                        <p>{formatGhs(it.unitPriceGhs * it.quantity)}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="font-display uppercase tracking-widest2 text-xs text-stone mb-1">Delivery</p>
                      <p className="text-sm">{order.customerName}</p>
                      <p className="text-sm text-ink/70">{order.customerPhone}</p>
                      <p className="text-sm text-ink/70">{order.customerEmail}</p>
                      <p className="text-sm text-ink/70 mt-2">{order.region}</p>
                      <p className="text-sm text-ink/70">{order.deliveryAddress}</p>
                    </div>

                    <div className="border-t border-smoke pt-3 text-sm space-y-1">
                      <div className="flex justify-between"><span>Subtotal</span><span>{formatGhs(order.subtotalGhs)}</span></div>
                      <div className="flex justify-between text-ink/60"><span>Delivery</span><span>{formatGhs(order.deliveryGhs)}</span></div>
                      <div className="flex justify-between font-display text-base pt-1">
                        <span>Total</span><span>{formatGhs(order.totalGhs)}</span>
                      </div>
                    </div>

                    <div>
                      <p className="font-display uppercase tracking-widest2 text-xs text-stone mb-1">Update status</p>
                      <select
                        className="input"
                        value={order.status}
                        onChange={async e => {
                          const next = e.target.value as OrderStatus;
                          await updateOrderStatus(order.id, next);
                          setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: next } : o));
                        }}
                      >
                        {(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const).map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Product list ───────────────────────────────────────── */
function ProductList({ onEdit }: { onEdit: (p: Product) => void }) {
  const { products, deleteProduct, upsertProduct } = useStore();
  const [query, setQuery] = useState('');

  const visible = products.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.colorName.toLowerCase().includes(query.toLowerCase()));

  const totalStock = (p: Product) =>
    SIZES.reduce((n, s) => n + p.topStock[s], 0) + SIZES.reduce((n, s) => n + p.bottomStock[s], 0);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <input
          className="input max-w-xs"
          placeholder="Search products…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <button className="btn btn-dark !min-w-0 ml-auto" onClick={() => onEdit(blankProduct())}>
          + New product
        </button>
      </div>

      <div className="overflow-x-auto thin-scroll bg-paper border border-smoke">
        <table className="w-full text-sm min-w-[44rem]">
          <thead>
            <tr className="border-b border-smoke text-left">
              {['', 'Name', 'Price', 'Stock', 'Status', 'Featured', ''].map((h, i) => (
                <th key={i} className="px-4 py-3 font-display uppercase tracking-widest2 text-xs text-stone">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map(p => (
              <tr key={p.id} className="border-b border-smoke/60 hover:bg-offwhite/60">
                <td className="px-4 py-3">
                  <div className="w-10 aspect-[3/4] overflow-hidden bg-offwhite">
                    <Img src={p.images[0] ?? ''} alt="" className="h-full w-full object-cover"
                      fallbackHex={p.colorHex} fallbackLabel="" />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="font-display uppercase tracking-loose">{p.name || '(untitled)'}</p>
                  <p className="text-xs text-stone">{p.colorName}</p>
                </td>
                <td className="px-4 py-3">{formatGhs(p.priceGhs)}</td>
                <td className="px-4 py-3">
                  <span className={totalStock(p) < 10 ? 'text-error' : ''}>{totalStock(p)}</span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => upsertProduct({ ...p, isActive: !p.isActive })}
                    className={`px-2 py-0.5 text-xs font-display uppercase tracking-widest2 border ${
                      p.isActive ? 'border-ink' : 'border-smoke text-stone'
                    }`}
                  >
                    {p.isActive ? 'Active' : 'Draft'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => upsertProduct({ ...p, isFeatured: !p.isFeatured })}
                    className="text-lg" aria-label="Toggle featured"
                  >
                    {p.isFeatured ? '★' : '☆'}
                  </button>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <button className="underline underline-offset-2 mr-4" onClick={() => onEdit(p)}>Edit</button>
                  <button
                    className="underline underline-offset-2 text-error"
                    onClick={() => {
                      if (confirm(`Delete "${p.name}" permanently?`)) deleteProduct(p.id);
                    }}
                  >Delete</button>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-stone">No products found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Product form (with device image upload) ────────────── */
function ProductForm({ product, onDone }: { product: Product; onDone: () => void }) {
  const { categories, upsertProduct, uploadImage } = useStore();
  const [p, setP] = useState<Product>({ ...product });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const set = <K extends keyof Product>(key: K, value: Product[K]) =>
    setP(prev => ({ ...prev, [key]: value }));

  const setStockField = (piece: 'topStock' | 'bottomStock', size: Size, v: string) =>
    setP(prev => ({ ...prev, [piece]: { ...prev[piece], [size]: Math.max(0, parseInt(v) || 0) } }));

  const handleFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setUploading(true);
    setError(null);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) {
        urls.push(await uploadImage(f));
      }
      set('images', [...p.images, ...urls]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await upsertProduct({ ...p, slug: p.slug || slugify(p.name) });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="bg-paper border border-smoke p-6 md:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="h-display text-2xl">{product.name ? 'Edit product' : 'New product'}</h2>
        <button type="button" onClick={onDone} className="text-sm underline underline-offset-2">Cancel</button>
      </div>

      <section className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="label">Product name</label>
          <input className="input" required value={p.name}
            onChange={e => set('name', e.target.value.toUpperCase())}
            placeholder="e.g. ADWOA — CORAL" />
        </div>
        <div>
          <label className="label">URL slug (auto if blank)</label>
          <input className="input" value={p.slug}
            onChange={e => set('slug', slugify(e.target.value))} placeholder="adwoa-coral" />
        </div>
        <div>
          <label className="label">Colour name</label>
          <input className="input" required value={p.colorName}
            onChange={e => set('colorName', e.target.value)} placeholder="Coral" />
        </div>
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="label">Colour swatch</label>
            <input type="color" className="h-10 w-full cursor-pointer border border-smoke bg-paper"
              value={p.colorHex} onChange={e => set('colorHex', e.target.value)} />
          </div>
          <div className="flex-1">
            <label className="label">Price (GH₵)</label>
            <input className="input" type="number" min={1} required value={p.priceGhs}
              onChange={e => set('priceGhs', parseInt(e.target.value) || 0)} />
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <p className="font-display uppercase tracking-widest2 text-sm border-b border-smoke pb-2">
          Customer specifications
        </p>
        <div>
          <label className="label">Description</label>
          <textarea className="input min-h-[5rem]" required value={p.description}
            onChange={e => set('description', e.target.value)} />
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          <div>
            <label className="label">Fabric & lining</label>
            <textarea className="input min-h-[4rem]" required value={p.fabric}
              onChange={e => set('fabric', e.target.value)} />
          </div>
          <div>
            <label className="label">Fit</label>
            <textarea className="input min-h-[4rem]" required value={p.fit}
              onChange={e => set('fit', e.target.value)} />
          </div>
          <div>
            <label className="label">Care</label>
            <textarea className="input min-h-[4rem]" required value={p.care}
              onChange={e => set('care', e.target.value)} />
          </div>
        </div>
      </section>

      <section>
        <p className="font-display uppercase tracking-widest2 text-sm border-b border-smoke pb-2 mb-4">
          Categories
        </p>
        <div className="flex flex-wrap gap-3">
          {categories.map(c => {
            const on = p.categoryIds.includes(c.id);
            return (
              <button type="button" key={c.id}
                onClick={() => set('categoryIds', on
                  ? p.categoryIds.filter(x => x !== c.id)
                  : [...p.categoryIds, c.id])}
                className={`px-3 py-1.5 text-xs font-display uppercase tracking-widest2 border ${
                  on ? 'bg-ink text-paper border-ink' : 'border-smoke text-stone hover:border-ink hover:text-ink'
                }`}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between border-b border-smoke pb-2">
          <p className="font-display uppercase tracking-widest2 text-sm">Images</p>
          <label className="btn btn-light !min-w-0 !h-9 !px-4 !text-xs cursor-pointer">
            {uploading ? 'Uploading…' : '+ Upload from device'}
            <input ref={fileInput} type="file" accept="image/*" multiple hidden
              onChange={e => handleFiles(e.target.files)} disabled={uploading} />
          </label>
        </div>

        {p.images.length === 0 && (
          <p className="text-sm text-stone italic">
            No images yet. Upload from your phone or laptop — anything JPG, PNG, or WebP works.
          </p>
        )}

        {p.images.map((url, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-14 shrink-0 aspect-[3/4] overflow-hidden bg-offwhite border border-smoke">
              <Img src={url} alt="" className="h-full w-full object-cover"
                fallbackHex={p.colorHex} fallbackLabel="" />
            </div>
            <input className="input" value={url} readOnly />
            <button type="button" className="text-error text-sm"
              onClick={() => set('images', p.images.filter((_, j) => j !== i))}
              aria-label="Remove image">✕</button>
          </div>
        ))}
      </section>

      <section className="grid gap-8 md:grid-cols-2">
        {(['topStock', 'bottomStock'] as const).map(piece => (
          <div key={piece}>
            <p className="font-display uppercase tracking-widest2 text-sm border-b border-smoke pb-2 mb-4">
              {piece === 'topStock' ? 'Top stock' : 'Bottom stock'}
            </p>
            <div className="grid grid-cols-5 gap-3">
              {SIZES.map(s => (
                <div key={s}>
                  <label className="label text-center">{s}</label>
                  <input className="input text-center" type="number" min={0}
                    value={p[piece][s]}
                    onChange={e => setStockField(piece, s, e.target.value)} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="flex flex-wrap items-center gap-6 border-t border-smoke pt-6">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={p.isActive} onChange={e => set('isActive', e.target.checked)} />
          Active (visible in store)
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={p.isFeatured} onChange={e => set('isFeatured', e.target.checked)} />
          Featured on homepage
        </label>
        {error && <p className="text-error text-sm">{error}</p>}
        <button className="btn btn-dark ml-auto" type="submit" disabled={saving || uploading}>
          {saving ? 'Saving…' : 'Save product'}
        </button>
      </section>
    </form>
  );
}

/* ── Category list + form (with upload) ─────────────────── */
function CategoryList({ onEdit }: { onEdit: (c: Category) => void }) {
  const { categories, deleteCategory, upsertCategory, products } = useStore();
  const sorted = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);

  const count = (id: string) => products.filter(p => p.categoryIds.includes(id)).length;

  const move = (c: Category, dir: -1 | 1) => {
    const idx = sorted.findIndex(x => x.id === c.id);
    const swap = sorted[idx + dir];
    if (!swap) return;
    upsertCategory({ ...c, sortOrder: swap.sortOrder });
    upsertCategory({ ...swap, sortOrder: c.sortOrder });
  };

  return (
    <div>
      <div className="flex justify-end mb-6">
        <button
          className="btn btn-dark !min-w-0"
          onClick={() => onEdit({
            id: `cat-${Date.now()}`, name: '', slug: '', imageUrl: '',
            sortOrder: (sorted.at(-1)?.sortOrder ?? 0) + 1, isActive: true,
          })}
        >
          + New category
        </button>
      </div>

      <div className="bg-paper border border-smoke divide-y divide-smoke/60">
        {sorted.map((c, i) => (
          <div key={c.id} className="flex items-center gap-4 px-4 py-3">
            <div className="flex flex-col gap-1">
              <button disabled={i === 0} onClick={() => move(c, -1)}
                className="text-xs disabled:opacity-20" aria-label="Move up">▲</button>
              <button disabled={i === sorted.length - 1} onClick={() => move(c, 1)}
                className="text-xs disabled:opacity-20" aria-label="Move down">▼</button>
            </div>
            <div className="w-12 aspect-square overflow-hidden bg-offwhite">
              <Img src={c.imageUrl} alt="" className="h-full w-full object-cover" fallbackLabel="" />
            </div>
            <div className="flex-1">
              <p className="font-display uppercase tracking-loose">{c.name || '(untitled)'}</p>
              <p className="text-xs text-stone">/{c.slug} · {count(c.id)} products</p>
            </div>
            <button
              onClick={() => upsertCategory({ ...c, isActive: !c.isActive })}
              className={`px-2 py-0.5 text-xs font-display uppercase tracking-widest2 border ${
                c.isActive ? 'border-ink' : 'border-smoke text-stone'
              }`}
            >
              {c.isActive ? 'Visible' : 'Hidden'}
            </button>
            <button className="underline underline-offset-2 text-sm" onClick={() => onEdit(c)}>Edit</button>
            <button
              className="underline underline-offset-2 text-sm text-error"
              onClick={() => {
                if (confirm(`Delete category "${c.name}"?`)) deleteCategory(c.id);
              }}
            >Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoryForm({ category, onDone }: { category: Category; onDone: () => void }) {
  const { upsertCategory, uploadImage } = useStore();
  const [c, setC] = useState(category);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadImage(file);
      setC({ ...c, imageUrl: url });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally { setUploading(false); }
  };

  return (
    <form
      className="bg-paper border border-smoke p-6 md:p-8 space-y-6 max-w-xl"
      onSubmit={async e => {
        e.preventDefault();
        setSaving(true);
        try {
          await upsertCategory({ ...c, slug: c.slug || slugify(c.name) });
          onDone();
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Save failed');
        } finally { setSaving(false); }
      }}
    >
      <div className="flex items-center justify-between">
        <h2 className="h-display text-2xl">{category.name ? 'Edit category' : 'New category'}</h2>
        <button type="button" onClick={onDone} className="text-sm underline underline-offset-2">Cancel</button>
      </div>

      <div>
        <label className="label">Name</label>
        <input className="input" required value={c.name}
          onChange={e => setC({ ...c, name: e.target.value })} />
      </div>
      <div>
        <label className="label">Slug (auto if blank)</label>
        <input className="input" value={c.slug}
          onChange={e => setC({ ...c, slug: slugify(e.target.value) })} />
      </div>
      <div>
        <label className="label">Cover image</label>
        <div className="flex gap-3 items-start">
          {c.imageUrl && (
            <div className="w-16 aspect-square overflow-hidden bg-offwhite border border-smoke">
              <Img src={c.imageUrl} alt="" className="h-full w-full object-cover" fallbackLabel="" />
            </div>
          )}
          <div className="flex-1 space-y-2">
            <label className="btn btn-light !min-w-0 !h-9 !px-4 !text-xs cursor-pointer">
              {uploading ? 'Uploading…' : (c.imageUrl ? 'Replace image' : 'Upload from device')}
              <input type="file" accept="image/*" hidden
                onChange={e => handleFile(e.target.files?.[0] ?? null)} disabled={uploading} />
            </label>
            <input className="input text-xs" value={c.imageUrl} readOnly placeholder="No image yet" />
          </div>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input type="checkbox" checked={c.isActive}
          onChange={e => setC({ ...c, isActive: e.target.checked })} />
        Visible in store
      </label>

      {error && <p className="text-error text-sm">{error}</p>}
      <button className="btn btn-dark" type="submit" disabled={saving || uploading}>
        {saving ? 'Saving…' : 'Save category'}
      </button>
    </form>
  );
}
