'use server';

import { cookies } from 'next/headers';
import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { redirect } from 'next/navigation';

export async function logout() {
  const supabase = createServerActionClient({ cookies });
  await supabase.auth.signOut();
  redirect('/login');
}
