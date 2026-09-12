# BIKINI — Swimwear Store (Ghana)

Next.js 14 storefront + admin dashboard. Prices in Ghana Cedis. Built to migrate cleanly to Supabase (auth, database, storage) and Paystack (payments) in later phases.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

Production:

```bash
npm run build
npm start
```

## Admin dashboard

- URL: **/admin**
- Username: **admin**
- Password: **bikini-gh-2026**

Change the credentials in `lib/store.tsx` (search for `ADMIN_USER`). They're placeholders until Supabase Auth replaces them.

The dashboard covers:
- **Products** — create, edit, delete, search; name, colour + swatch, price (GH₵), description, fabric & lining, fit, care, categories, image URLs (with live preview), per-size stock for tops and bottoms independently, Active/Draft toggle, Featured toggle.
- **Categories** — create, edit, delete, reorder, show/hide. Deleting a category never deletes its products.
- **Reset to seed data** — restores the original 12 products if you want a clean slate.

Admin edits persist in the browser's localStorage. That means they're per-browser until Supabase arrives — good enough for building out the catalog and testing.

## Store features

- Full-viewport hero with **Shop now** → best sellers library
- Category tile grid, split editorial banner, featured row
- Shop page with category filtering (`/shop?cat=bikinis`)
- Product page with **independent top/bottom size selection**, out-of-stock strikethrough, size guide modal (cm), spec accordions
- Slide-out cart drawer, quantity controls, localStorage persistence
- Checkout with Ghana regions + flat delivery rates (GH₵ 30 Accra / GH₵ 60 elsewhere) — simulated order placement, clearly marked `PAYSTACK INTEGRATION POINT` in `app/checkout/page.tsx`
- WhatsApp chat button → +233 53 814 4603 (change in `components/WhatsAppButton.tsx`)
- Every image has a styled fallback — nothing ever renders blank

## Typography & palette

- Display: **Bebas Neue** · Body: **Archivo Narrow** (Google Fonts, loaded in `app/layout.tsx`)
- Palette in `tailwind.config.ts`: ink `#000`, paper `#fff`, offwhite, smoke, stone, sand `#EFE7DC`, blush `#F6DFD4`, error `#DD001B`

## Supabase migration map (next phase)

Everything reads through `lib/store.tsx` — the swap points are marked `[SUPABASE]`:

| Today | Becomes |
|---|---|
| `lib/seed.ts` + localStorage | `products`, `categories`, `product_categories` tables |
| `topStock` / `bottomStock` records | `product_variants` rows (piece, size, qty) |
| Hardcoded admin login | Supabase Auth + `user_roles` + RLS |
| Image URLs | Supabase Storage uploads |
| Checkout simulation | `orders` + `order_items`, Paystack init + webhook, stock decrement on confirmed payment |

## Placeholder images

Product/category photos are Unsplash placeholders — replace them via the admin (image URL fields) or swap to Supabase Storage uploads later.
