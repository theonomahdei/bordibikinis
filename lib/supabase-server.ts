import { createClient } from '@supabase/supabase-js';

// ────────────────────────────────────────────────────────────
//  Server-side Supabase client — only for API routes.
//  Uses the SERVICE ROLE key which bypasses RLS. This key must
//  NEVER leak into client-side code — it's not prefixed with
//  NEXT_PUBLIC_ so Next.js won't ship it to the browser.
// ────────────────────────────────────────────────────────────

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  }
);
