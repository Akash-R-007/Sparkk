// app/dashboard/page.tsx (or wherever your DashboardPage is)

import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase-server'

export default async function DashboardPage() {
  const supabase = await getSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <form action="/api/logout" method="POST">
          <button className="bg-black text-white px-4 py-2 rounded">Logout</button>
        </form>
      </div>
      <iframe src="/dashboard/upload" className="w-full h-[90vh]" />
    </div>
  )
}
