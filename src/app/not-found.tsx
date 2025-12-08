'use client';

import Link from 'next/link';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col items-center justify-center p-6">
      {/* Background Pattern */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      <div className="text-center max-w-md">
        {/* 404 Number */}
        <div className="relative mb-8">
          <span className="text-[180px] font-bold leading-none text-primary/10 select-none">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-24 w-24 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Search className="h-12 w-12 text-primary" />
            </div>
          </div>
        </div>

        {/* Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Page not found
        </h1>
        <p className="text-gray-600 mb-8 leading-relaxed">
          Sorry, we couldn't find the page you're looking for. 
          It might have been moved or doesn't exist.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => window.history.back()}
            variant="outline"
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
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
    </div>
  );
}
