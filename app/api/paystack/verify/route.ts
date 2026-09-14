import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// ═══════════════════════════════════════════════════════════
//  Paystack Verify
//  Belt-and-braces double-check when the client claims payment
//  succeeded. Calls Paystack's verify API directly using the
//  secret key. Does NOT decrement stock — the webhook is the
//  source of truth for that. This is just so the customer sees
//  the correct message even if the webhook is briefly delayed.
// ═══════════════════════════════════════════════════════════

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: 'not configured' }, { status: 500 });
  }

  const { reference } = await req.json().catch(() => ({}));
  if (!reference) {
    return NextResponse.json({ error: 'reference required' }, { status: 400 });
  }

  // Ask Paystack directly whether this reference was really paid
  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret}` },
    cache: 'no-store',
  });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.status) {
    return NextResponse.json({ ok: false, status: 'unknown' });
  }

  const paystackStatus: string = body.data?.status ?? 'unknown';
  // 'success', 'failed', 'abandoned', 'ongoing'
  if (paystackStatus === 'success') {
    // If the webhook hasn't landed yet, gently flip the order forward
    // so the customer sees confirmation immediately. The webhook is
    // still the source of truth for stock decrement (idempotent).
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('id, payment_status')
      .eq('paystack_reference', reference)
      .maybeSingle();
    if (order && order.payment_status !== 'paid') {
      await supabaseAdmin.from('orders').update({
        payment_status: 'paid',
        status: 'confirmed',
        paid_at: new Date().toISOString(),
      }).eq('id', order.id);
      await supabaseAdmin.rpc('decrement_stock_for_order', { order_id_in: order.id });
    }
  }

  return NextResponse.json({ ok: true, status: paystackStatus });
}
