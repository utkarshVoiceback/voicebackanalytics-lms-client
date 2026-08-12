'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role === 'super-admin') router.replace('/super-admin');
    else if (user.role === 'admin') router.replace('/admin');
    else router.replace('/learner');
  }, [user, loading, router]);

  return loading ? <div className="page-loading">Loading...</div> : null;
}
