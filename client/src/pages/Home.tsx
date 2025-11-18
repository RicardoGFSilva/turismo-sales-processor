import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation } from 'wouter';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { getLoginUrl } from '@/const';

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated && user) {
        // Redirect authenticated users to dashboard
        setLocation('/dashboard');
      } else {
        // Redirect unauthenticated users to login
        window.location.href = getLoginUrl();
      }
    }
  }, [loading, isAuthenticated, user, setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a1930] to-[#1a2a4a]">
      <div className="text-center">
        <Loader2 className="animate-spin h-12 w-12 text-[#ffc107] mx-auto" />
        <p className="text-white mt-4">Loading...</p>
      </div>
    </div>
  );
}
