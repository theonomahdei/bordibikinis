'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useStore, formatGhs } from '@/lib/store';
import { Category, Product, SIZES, Size } from '@/lib/types';
import Img from '@/components/Img';

// ────────────────────────────────────────────────────────────────
//  ADMIN DASHBOARD
//  Login: admin / bikini-gh-2026  (change in lib/store.tsx)
//  Auth + persistence move to Supabase in the next iteration.
// ────────────────────────────────────────────────────────────────

const emptyStock = (): Record<Size, number> => ({ XS: 0, S: 0, M: 0, L: 0, XL: 0 });

const blankProduct = (): Product => ({
  id: `p-${Date.now()}`,
  slug: '',
  name: '',
  colorName: '',
  colorHex: '#EFE7DC',
  priceGhs: 300,
  description: '',
  fabric: '',
  fit: '',
  care: 'Hand wash cold. Dry flat in shade.',
  categoryIds: [],
  images: [''],
  topStock: emptyStock(),
  bottomStock: emptyStock(),
  isActive: false,
  isFeatured: false,
  createdAt: new Date().toISOString(),
});

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export default function AdminPage() {
  const store = useStore();
  const [tab, setTab] = useState<'products' | 'categories'>('products');
  const [editing, setEditing] = useState<Product | null>(null);
  const [editingCat, setEditingCat] = useState<Category | null>(null);

  if (!store.ready) return <div className="min-h-screen bg-offwhite" />;

  if (!store.isAdmin) return <Login />;

  return (
    <div className="min-h-screen bg-offwhite">
      {/* Top bar */}
      <div className="bg-ink text-paper px-6 py-4 flex items-center justify-between">
        <p className="font-display uppercase tracking-widest2">BIKINI · Admin</p>
        <div className="flex items-center gap-5 text-sm">
          <Link href="/" className="underline underline-offset-2 hover:opacity-70">View store</Link>
          <button onClick={store.logout} className="underline underline-offset-2 hover:opacity-70">
            Log out
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 md:px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-6 border-b border-smoke mb-8">
          {(['products', 'categories'] as const).map(t => (
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
          <button
            onClick={() => {
              if (confirm('Reset the catalog to the original 12 seeded products? Your edits will be lost.')) {
                store.resetCatalog();
              }
            }}
            className="ml-auto text-xs text-stone underline underline-offset-2 hover:text-ink pb-3"
          >
            Reset to seed data
          </button>
        </div>

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

/* ── Login ────────────────────────────────────────────────────── */

function Login() {
  const { login } = useStore();
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState(false);

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-6">
      <form
        className="w-full max-w-sm bg-paper p-10"
        onSubmit={e => {
          e.preventDefault();
          if (!login(user.trim(), pass)) setError(true);
        }}
      >
        <p className="font-display uppercase tracking-widest2 text-center text-2xl">BIKINI</p>
        <p className="text-center text-xs text-stone mt-1 mb-8">Admin access</p>

        <label className="label" htmlFor="u">Username</label>
        <input id="u" className="input mb-5" value={user} onChange={e => setUser(e.target.value)} autoFocus />

        <label className="label" htmlFor="p">Password</label>
        <input id="p" className="input mb-6" type="password" value={pass} onChange={e => setPass(e.target.value)} />

        {error && <p className="text-error text-sm mb-4">Incorrect credentials.</p>}

        <button className="btn btn-dark w-full" type="submit">Log in</button>
        <Link href="/" className="block text-center text-xs text-stone mt-5 underline underline-offset-2">
          Back to store
        </Link>
      </form>
    </div>
  );
}

/* ── Product list ─────────────────────────────────────────────── */

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
              {['', 'Name', 'Price', 'Stock (pieces)', 'Status', 'Featured', ''].map((h, i) => (
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
                    className="text-lg"
                    aria-label="Toggle featured"
                  >
                    {p.isFeatured ? '★' : '☆'}
                  </button>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <button className="underline underline-offset-2 mr-4" onClick={() => onEdit(p)}>
                    Edit
                  </button>
                  <button
                    className="underline underline-offset-2 text-error"
                    onClick={() => {
                      if (confirm(`Delete "${p.name}" permanently?`)) deleteProduct(p.id);
                    }}
                  >
                    Delete
                  </button>
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

/* ── Product form ─────────────────────────────────────────────── */

function ProductForm({ product, onDone }: { product: Product; onDone: () => void }) {
  const { categories, upsertProduct } = useStore();
  const [p, setP] = useState<Product>({ ...product, images: product.images.length ? product.images : [''] });

  const set = <K extends keyof Product>(key: K, value: Product[K]) =>
    setP(prev => ({ ...prev, [key]: value }));

  const setStockField = (piece: 'topStock' | 'bottomStock', size: Size, v: string) =>
    setP(prev => ({ ...prev, [piece]: { ...prev[piece], [size]: Math.max(0, parseInt(v) || 0) } }));

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    upsertProduct({
      ...p,
      slug: p.slug || slugify(p.name),
      images: p.images.map(x => x.trim()).filter(Boolean),
    });
    onDone();
  };

  return (
    <form onSubmit={save} className="bg-paper border border-smoke p-6 md:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="h-display text-2xl">{product.name ? 'Edit product' : 'New product'}</h2>
        <button type="button" onClick={onDone} className="text-sm underline underline-offset-2">
          Cancel
        </button>
      </div>

      {/* Basics */}
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

      {/* Customer-facing specifications */}
      <section className="space-y-5">
        <p className="font-display uppercase tracking-widest2 text-sm border-b border-smoke pb-2">
          Customer specifications
        </p>
        <div>
          <label className="label">Description</label>
          <textarea className="input min-h-[5rem]" required value={p.description}
            onChange={e => set('description', e.target.value)}
            placeholder="What makes this set special — feel, occasion, details…" />
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          <div>
            <label className="label">Fabric &amp; lining</label>
            <textarea className="input min-h-[4rem]" required value={p.fabric}
              onChange={e => set('fabric', e.target.value)}
              placeholder="e.g. Ribbed nylon-spandex, fully lined" />
          </div>
          <div>
            <label className="label">Fit</label>
            <textarea className="input min-h-[4rem]" required value={p.fit}
              onChange={e => set('fit', e.target.value)}
              placeholder="e.g. Triangle top, tie-side cheeky bottom" />
          </div>
          <div>
            <label className="label">Care</label>
            <textarea className="input min-h-[4rem]" required value={p.care}
              onChange={e => set('care', e.target.value)} />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section>
        <p className="font-display uppercase tracking-widest2 text-sm border-b border-smoke pb-2 mb-4">
          Categories
        </p>
        <div className="flex flex-wrap gap-3">
          {categories.map(c => {
            const on = p.categoryIds.includes(c.id);
            return (
              <button
                type="button"
                key={c.id}
                onClick={() => set('categoryIds', on
                  ? p.categoryIds.filter(x => x !== c.id)
                  : [...p.categoryIds, c.id])}
                className={`px-3 py-1.5 text-xs font-display uppercase tracking-widest2 border ${
                  on ? 'bg-ink text-paper border-ink' : 'border-smoke text-stone hover:border-ink hover:text-ink'
                } transition-colors`}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      </section>

      {/* Images */}
      <section className="space-y-3">
        <p className="font-display uppercase tracking-widest2 text-sm border-b border-smoke pb-2">
          Images (URLs — uploads arrive with Supabase Storage)
        </p>
        {p.images.map((url, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-12 shrink-0 aspect-[3/4] overflow-hidden bg-offwhite border border-smoke">
              {url && <Img src={url} alt="" className="h-full w-full object-cover"
                fallbackHex={p.colorHex} fallbackLabel="" />}
            </div>
            <input className="input" value={url} placeholder="https://…"
              onChange={e => set('images', p.images.map((x, j) => (j === i ? e.target.value : x)))} />
            <button type="button" className="text-error text-sm"
              onClick={() => set('images', p.images.filter((_, j) => j !== i))}
              aria-label="Remove image">✕</button>
          </div>
        ))}
        <button type="button" className="text-sm underline underline-offset-2"
          onClick={() => set('images', [...p.images, ''])}>
          + Add image URL
        </button>
      </section>

      {/* Stock */}
      <section className="grid gap-8 md:grid-cols-2">
        {(['topStock', 'bottomStock'] as const).map(piece => (
          <div key={piece}>
            <p className="font-display uppercase tracking-widest2 text-sm border-b border-smoke pb-2 mb-4">
              {piece === 'topStock' ? 'Top stock (per size)' : 'Bottom stock (per size)'}
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

      {/* Flags + save */}
      <section className="flex flex-wrap items-center gap-6 border-t border-smoke pt-6">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={p.isActive}
            onChange={e => set('isActive', e.target.checked)} />
          Active (visible in store)
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={p.isFeatured}
            onChange={e => set('isFeatured', e.target.checked)} />
          Featured on homepage
        </label>
        <button className="btn btn-dark ml-auto" type="submit">Save product</button>
      </section>
    </form>
  );
}

/* ── Category list + form ─────────────────────────────────────── */

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
            <button className="underline underline-offset-2 text-sm" onClick={() => onEdit(c)}>
              Edit
            </button>
            <button
              className="underline underline-offset-2 text-sm text-error"
              onClick={() => {
                if (confirm(`Delete category "${c.name}"? Products stay, but lose this tag.`)) {
                  deleteCategory(c.id);
                }
              }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoryForm({ category, onDone }: { category: Category; onDone: () => void }) {
  const { upsertCategory } = useStore();
  const [c, setC] = useState(category);

  return (
    <form
      className="bg-paper border border-smoke p-6 md:p-8 space-y-6 max-w-xl"
      onSubmit={e => {
        e.preventDefault();
        upsertCategory({ ...c, slug: c.slug || slugify(c.name) });
        onDone();
      }}
    >
      <div className="flex items-center justify-between">
        <h2 className="h-display text-2xl">{category.name ? 'Edit category' : 'New category'}</h2>
        <button type="button" onClick={onDone} className="text-sm underline underline-offset-2">
          Cancel
        </button>
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
        <label className="label">Cover image URL</label>
        <input className="input" value={c.imageUrl}
          onChange={e => setC({ ...c, imageUrl: e.target.value })} placeholder="https://…" />
      </div>
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input type="checkbox" checked={c.isActive}
          onChange={e => setC({ ...c, isActive: e.target.checked })} />
        Visible in store
      </label>

      <button className="btn btn-dark" type="submit">Save category</button>
    </form>
  );
}
