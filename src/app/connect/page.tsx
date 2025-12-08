'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Store, ArrowRight, Loader2, ArrowLeft, Zap, Shield, RefreshCw, LogOut, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';

// For Shopify OAuth, we MUST use the ngrok URL (HTTPS required)
const SHOPIFY_APP_URL = process.env.NEXT_PUBLIC_SHOPIFY_APP_URL || 'http://localhost:3000';

export default function ConnectStorePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, hasStore, logout } = useAuth();
  const [shopDomain, setShopDomain] = useState('');
  const [error, setError] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login?returnUrl=/connect');
    }
  }, [isLoading, isAuthenticated, router]);

  // Redirect to app if already has store
  useEffect(() => {
    if (!isLoading && isAuthenticated && hasStore) {
      router.push('/app');
    }
  }, [isLoading, isAuthenticated, hasStore, router]);

  const normalizeShopDomain = (input: string): string => {
    let domain = input.trim().toLowerCase();
    domain = domain.replace(/^https?:\/\//, '');
    domain = domain.replace(/\/$/, '');
    if (!domain.includes('.')) {
      domain = `${domain}.myshopify.com`;
    }
    return domain;
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!shopDomain.trim()) {
      setError('Please enter your shop domain');
      return;
    }

    setIsConnecting(true);

    try {
      const normalizedDomain = normalizeShopDomain(shopDomain);
      
      const response = await fetch('/api/auth/oauth-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ shop: normalizedDomain }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to initiate connection');
        setIsConnecting(false);
        return;
      }
      
      const { token } = await response.json();
      
      // Redirect to OAuth flow
      window.location.href = `${SHOPIFY_APP_URL}/auth?shop=${encodeURIComponent(normalizedDomain)}&token=${encodeURIComponent(token)}`;
    } catch (err) {
      setError('Failed to initiate connection');
      setIsConnecting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  const features = [
    { icon: Zap, title: 'Automatic Sync', text: 'Customers and orders sync in real-time' },
    { icon: Shield, title: 'Secure OAuth', text: 'Industry-standard Shopify authentication' },
    { icon: RefreshCw, title: 'Webhook Updates', text: 'Instant updates when data changes' },
  ];

  const steps = [
    'Enter your store domain',
    'Authorize XSight access',
    'Start analyzing your customers',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-gray-900">
      {/* Background Pattern */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="text-white font-bold">S</span>
              </div>
              <span className="font-bold text-lg text-gray-900">XSight</span>
            </Link>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 hidden sm:block">
                {user?.email}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Info */}
          <div className="space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <Store className="h-4 w-4" />
                Almost there!
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 text-gray-900">
                Connect Your
                <span className="block text-primary">
                  Shopify Store
                </span>
              </h1>
              <p className="text-lg text-gray-600">
                Welcome{user?.name ? `, ${user.name}` : ''}! Link your store to unlock powerful customer insights, 
                RFM segmentation, and data-driven analytics.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              {features.map((feature, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-200 shadow-sm">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{feature.title}</p>
                    <p className="text-sm text-gray-500">{feature.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Trust Signals */}
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>256-bit encryption</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Official Shopify Partner</span>
              </div>
            </div>
          </div>

          {/* Right Column - Form */}
          <div>
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 via-emerald-500/10 to-primary/10 rounded-2xl blur-xl opacity-50" />
              <div className="relative bg-white border border-gray-200 rounded-2xl p-8 shadow-xl">
                {/* Steps */}
                <div className="mb-8">
                  <h2 className="font-semibold text-gray-900 mb-4">How it works</h2>
                  <div className="space-y-3">
                    {steps.map((step, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {i + 1}
                        </div>
                        <span className="text-sm text-gray-600">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleConnect} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="shop" className="text-gray-700 font-medium">Store URL</Label>
                    <div className="relative">
                      <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="shop"
                        type="text"
                        value={shopDomain}
                        onChange={(e) => {
                          setShopDomain(e.target.value);
                          setError('');
                        }}
                        placeholder="your-store.myshopify.com"
                        className="pl-11 h-12 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-primary focus:ring-primary"
                        disabled={isConnecting}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Enter your store name (e.g., "my-store") or full domain
                    </p>
                    {error && (
                      <p className="text-sm text-red-600 mt-2">{error}</p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-primary hover:bg-primary/90 text-base font-medium shadow-lg shadow-primary/20"
                    disabled={isConnecting}
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        Connect Store
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </>
                    )}
                  </Button>
                </form>

                {/* Privacy Note */}
                <p className="text-xs text-gray-500 text-center mt-6">
                  By connecting, you agree to our{' '}
                  <Link href="/terms" className="text-primary hover:underline">Terms</Link>
                  {' '}and{' '}
                  <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                </p>
              </div>
            </div>

            {/* Help */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Need help?{' '}
                <a 
                  href="https://github.com/Nimboo3/dshop#readme" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  View documentation
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
