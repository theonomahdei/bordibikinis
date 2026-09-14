-- ═══════════════════════════════════════════════════════════════
--  MIGRATION 003 — Paystack payment integration
--  Adds payment tracking columns to orders + a payment_method
--  field so we can distinguish Paystack orders from cash-on-delivery.
--  Run this in Supabase Dashboard → SQL Editor → New Query.
-- ═══════════════════════════════════════════════════════════════

-- ── Extend orders with payment tracking ────────────────────────
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'cash_on_delivery'
    CHECK (payment_method IN ('paystack', 'cash_on_delivery')),
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'not_required'
    CHECK (payment_status IN ('not_required', 'pending', 'paid', 'failed', 'refunded')),
  ADD COLUMN IF NOT EXISTS paystack_reference text UNIQUE,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

-- ── Loosen the order status check to include payment states ────
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending_payment', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'));

-- ── Stock decrement function ──────────────────────────────────
-- Called from the webhook (which uses the service role and bypasses RLS)
-- when a Paystack payment is confirmed. Decrements each order line's
-- top and bottom sizes atomically.
CREATE OR REPLACE FUNCTION public.decrement_stock_for_order(order_id_in uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  item record;
  new_top jsonb;
  new_bottom jsonb;
  cur_top int;
  cur_bottom int;
BEGIN
  FOR item IN
    SELECT product_id, top_size, bottom_size, quantity
    FROM public.order_items
    WHERE order_id = order_id_in
      AND product_id IS NOT NULL
  LOOP
    -- Read current stocks
    SELECT
      COALESCE((top_stock ->> item.top_size)::int, 0),
      COALESCE((bottom_stock ->> item.bottom_size)::int, 0)
      INTO cur_top, cur_bottom
    FROM public.products
    WHERE id = item.product_id;

    -- Compute new values (clamp at 0)
    UPDATE public.products
    SET
      top_stock = jsonb_set(
        top_stock,
        ARRAY[item.top_size],
        to_jsonb(GREATEST(0, cur_top - item.quantity))
      ),
      bottom_stock = jsonb_set(
        bottom_stock,
        ARRAY[item.bottom_size],
        to_jsonb(GREATEST(0, cur_bottom - item.quantity))
      )
    WHERE id = item.product_id;
  END LOOP;
END;
$$;

-- ── Cleanup: expire stale pending_payment orders after 24 hours ──
-- You can run this manually from Supabase SQL editor whenever, or
-- schedule it as a cron job later. It's safe to run anytime.
CREATE OR REPLACE FUNCTION public.cleanup_stale_pending_payments()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cnt int;
BEGIN
  UPDATE public.orders
  SET status = 'cancelled', payment_status = 'failed'
  WHERE status = 'pending_payment'
    AND created_at < now() - interval '24 hours';
  GET DIAGNOSTICS cnt = ROW_COUNT;
  RETURN cnt;
END;
$$;
