// app/api/logout/route.ts
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';

export async function POST() {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  await supabase.auth.signOut();

  // Clear Supabase auth cookies manually
  const response = NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'));
  response.cookies.set('sb-access-token', '', { maxAge: 0, path: '/' });
  response.cookies.set('sb-refresh-token', '', { maxAge: 0, path: '/' });

  return response;
}
