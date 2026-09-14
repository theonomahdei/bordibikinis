-- ═══════════════════════════════════════════════════════════════
--  MIGRATION 002 — Persistent cart per user
--  Run this in Supabase Dashboard → SQL Editor → New Query
--  Adds the saved_carts table so logged-in users' carts sync
--  across devices. Guest carts still live in localStorage only.
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.saved_carts (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_carts ENABLE ROW LEVEL SECURITY;

-- Users can only see and edit their own cart
DROP POLICY IF EXISTS "saved_carts_own_read" ON public.saved_carts;
DROP POLICY IF EXISTS "saved_carts_own_write" ON public.saved_carts;

CREATE POLICY "saved_carts_own_read" ON public.saved_carts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "saved_carts_own_write" ON public.saved_carts FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
