// app/api/login/route.ts
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

// Helper: Pause execution for X ms
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function POST(request: Request) {
  try {
    const requestCookies = cookies()
    const supabase = createRouteHandlerClient({
      cookies: () => requestCookies,
    })

    const { email, password } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Wrap sign-in call so we can retry if needed
    const doSignIn = async () =>
      supabase.auth.signInWithPassword({
        email: String(email).trim(),
        password: String(password).trim(),
      })

    // First login attempt
    let { data, error } = await doSignIn()

    // Detect transient rate limit (HTTP 429 or contains "rate limit" in message)
    const isRateLimit =
      error && (error.status === 429 || /rate\s*limit/i.test(error.message || ''))

    if (isRateLimit) {
      console.warn('Rate limit hit. Retrying in 700ms...')
      await sleep(700)
      ;({ data, error } = await doSignIn())
    }

    // If still error after retry
    if (error) {
      console.error('Login error:', error.message)
      const status =
        error.status && Number.isInteger(error.status) ? error.status : 401
      return NextResponse.json({ error: error.message }, { status })
    }

    // If login succeeded but no user returned
    if (!data?.user) {
      return NextResponse.json(
        { error: 'Login failed - no user returned' },
        { status: 401 }
      )
    }

    console.log('Server login successful for:', data.user.email)

    // Return success JSON
    return NextResponse.json(
      {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      },
      { status: 200 }
    )
  } catch (err) {
    console.error('Login API error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
