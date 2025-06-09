// proj/src/app/page.tsx
import { redirect } from 'next/navigation';

export default async function HomePage() {
  redirect('/login');
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1>Welcome to the App!</h1>
      <p>You should be redirected to login.</p>
    </main>
  );
}