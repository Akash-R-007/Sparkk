import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function POST(request: Request) {
  const requestCookies = cookies() // ✅ call it here

  const supabase = createRouteHandlerClient({
    cookies: () => Promise.resolve(requestCookies) // ✅ wrap it in a function
  })

  const { email, password } = await request.json()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 401
    })
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200
  })
}