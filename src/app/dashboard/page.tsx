// proj/src/app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client'; // Your Supabase client
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface Item {
  id: string; // Assuming Supabase UUIDs
  name: string;
  description: string | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null); // Supabase session
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');

  // Check session on component mount and listen for auth changes
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (!session) {
        router.push('/login'); // Redirect if no session
      } else {
        fetchItems(); // Fetch items only if logged in
      }
      setLoading(false);
    };

    checkSession();

    // Listen for auth state changes (e.g., after login, logout)
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (!newSession) {
        router.push('/login'); // Redirect to login on logout
      } else {
        fetchItems(); // Re-fetch items on successful login/session refresh
      }
    });

    return () => {
      authListener.subscription.unsubscribe(); // Cleanup listener on component unmount
    };
  }, [router]); // Dependency array includes router to avoid lint warnings

  const fetchItems = async () => {
    try {
      // This is where your Next.js frontend calls your Python API
      const response = await fetch('http://localhost:8000/api/items');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setItems(data);
    } catch (e: any) {
      setError(`Failed to fetch items: ${e.message}`);
    }
  };

  const createItem = async () => {
    if (!newItemName) {
      setError('Item name cannot be empty.');
      return;
    }
    try {
      // This is where your Next.js frontend calls your Python API to create an item
      const response = await fetch('http://localhost:8000/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // If your Python API needed the user's token for RLS bypass or verification,
          // you would add: 'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ name: newItemName, description: newItemDescription }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const newItem = await response.json();
      setItems((prevItems) => [...prevItems, newItem]); // Add new item to state
      setNewItemName(''); // Clear input fields
      setNewItemDescription('');
      setError(null); // Clear any previous errors
    } catch (e: any) {
      setError(`Failed to create item: ${e.message}`);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError(signOutError.message);
    } else {
      router.push('/login'); // Redirect to login after successful logout
    }
    setLoading(false);
  };

  if (loading) return <p>Loading dashboard...</p>;
  if (!session) return null; // Should redirect by useEffect, but a safeguard for rendering

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button onClick={handleLogout} disabled={loading}>
          Logout
        </Button>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Create New Item</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <Input
              placeholder="Item Name"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
            />
            <Input
              placeholder="Item Description (Optional)"
              value={newItemDescription}
              onChange={(e) => setNewItemDescription(e.target.value)}
            />
            <Button onClick={createItem}>Add Item</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Items</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p>No items found. Create one above!</p>
          ) : (
            <ul className="grid gap-2">
              {items.map((item) => (
                <li key={item.id} className="border p-2 rounded">
                  <h3 className="font-semibold">{item.name}</h3>
                  {item.description && <p className="text-sm text-gray-600">{item.description}</p>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}