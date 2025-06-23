import '../styles/globals.css';

export const metadata = {
  title: 'Secure Supabase Auth',
  description: 'Login/signup system using Supabase + Next.js + FastAPI backend',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
