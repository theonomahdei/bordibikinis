-- ═══════════════════════════════════════════════════════════════
--  BIKINI / SWIMZY — Supabase Schema
--  Run this entire file in Supabase Dashboard → SQL Editor → New Query
--  It creates tables, security policies, and seeds the 12 products.
--  Safe to re-run: uses DROP IF EXISTS on tables (destroys data).
-- ═══════════════════════════════════════════════════════════════

-- Clean slate on re-run (comment these out if you want to preserve data)
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.product_categories CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;

-- ── categories ────────────────────────────────────────────────
CREATE TABLE public.categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  image_url text NOT NULL DEFAULT '',
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── products ──────────────────────────────────────────────────
CREATE TABLE public.products (
  id text PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  color_name text NOT NULL DEFAULT '',
  color_hex text NOT NULL DEFAULT '#EFE7DC',
  price_ghs numeric NOT NULL DEFAULT 0,
  description text NOT NULL DEFAULT '',
  fabric text NOT NULL DEFAULT '',
  fit text NOT NULL DEFAULT '',
  care text NOT NULL DEFAULT '',
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  top_stock jsonb NOT NULL DEFAULT '{"XS":0,"S":0,"M":0,"L":0,"XL":0}'::jsonb,
  bottom_stock jsonb NOT NULL DEFAULT '{"XS":0,"S":0,"M":0,"L":0,"XL":0}'::jsonb,
  is_active boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── product ↔ category join ───────────────────────────────────
CREATE TABLE public.product_categories (
  product_id text REFERENCES public.products(id) ON DELETE CASCADE,
  category_id text REFERENCES public.categories(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, category_id)
);

-- ── orders ────────────────────────────────────────────────────
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text NOT NULL,
  region text NOT NULL,
  delivery_address text NOT NULL,
  subtotal_ghs numeric NOT NULL,
  delivery_ghs numeric NOT NULL,
  total_ghs numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','shipped','delivered','cancelled')),
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── order line items ──────────────────────────────────────────
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id text REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  product_image text NOT NULL DEFAULT '',
  color_name text NOT NULL DEFAULT '',
  top_size text NOT NULL,
  bottom_size text NOT NULL,
  quantity int NOT NULL,
  unit_price_ghs numeric NOT NULL
);

-- ══════════════════════════════════════════════════════════════
--  ROW-LEVEL SECURITY
--  Anyone can READ active products/categories. Only the admin
--  email can WRITE products/categories. Anyone can CREATE orders
--  (guest checkout). Only admin can UPDATE/DELETE orders.
--  Customers who signed in see only their own orders.
-- ══════════════════════════════════════════════════════════════

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Helper: is the current user the admin?
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND email = 'admin@swimzy.com'
  );
$$;

-- categories: public read, admin write
CREATE POLICY "categories_public_read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "categories_admin_write" ON public.categories FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- products: public read, admin write
CREATE POLICY "products_public_read" ON public.products FOR SELECT USING (true);
CREATE POLICY "products_admin_write" ON public.products FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- product_categories: public read, admin write
CREATE POLICY "pc_public_read" ON public.product_categories FOR SELECT USING (true);
CREATE POLICY "pc_admin_write" ON public.product_categories FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- orders: anyone can insert (guest checkout); admin sees all;
-- signed-in customers see only their own.
CREATE POLICY "orders_anyone_insert" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "orders_admin_all" ON public.orders FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "orders_own_read" ON public.orders FOR SELECT
  USING (user_id = auth.uid());

-- order_items: same rules as orders
CREATE POLICY "oi_anyone_insert" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "oi_admin_all" ON public.order_items FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "oi_own_read" ON public.order_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid()
  ));

-- ══════════════════════════════════════════════════════════════
--  STORAGE POLICIES (for the `products` bucket you created)
--  Public can read images, admin can upload/delete.
-- ══════════════════════════════════════════════════════════════

-- Storage policies are usually set from the Supabase dashboard
-- Storage → Policies UI, but here's the SQL equivalent:

INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "products_read" ON storage.objects;
DROP POLICY IF EXISTS "products_admin_write" ON storage.objects;

CREATE POLICY "products_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'products');

CREATE POLICY "products_admin_write" ON storage.objects FOR ALL
  USING (bucket_id = 'products' AND public.is_admin())
  WITH CHECK (bucket_id = 'products' AND public.is_admin());

-- ══════════════════════════════════════════════════════════════
--  SEED DATA — 12 products, 4 categories
-- ══════════════════════════════════════════════════════════════

INSERT INTO public.categories (id, name, slug, image_url, sort_order, is_active) VALUES
  ('cat-new','New Arrivals','new-arrivals','https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=85&w=1400&auto=format&fit=crop',1,true),
  ('cat-best','Best Sellers','best-sellers','https://images.unsplash.com/photo-1519046904884-53103b34b206?q=85&w=1400&auto=format&fit=crop',2,true),
  ('cat-bikinis','Bikinis','bikinis','https://images.unsplash.com/photo-1505118380757-91f5f5632de0?q=85&w=1400&auto=format&fit=crop',3,true),
  ('cat-swim','Swimwear','swimwear','https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?q=85&w=1400&auto=format&fit=crop',4,true);

INSERT INTO public.products (id, slug, name, color_name, color_hex, price_ghs, description, fabric, fit, care, images, top_stock, bottom_stock, is_active, is_featured) VALUES
  ('p-01','ama-mango-sorbet','AMA — MANGO SORBET','Mango Sorbet','#F5A25D',380,
    'A sun-drenched triangle set in our signature ribbed fabric. Sliding cups let you fine-tune coverage, while tie sides on the bottom adjust to your exact fit.',
    'Ribbed nylon-spandex blend. Fully lined. Quick-dry.','Triangle top with sliding cups. Tie-side bottom, cheeky coverage.','Hand wash cold. Dry flat in shade.',
    '["https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?q=85&w=1400&auto=format&fit=crop","https://images.unsplash.com/photo-1520520731457-9283dd14aa66?q=85&w=1400&auto=format&fit=crop"]'::jsonb,
    '{"XS":6,"S":10,"M":10,"L":8,"XL":4}'::jsonb,'{"XS":6,"S":10,"M":10,"L":8,"XL":4}'::jsonb,true,true),
  ('p-02','efia-midnight','EFIA — MIDNIGHT','Midnight Black','#101820',420,
    'The one you will reach for every time. A deep black halter set with gold-tone hardware and a sculpting underband.',
    'Matte Italian lycra. Double lined for opacity.','Halter-neck top with removable padding. Mid-rise classic bottom.','Rinse after swimming. Hand wash cold. Dry flat.',
    '["https://images.unsplash.com/photo-1519046904884-53103b34b206?q=85&w=1400&auto=format&fit=crop","https://images.unsplash.com/photo-1476673160081-cf065607f449?q=85&w=1400&auto=format&fit=crop"]'::jsonb,
    '{"XS":5,"S":12,"M":12,"L":9,"XL":5}'::jsonb,'{"XS":5,"S":12,"M":12,"L":9,"XL":5}'::jsonb,true,true),
  ('p-03','serwaa-hibiscus','SERWAA — HIBISCUS','Hibiscus Pink','#E64980',350,
    'Bold hibiscus pink in a scoop-neck crop silhouette. Wide underband stays put through swims and beach volleyball alike.',
    'Recycled nylon blend with four-way stretch.','Scoop crop top, medium support. High-cut bottom.','Hand wash cold with mild soap.',
    '["https://images.unsplash.com/photo-1505118380757-91f5f5632de0?q=85&w=1400&auto=format&fit=crop","https://images.unsplash.com/photo-1523471826770-c437b4636fe6?q=85&w=1400&auto=format&fit=crop"]'::jsonb,
    '{"XS":4,"S":8,"M":9,"L":7,"XL":3}'::jsonb,'{"XS":4,"S":8,"M":9,"L":7,"XL":3}'::jsonb,true,true),
  ('p-04','akosua-seafoam','AKOSUA — SEAFOAM','Seafoam Green','#8FD5C6',320,
    'Soft seafoam green with delicate ring details at the hips and bust. Light, minimal, and easy — the set you pack first.',
    'Smooth microfibre lycra. UPF 50+.','Bralette top with adjustable straps. Ring-side bottom.','Hand wash cold. Do not bleach.',
    '["https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?q=85&w=1400&auto=format&fit=crop","https://images.unsplash.com/photo-1473116763249-2faaef81ccda?q=85&w=1400&auto=format&fit=crop"]'::jsonb,
    '{"XS":6,"S":9,"M":9,"L":6,"XL":3}'::jsonb,'{"XS":6,"S":9,"M":9,"L":6,"XL":3}'::jsonb,true,false),
  ('p-05','abena-cocoa','ABENA — COCOA','Cocoa Brown','#6B4A38',390,
    'Rich cocoa brown that flatters every skin tone. A balconette shape with structured cups gives real support without wires.',
    'Textured crinkle fabric, fully lined.','Balconette top, firm support. Mid-coverage bottom.','Hand wash cold. Reshape while damp.',
    '["https://images.unsplash.com/photo-1520520731457-9283dd14aa66?q=85&w=1400&auto=format&fit=crop","https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?q=85&w=1400&auto=format&fit=crop"]'::jsonb,
    '{"XS":5,"S":10,"M":11,"L":8,"XL":4}'::jsonb,'{"XS":5,"S":10,"M":11,"L":8,"XL":4}'::jsonb,true,true),
  ('p-06','adjoa-tangerine','ADJOA — TANGERINE','Tangerine','#F0552D',340,
    'Electric tangerine in a clean triangle cut. The colour of a Cape Coast sunset — impossible to miss.',
    'High-gloss lycra with a subtle sheen.','Classic triangle top. Tie-side cheeky bottom.','Rinse in fresh water after use.',
    '["https://images.unsplash.com/photo-1476673160081-cf065607f449?q=85&w=1400&auto=format&fit=crop","https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=85&w=1400&auto=format&fit=crop"]'::jsonb,
    '{"XS":4,"S":9,"M":9,"L":7,"XL":3}'::jsonb,'{"XS":4,"S":9,"M":9,"L":7,"XL":3}'::jsonb,true,false),
  ('p-07','yaa-lagoon','YAA — LAGOON','Lagoon Blue','#2C6E8F',360,
    'Deep lagoon blue with contrast white piping. Sporty enough to actually swim in, sleek enough for the beach club.',
    'Chlorine-resistant performance knit.','Sport crop top. Full-coverage bottom.','Machine wash cold in a garment bag.',
    '["https://images.unsplash.com/photo-1473116763249-2faaef81ccda?q=85&w=1400&auto=format&fit=crop","https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?q=85&w=1400&auto=format&fit=crop"]'::jsonb,
    '{"XS":5,"S":8,"M":10,"L":8,"XL":5}'::jsonb,'{"XS":5,"S":8,"M":10,"L":8,"XL":5}'::jsonb,true,false),
  ('p-08','esi-vanilla','ESI — VANILLA','Vanilla Cream','#F2E8D5',300,
    'Warm vanilla cream in a barely-there silhouette. Gold-tone sliders and a soft ribbed texture make this the quiet luxury pick.',
    'Fine-rib knit, double lined so it never turns sheer.','Micro triangle top. Low-rise tie bottom.','Hand wash cold separately.',
    '["https://images.unsplash.com/photo-1523471826770-c437b4636fe6?q=85&w=1400&auto=format&fit=crop","https://images.unsplash.com/photo-1505118380757-91f5f5632de0?q=85&w=1400&auto=format&fit=crop"]'::jsonb,
    '{"XS":6,"S":10,"M":8,"L":6,"XL":2}'::jsonb,'{"XS":6,"S":10,"M":8,"L":6,"XL":2}'::jsonb,true,false),
  ('p-09','afia-palm','AFIA — PALM','Palm Green','#2E5B3E',370,
    'Deep palm green inspired by the Aburi hills. A twist-front top adds shape and interest, with a matching high-waist bottom that smooths and holds.',
    'Sculpting compression lycra.','Twist-front bandeau. High-waist bottom, full coverage.','Hand wash cold. Do not wring.',
    '["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=85&w=1400&auto=format&fit=crop","https://images.unsplash.com/photo-1519046904884-53103b34b206?q=85&w=1400&auto=format&fit=crop"]'::jsonb,
    '{"XS":4,"S":8,"M":9,"L":8,"XL":4}'::jsonb,'{"XS":4,"S":8,"M":9,"L":8,"XL":4}'::jsonb,true,false),
  ('p-10','maame-berry','MAAME — BERRY','Berry Crush','#8E2D56',410,
    'Crushed-velvet berry with a plunge neckline and adjustable back tie. Rich texture, deep colour, maximum drama.',
    'Stretch velvet with swim-grade lining.','Plunge halter top. Cheeky velvet bottom.','Hand wash cold, inside out. Never iron velvet.',
    '["https://images.unsplash.com/photo-1520520731457-9283dd14aa66?q=85&w=1400&auto=format&fit=crop","https://images.unsplash.com/photo-1476673160081-cf065607f449?q=85&w=1400&auto=format&fit=crop"]'::jsonb,
    '{"XS":3,"S":7,"M":8,"L":6,"XL":3}'::jsonb,'{"XS":3,"S":7,"M":8,"L":6,"XL":3}'::jsonb,true,true),
  ('p-11','akua-shoreline','AKUA — SHORELINE','Shoreline Stripe','#4A7FA5',330,
    'Breton-inspired blue and white stripes in a square-neck crop. Clean, nautical, and endlessly photogenic.',
    'Yarn-dyed stripe knit, colourfast in salt water.','Square-neck crop top. Mid-rise classic bottom.','Hand wash cold.',
    '["https://images.unsplash.com/photo-1473116763249-2faaef81ccda?q=85&w=1400&auto=format&fit=crop","https://images.unsplash.com/photo-1523471826770-c437b4636fe6?q=85&w=1400&auto=format&fit=crop"]'::jsonb,
    '{"XS":5,"S":9,"M":9,"L":7,"XL":4}'::jsonb,'{"XS":5,"S":9,"M":9,"L":7,"XL":4}'::jsonb,true,false),
  ('p-12','ohemaa-gold-dust','OHEMAA — GOLD DUST','Gold Dust','#C9A24B',450,
    'Our crown piece. Shimmering gold-dust fabric that catches light with every move, cut in a refined triangle silhouette. Fit for an Ohemaa.',
    'Metallic shimmer lycra, fully lined.','Fixed triangle top with back tie. Tie-side bottom.','Hand wash cold gently. Handle with care.',
    '["https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?q=85&w=1400&auto=format&fit=crop","https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?q=85&w=1400&auto=format&fit=crop"]'::jsonb,
    '{"XS":3,"S":6,"M":7,"L":5,"XL":2}'::jsonb,'{"XS":3,"S":6,"M":7,"L":5,"XL":2}'::jsonb,true,true);

INSERT INTO public.product_categories (product_id, category_id) VALUES
  ('p-01','cat-new'),('p-01','cat-bikinis'),('p-01','cat-swim'),
  ('p-02','cat-best'),('p-02','cat-bikinis'),('p-02','cat-swim'),
  ('p-03','cat-new'),('p-03','cat-bikinis'),
  ('p-04','cat-bikinis'),('p-04','cat-swim'),
  ('p-05','cat-best'),('p-05','cat-bikinis'),
  ('p-06','cat-new'),('p-06','cat-bikinis'),
  ('p-07','cat-swim'),('p-07','cat-bikinis'),
  ('p-08','cat-bikinis'),
  ('p-09','cat-best'),('p-09','cat-swim'),
  ('p-10','cat-new'),('p-10','cat-best'),('p-10','cat-bikinis'),
  ('p-11','cat-bikinis'),('p-11','cat-swim'),
  ('p-12','cat-new'),('p-12','cat-best'),('p-12','cat-bikinis');
