import Link from "next/link"

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 bg-background text-foreground">
      <h1 className="text-3xl font-bold">Welcome</h1>
      <div className="flex gap-4">
        <Link href="/login" className="bg-primary text-primary-foreground px-4 py-2 rounded">
          Login
        </Link>
        <Link href="/signup" className="bg-secondary text-secondary-foreground px-4 py-2 rounded">
          Signup
        </Link>
      </div>
    </main>
  )
}
