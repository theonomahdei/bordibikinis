import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-server';

// ═══════════════════════════════════════════════════════════
//  Paystack Webhook
//  Paystack POSTs here after any transaction event. We:
//    1. Verify the signature so no one can forge these calls
//    2. Look up the order by the paystack_reference
//    3. On success, mark paid + decrement stock
//    4. On failure, mark failed (24h cleanup takes it later)
//  This route is NOT protected by auth headers — Paystack
//  authenticates itself via the x-paystack-signature header.
// ═══════════════════════════════════════════════════════════

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    console.error('PAYSTACK_SECRET_KEY not set');
    return NextResponse.json({ error: 'not configured' }, { status: 500 });
  }

  // Read raw body FIRST — the signature is calculated over the raw bytes.
  const rawBody = await req.text();
  const signature = req.headers.get('x-paystack-signature') ?? '';

  const expected = crypto
    .createHmac('sha512', secret)
    .update(rawBody)
    .digest('hex');

  if (signature !== expected) {
    console.warn('Paystack webhook: signature mismatch');
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
  }

  let event: any;
  try { event = JSON.parse(rawBody); } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 });
  }

  const reference: string | undefined = event?.data?.reference;
  if (!reference) {
    return NextResponse.json({ ok: true, note: 'no reference' });
  }

  // Look up the order by reference
  const { data: order, error: fetchErr } = await supabaseAdmin
    .from('orders')
    .select('id, status, payment_status')
    .eq('paystack_reference', reference)
    .maybeSingle();

  if (fetchErr) {
    console.error('Order lookup failed', fetchErr);
    return NextResponse.json({ error: 'lookup failed' }, { status: 500 });
  }
  if (!order) {
    // Order may have been cleaned up already — acknowledge so Paystack stops retrying
    return NextResponse.json({ ok: true, note: 'order not found' });
  }

  // Idempotency — never process the same successful event twice
  if (order.payment_status === 'paid') {
    return NextResponse.json({ ok: true, note: 'already paid' });
  }

  if (event.event === 'charge.success') {
    // Mark paid + confirmed, then decrement stock
    const { error: updErr } = await supabaseAdmin
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'confirmed',
        paid_at: new Date().toISOString(),
      })
      .eq('id', order.id);
    if (updErr) {
      console.error('Order update failed', updErr);
      return NextResponse.json({ error: 'update failed' }, { status: 500 });
    }

    // Decrement stock (function is defined in supabase/003_paystack.sql)
    const { error: rpcErr } = await supabaseAdmin.rpc('decrement_stock_for_order', {
      order_id_in: order.id,
    });
    if (rpcErr) {
      console.error('Stock decrement failed', rpcErr);
      // We don't fail the webhook here — payment already succeeded.
      // Admin can reconcile stock manually if needed.
    }

    return NextResponse.json({ ok: true });
  }

  if (
    event.event === 'charge.failed' ||
    event.event === 'transfer.failed'
  ) {
    await supabaseAdmin
      .from('orders')
      .update({ payment_status: 'failed', status: 'cancelled' })
      .eq('id', order.id);
    return NextResponse.json({ ok: true });
  }

  // Any other event type — acknowledge but do nothing
  return NextResponse.json({ ok: true, note: `ignored: ${event.event}` });
}
