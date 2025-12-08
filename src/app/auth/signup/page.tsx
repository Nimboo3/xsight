'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, Loader2, AlertCircle, ArrowRight, Mail, Lock, User, ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { API_BASE, AUTH_PREFIX } from '@/lib/api-config';
import { cn } from '@/lib/utils';

const AUTH_API = `${API_BASE}${AUTH_PREFIX}`;

const benefits = [
  'RFM analytics for customer insights',
  'Smart segmentation with visual builder',
  'Real-time Shopify data sync',
  'Revenue trends & cohort analysis',
];

export default function SignupPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (error) setError('');
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validate()) return;

    setIsLoading(true);

    try {
      const response = await fetch(`${AUTH_API}/signup`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.toLowerCase().trim(),
          password: formData.password,
          name: formData.name.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        router.push('/connect');
      } else {
        setError(data.error || 'Failed to create account');
        if (data.details) {
          const newFieldErrors: Record<string, string> = {};
          data.details.forEach((d: { field: string; message: string }) => {
            newFieldErrors[d.field] = d.message;
          });
          setFieldErrors(newFieldErrors);
        }
      }
    } catch (err) {
      setError('Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative">
      {/* Background Image */}
      <div className="fixed inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/bg-signup.webp)' }}
        />
      </div>
      
      {/* Overlay */}
      <div className="fixed inset-0 z-[1] bg-gradient-to-b from-slate-50/90 to-white/85" />
      
      {/* Animated Gradients */}
      <div className="fixed inset-0 z-[2] opacity-50">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl animate-float-delayed" />
      </div>
      
      {/* Pattern */}
      <div className="fixed inset-0 z-[3]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col lg:flex-row min-h-screen">

      {/* Header */}
      <header className="p-4 sm:p-6">
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
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
      <main className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-5xl">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            {/* Left Side - Benefits */}
            <div className="hidden lg:block">
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-3">
                    Start understanding your customers today
                  </h2>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    Join merchants who use XSight to turn their Shopify data into actionable customer insights.
                  </p>
                </div>

                {/* Benefits List */}
                <div className="space-y-4">
                  {benefits.map((benefit, i) => (
                    <div 
                      key={i}
                      className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 shadow-sm"
                    >
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Check className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-gray-700 font-medium">{benefit}</span>
                    </div>
                  ))}
                </div>

                {/* Social Proof */}
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-gray-600 text-sm italic">
                    "XSight helped us identify our champion customers and reduce churn by 23%."
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">SM</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Sarah Mitchell</p>
                      <p className="text-xs text-gray-500">E-commerce Manager</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Form */}
            <div>
              {/* Title */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 text-primary mb-4">
                  <UserPlus className="h-7 w-7" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">Create your account</h1>
                <p className="text-gray-600">
                  Get started in less than 2 minutes
                </p>
              </div>

              {/* Form Card */}
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 via-violet-500/10 to-primary/10 rounded-2xl blur-xl opacity-50" />
                <div className="relative bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-xl shadow-gray-100/50">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name Field */}
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-gray-700 font-medium">
                        Name <span className="text-gray-400 font-normal">(optional)</span>
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="John Doe"
                          autoComplete="name"
                          disabled={isLoading}
                          className="pl-11 h-11 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-primary focus:ring-primary"
                        />
                      </div>
                    </div>

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
                          className={cn(
                            "pl-11 h-11 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-primary focus:ring-primary",
                            fieldErrors.email && "border-red-300 focus:border-red-500 focus:ring-red-500"
                          )}
                        />
                      </div>
                      {fieldErrors.email && (
                        <p className="text-sm text-red-600">{fieldErrors.email}</p>
                      )}
                    </div>

                    {/* Password Field */}
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="password"
                          name="password"
                          type="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Min. 8 characters"
                          autoComplete="new-password"
                          disabled={isLoading}
                          className={cn(
                            "pl-11 h-11 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-primary focus:ring-primary",
                            fieldErrors.password && "border-red-300 focus:border-red-500 focus:ring-red-500"
                          )}
                        />
                      </div>
                      {fieldErrors.password && (
                        <p className="text-sm text-red-600">{fieldErrors.password}</p>
                      )}
                    </div>

                    {/* Confirm Password Field */}
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="Confirm your password"
                          autoComplete="new-password"
                          disabled={isLoading}
                          className={cn(
                            "pl-11 h-11 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-primary focus:ring-primary",
                            fieldErrors.confirmPassword && "border-red-300 focus:border-red-500 focus:ring-red-500"
                          )}
                        />
                      </div>
                      {fieldErrors.confirmPassword && (
                        <p className="text-sm text-red-600">{fieldErrors.confirmPassword}</p>
                      )}
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
                      className="w-full h-11 bg-primary hover:bg-primary/90 text-base font-medium shadow-lg shadow-primary/20"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        <>
                          Create account
                          <ArrowRight className="h-5 w-5 ml-2" />
                        </>
                      )}
                    </Button>
                  </form>

                  {/* Divider */}
                  <div className="relative my-5">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-gray-500">Already have an account?</span>
                    </div>
                  </div>

                  {/* Sign In Link */}
                  <Link href="/auth/login">
                    <Button 
                      variant="outline" 
                      className="w-full h-11 border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300"
                    >
                      Sign in instead
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Footer */}
              <p className="text-center text-xs text-gray-500 mt-6">
                By signing up, you agree to our{' '}
                <Link href="/terms" className="text-gray-700 hover:text-primary underline">
                  Terms
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-gray-700 hover:text-primary underline">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
      </div>
    </div>
  );
}
