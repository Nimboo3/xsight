'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { LogIn, Loader2, AlertCircle, ArrowRight, Mail, Lock, ArrowLeft, Sparkles, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  const [isDemoLoading, setIsDemoLoading] = useState(false);

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
      const response = await fetch('/api/auth/login', {
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
        router.push(data.redirect || (data.tenant ? '/app' : '/app/connect'));
      } else {
        setError(data.error || 'Invalid email or password');
      }
    } catch (err) {
      setError('Failed to log in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsDemoLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demo: true }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        router.push('/app');
      } else {
        setError('Demo login failed. Please try again.');
      }
    } catch (err) {
      setError('Demo login failed. Please try again.');
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header with Back Button */}
      <header className="p-4 sm:p-6">
        <div className="max-w-md mx-auto w-full flex items-center justify-between">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span className="text-sm">Back to Home</span>
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
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
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 text-primary mb-4">
              <LogIn className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome back</h1>
            <p className="text-slate-400">
              Sign in to your ShopSight account
            </p>
          </div>

          {/* Login Form */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-purple-500/20 to-cyan-500/20 rounded-2xl blur-xl" />
            <div className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      autoComplete="email"
                      disabled={isLoading}
                      className="pl-11 h-12 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-primary focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-300">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      disabled={isLoading}
                      className="pl-11 h-12 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-primary focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-base font-medium shadow-lg shadow-primary/25"
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
                  <div className="w-full border-t border-slate-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-slate-900 px-2 text-slate-500">New to ShopSight?</span>
                </div>
              </div>

              {/* Sign Up Link */}
              <Link href="/auth/signup">
                <Button 
                  variant="outline" 
                  className="w-full h-12 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-600"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Create an account
                </Button>
              </Link>

              {/* Demo Button */}
              <Button 
                type="button"
                variant="ghost"
                onClick={handleDemoLogin}
                disabled={isDemoLoading || isLoading}
                className="w-full h-12 mt-3 text-slate-400 hover:text-white hover:bg-slate-800/50"
              >
                {isDemoLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading demo...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Try Demo Mode
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-slate-500 mt-6">
            By signing in, you agree to our{' '}
            <a
              href="https://github.com/Nimboo3/dshop#readme"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white underline"
            >
              Terms
            </a>{' '}
            and{' '}
            <a
              href="https://github.com/Nimboo3/dshop#readme"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white underline"
            >
              Privacy Policy
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
