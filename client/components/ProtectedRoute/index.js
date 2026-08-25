import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import useAuthStore from '../../store/authStore';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, token, fetchMe } = useAuthStore();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const localToken = typeof window !== 'undefined' ? localStorage.getItem('agentflow_token') : null;
    if (!isAuthenticated && !token && !localToken) {
      router.replace('/login');
    } else {
      setChecking(false);
    }
  }, [isAuthenticated, token, router]);

  if (checking) return null;
  return children;
}
