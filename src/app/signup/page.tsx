'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/client'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  useEffect(() => {
    let isMounted = true

    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user && isMounted) {
          console.log('User already logged in, redirecting to dashboard')
          router.replace('/dashboard')
          return
        }
        
        if (isMounted) {
          setIsCheckingAuth(false)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        if (isMounted) {
          setIsCheckingAuth(false)
        }
      }
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user && isMounted) {
          router.replace('/dashboard')
        }
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [router])

  const validateForm = (): string | null => {
    if (!email || !password || !confirmPassword) {
      return 'All fields are required'
    }
    
    if (password.length < 6) {
      return 'Password must be at least 6 characters long'
    }
    
    if (password !== confirmPassword) {
      return 'Passwords do not match'
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address'
    }
    
    return null
  }

  const handleSignup = async () => {
    if (isLoading) return
    
    // Clear previous messages
    setError('')
    setSuccess('')
    
    // Validate form
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }
    
    setIsLoading(true)
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      })

      if (error) {
        console.error('Signup error:', error.message)
        setError(error.message)
        return
      }

      if (data.user) {
        // Check if user needs email confirmation
        if (data.user.email_confirmed_at) {
          setSuccess('Account created successfully! Redirecting to dashboard...')
          // Auto-login successful, will redirect via auth state change
        } else {
          setSuccess('Account created successfully! Please check your email for verification, then login.')
          // Give user option to go to login
          setTimeout(() => {
            router.push('/login')
          }, 3000)
        }
      }
    } catch (error) {
      console.error('Signup network error:', error)
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSignup()
    }
  }

  // Show loading while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
          <p className="mt-2 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-black">
      <div className="border border-black p-8 rounded-lg shadow w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Sign Up</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}
        
        <input
          className="w-full p-3 mb-4 border border-black rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Email"
          disabled={isLoading}
          autoComplete="email"
        />
        
        <input
          type="password"
          className="w-full p-3 mb-4 border border-black rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Password (min 6 characters)"
          disabled={isLoading}
          autoComplete="new-password"
        />
        
        <input
          type="password"
          className="w-full p-3 mb-4 border border-black rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Confirm Password"
          disabled={isLoading}
          autoComplete="new-password"
        />
        
        <button
          onClick={handleSignup}
          disabled={isLoading}
          className={`w-full py-3 rounded transition-colors ${
            isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-black hover:bg-gray-800'
          } text-white`}
        >
          {isLoading ? 'Creating Account...' : 'Sign Up'}
        </button>
        
        <p className="mt-4 text-center text-sm">
          Already have an account?{' '}
          <span
            className="underline cursor-pointer text-blue-600 hover:text-blue-800"
            onClick={() => router.push('/login')}
          >
            Login
          </span>
        </p>
      </div>
    </div>
  )
}