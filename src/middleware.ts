// middleware.ts - Simplified and more reliable
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  try {
    const { data: { session } } = await supabase.auth.getSession()

    const { pathname } = req.nextUrl
    const isAuthRoute = pathname === '/login' || pathname === '/signup'
    const isProtectedRoute = pathname === '/dashboard' || pathname.startsWith('/dashboard')
    const isRootRoute = pathname === '/'

    console.log(`Middleware: ${pathname}, Session: ${session?.user?.email || 'none'}`)

    const hasValidSession = session && session.user

    // Root route handling - redirect to appropriate page
    if (isRootRoute) {
      const redirectUrl = hasValidSession ? '/dashboard' : '/login'
      return NextResponse.redirect(new URL(redirectUrl, req.url))
    }

    // Protected routes - require authentication
    if (isProtectedRoute) {
      if (!hasValidSession) {
        console.log('No valid session for protected route, redirecting to login')
        return NextResponse.redirect(new URL('/login', req.url))
      }
    }

    // Auth routes - redirect to dashboard if already authenticated
    if (isAuthRoute && hasValidSession) {
      console.log('Already authenticated, redirecting to dashboard')
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return res

  } catch (error) {
    console.error('Middleware error:', error)
    
    // On error, be conservative with redirects
    const { pathname } = req.nextUrl
    const isProtectedRoute = pathname === '/dashboard' || pathname.startsWith('/dashboard')
    
    if (isProtectedRoute) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    
    return res
  }
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}