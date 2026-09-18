'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/features/auth/hooks/use-auth';

export default function LandingPageAuthRedirect() {
  const { role, loading } = useAuth();
  const router = useRouter();

  // Silent session validation redirect
  useEffect(() => {
    if (!loading && role) {
      if (role === 'admin') {
        router.replace('/admin');
      } else if (role === 'verified_historian') {
        router.replace('/dashboard');
      } else {
        router.replace('/explore');
      }
    }
  }, [role, loading, router]);

  return null;
}
