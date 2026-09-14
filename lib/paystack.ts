'use client';

// ────────────────────────────────────────────────────────────
//  Paystack Inline — loads Paystack's script on demand and
//  opens the payment popup. Nothing sensitive lives here;
//  only the PUBLIC key is used client-side.
// ────────────────────────────────────────────────────────────

const PAYSTACK_JS = 'https://js.paystack.co/v2/inline.js';

// Load the Paystack script once, cached in a promise so multiple
// checkout attempts don't re-inject the tag.
let loadPromise: Promise<void> | null = null;

export function loadPaystack(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject('SSR');
  // Already loaded?
  if ((window as any).PaystackPop) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = PAYSTACK_JS;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loadPromise = null;
      reject(new Error('Failed to load Paystack. Check your internet connection.'));
    };
    document.head.appendChild(script);
  });
  return loadPromise;
}

export interface PaystackPayload {
  publicKey: string;
  email: string;
  amountGhs: number;      // in GHS (we convert to pesewas internally)
  reference: string;      // unique per order attempt
  metadata?: Record<string, unknown>;
  onSuccess: (ref: string) => void;
  onCancel: () => void;
}

// Open the Paystack payment popup. Resolves when the popup closes
// (success or cancel — the callbacks handle which case).
export async function openPaystack(p: PaystackPayload): Promise<void> {
  await loadPaystack();
  const PaystackPop = (window as any).PaystackPop;
  if (!PaystackPop) throw new Error('Paystack not available.');

  const popup = PaystackPop.setup({
    key: p.publicKey,
    email: p.email,
    amount: Math.round(p.amountGhs * 100), // pesewas
    currency: 'GHS',
    ref: p.reference,
    channels: ['card', 'mobile_money', 'bank', 'ussd'],
    metadata: p.metadata ?? {},
    callback: (resp: { reference: string }) => p.onSuccess(resp.reference),
    onClose: () => p.onCancel(),
  });
  popup.openIframe();
}
