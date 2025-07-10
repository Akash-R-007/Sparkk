'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', // ✅ Ensures proper JSON parsing on the server
      },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      router.replace('/dashboard');
    } else {
      try {
        const { error } = await res.json();
        alert('Login failed: ' + error);
      } catch {
        alert('Login failed: Unexpected error occurred.');
      }
    }
  };

  useEffect(() => {
  history.pushState(null, '', location.href);
  const handlePopState = () => {
    history.pushState(null, '', location.href);
  };
  window.addEventListener('popstate', handlePopState);
  return () => window.removeEventListener('popstate', handlePopState);
}, []);


  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-black">
      <div className="border border-black p-8 rounded-lg shadow w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>
        <input
          className="w-full p-3 mb-4 border border-black rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
        <input
          type="password"
          className="w-full p-3 mb-4 border border-black rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        <button
          onClick={handleLogin}
          className="w-full bg-black text-white py-3 rounded"
        >
          Login
        </button>
        <p className="mt-4 text-center text-sm">
          Don't have an account?{' '}
          <span
            className="underline cursor-pointer text-blue-600"
            onClick={() => router.push('/signup')}
          >
            Sign up
          </span>
        </p>
      </div>
    </div>
  );
}