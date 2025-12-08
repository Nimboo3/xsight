'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-md">
          {/* Error Icon */}
          <div className="relative mb-8">
            <div className="h-24 w-24 mx-auto rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
              <AlertTriangle className="h-12 w-12 text-red-500" />
            </div>
          </div>

          {/* Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Something went wrong
          </h1>
          <p className="text-gray-600 mb-8 leading-relaxed">
            We encountered an unexpected error. Our team has been notified 
            and we're working to fix the issue.
          </p>

          {/* Error Details (dev only) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-8 p-4 bg-gray-100 rounded-lg text-left overflow-x-auto">
              <p className="text-xs font-mono text-gray-600 break-all">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs font-mono text-gray-400 mt-2">
                  Digest: {error.digest}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={reset}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            <Link href="/">
              <Button className="gap-2 w-full sm:w-auto">
                <Home className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="absolute bottom-6 text-sm text-gray-400">
          XSight • Customer Intelligence Platform
        </p>
      </body>
    </html>
  );
}
