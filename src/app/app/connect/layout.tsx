'use client';

import { Suspense } from 'react';
import { AuthGuard } from '@/components/auth';

export default function ConnectLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    }>
      <AuthGuard loginUrl="/auth/login" requireStore={false}>
        {children}
      </AuthGuard>
    </Suspense>
  );
}
