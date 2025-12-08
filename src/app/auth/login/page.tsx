'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { LogIn, Loader2, AlertCircle, ArrowRight, Mail, Lock, ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { API_BASE, AUTH_PREFIX } from '@/lib/api-config';

const AUTH_API = `${API_BASE}${AUTH_PREFIX}`;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/app';
  const errorParam = searchParams.get('error');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState(
    errorParam === 'auth_required' ? 'Please log in to continue' : ''
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please enter your email and password');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${AUTH_API}/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.toLowerCase().trim(),
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const redirectTo = data.redirect || (data.tenant ? '/app' : '/connect');
        // Use window.location for a full page reload to ensure cookies are applied
        window.location.href = redirectTo;
      } else {
        setError(data.error || 'Invalid email or password');
        setIsLoading(false);
      }
    } catch (err) {
      setError('Failed to log in. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background Image */}
      <div className="fixed inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/bg-login.webp)' }}
        />
      </div>
      
      {/* Overlay */}
      <div className="fixed inset-0 z-[1] bg-gradient-to-b from-slate-50/90 to-white/85" />
      
      {/* Animated Gradients */}
      <div className="fixed inset-0 z-[2] opacity-50">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-3xl animate-float-delayed" />
      </div>
      
      {/* Pattern */}
      <div className="fixed inset-0 z-[3]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">

      {/* Header */}
      <header className="p-4 sm:p-6">
        <div className="max-w-md mx-auto w-full flex items-center justify-between">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-white font-bold text-sm">S</span>
            </div>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 text-primary mb-4">
              <LogIn className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Welcome back</h1>
            <p className="text-gray-600">
              Sign in to your XSight account
            </p>
          </div>

          {/* Login Form */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 via-violet-500/10 to-primary/10 rounded-2xl blur-xl opacity-50" />
            <div className="relative bg-white border border-gray-200 rounded-2xl p-8 shadow-xl shadow-gray-100/50">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      autoComplete="email"
                      disabled={isLoading}
                      className="pl-11 h-12 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-primary focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
                    <button 
                      type="button"
                      onClick={() => alert('Password reset functionality coming soon!')}
                      className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      disabled={isLoading}
                      className="pl-11 h-12 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-primary focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-base font-medium shadow-lg shadow-primary/20"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </>
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">New to XSight?</span>
                </div>
              </div>

              {/* Sign Up Link */}
              <Link href="/auth/signup">
                <Button 
                  variant="outline" 
                  className="w-full h-12 border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Create an account
                </Button>
              </Link>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-500 mt-6">
            By signing in, you agree to our{' '}
            <Link href="/terms" className="text-gray-700 hover:text-primary underline">
              Terms
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-gray-700 hover:text-primary underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </main>
      </div>
    </div>
  );
}
