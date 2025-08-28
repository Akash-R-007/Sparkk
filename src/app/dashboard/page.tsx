import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await getSupabaseServerClient()
  
  try {
    const {
      data: { session },
      error
    } = await supabase.auth.getSession()

    // If there's an error or no session, redirect to login
    if (error || !session) {
      console.log('No valid session found:', error?.message || 'No session')
      redirect('/login')
    }

    // Verify the session is still valid
    if (!session.user) {
      console.log('Session exists but no user found')
      redirect('/login')
    }

    return <DashboardClient />
  } catch (error) {
    console.error('Dashboard auth check failed:', error)
    redirect('/login')
  }
}