'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/client';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleSignup = async () => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert('Signup failed: ' + error.message);
    else {
      alert('Signup successful! Please login.');
      router.replace('/login');
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
        <h1 className="text-2xl font-bold mb-6 text-center">Sign Up</h1>
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
          onClick={handleSignup}
          className="w-full bg-black text-white py-3 rounded"
        >
          Sign Up
        </button>
        <p className="mt-4 text-center text-sm">
          Already have an account?{' '}
          <span
            className="underline cursor-pointer text-blue-600"
            onClick={() => router.push('/login')}
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
}
