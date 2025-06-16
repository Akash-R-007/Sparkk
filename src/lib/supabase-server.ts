// lib/supabase-server.ts
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function getSupabaseServerClient(): Promise<SupabaseClient> {
  const cookieStore = cookies();
  return createServerComponentClient({ cookies: () => cookieStore });
}
