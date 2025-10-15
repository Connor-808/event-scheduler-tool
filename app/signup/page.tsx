'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PhoneAuth } from '@/components/PhoneAuth';
import { getCurrentUser } from '@/lib/auth';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if already logged in
    const checkAuth = async () => {
      const user = await getCurrentUser();
      if (user) {
        router.push('/dashboard');
      }
    };
    checkAuth();
  }, [router]);

  const handleSuccess = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <PhoneAuth onSuccess={handleSuccess} mode="signup" />
        
        <div className="mt-8 text-center space-y-4">
          <p className="text-sm text-foreground/60">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:underline font-semibold">
              Sign in
            </Link>
          </p>
          
          <div className="pt-4 border-t border-foreground/10">
            <p className="text-sm text-foreground/60 mb-2">
              Just voting on an event?
            </p>
            <Link 
              href="/" 
              className="text-blue-600 hover:underline font-semibold text-sm"
            >
              No signup required →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

