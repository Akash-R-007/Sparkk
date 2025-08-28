// app/api/logout/route.ts
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    console.log('Server logout initiated')

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Supabase logout error:', error.message)
    } else {
      console.log('Supabase logout successful')
    }

    const response = NextResponse.json({ success: true }, { status: 200 })

    const supabaseCookieNames = [
      'sb-access-token',
      'sb-refresh-token',
      'sb-auth-token',
      'supabase-auth-token',
      'sb-localhost-auth-token',
      'supabase.auth.token',
    ]

    supabaseCookieNames.forEach((cookieName: string) => {
      response.cookies.set(cookieName, '', {
        maxAge: 0,
        expires: new Date(0),
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: false,
        sameSite: 'lax',
      })
      response.cookies.set(cookieName, '', {
        maxAge: 0,
        expires: new Date(0),
        path: '/dashboard',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: false,
        sameSite: 'lax',
      })
      if (process.env.NODE_ENV === 'development') {
        response.cookies.set(cookieName, '', {
          maxAge: 0,
          expires: new Date(0),
          path: '/',
          domain: 'localhost',
          secure: false,
          httpOnly: false,
          sameSite: 'lax',
        })
      }
    })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (supabaseUrl) {
      try {
        const projectId = new URL(supabaseUrl).hostname.split('.')[0]
        const projectSpecificCookies = [
          `sb-${projectId}-auth-token`,
          `sb-${projectId}-auth-token-code-verifier`,
        ]
        projectSpecificCookies.forEach((cookieName: string) => {
          response.cookies.set(cookieName, '', {
            maxAge: 0,
            expires: new Date(0),
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            httpOnly: false,
            sameSite: 'lax',
          })
        })
      } catch {
        console.log('Could not parse Supabase URL for project-specific cookies')
      }
    }

    console.log('Server logout completed - cookies cleared')
    return response
  } catch (error) {
    console.error('Logout API error:', error)

    const response = NextResponse.json({ success: true }, { status: 200 })
    const essentialCookies = ['sb-access-token', 'sb-refresh-token']
    essentialCookies.forEach((cookieName: string) => {
      response.cookies.set(cookieName, '', {
        maxAge: 0,
        path: '/',
        expires: new Date(0),
      })
    })
    return response
  }
}
