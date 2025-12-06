'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Store, ArrowRight, Loader2, ArrowLeft, Check, Zap, Shield, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function ConnectStorePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [shopDomain, setShopDomain] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

    setIsLoading(true);

    try {
      const normalizedDomain = normalizeShopDomain(shopDomain);
      window.location.href = `${API_BASE}/api/shopify/auth?shop=${encodeURIComponent(normalizedDomain)}`;
    } catch (err) {
      setError('Failed to initiate connection');
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  const features = [
    { icon: Zap, text: 'Automatic data sync' },
    { icon: Shield, text: 'Secure OAuth connection' },
    { icon: RefreshCw, text: 'Real-time updates' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <header className="p-4 sm:p-6">
        <div className="max-w-lg mx-auto w-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <span className="text-white font-bold">S</span>
            </div>
            <span className="font-bold text-lg">ShopSight</span>
          </Link>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout}
            className="text-slate-400 hover:text-white hover:bg-white/10"
          >
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          {/* Welcome Message */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/20 text-green-400 mb-6">
              <Store className="h-10 w-10" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Connect Your Store</h1>
            <p className="text-slate-400">
              Welcome{user?.name ? `, ${user.name}` : ''}! Link your Shopify store to start analyzing your customer data.
            </p>
          </div>

          {/* Connect Form */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-cyan-500/20 rounded-2xl blur-xl" />
            <div className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8">
              <form onSubmit={handleConnect} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="shopDomain" className="text-slate-300">Store Domain</Label>
                  <div className="relative">
                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                    <Input
                      id="shopDomain"
                      type="text"
                      value={shopDomain}
                      onChange={(e) => {
                        setShopDomain(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="your-store"
                      disabled={isLoading}
                      className="pl-11 pr-32 h-12 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-green-500 focus:ring-green-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                      .myshopify.com
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Enter just the store name (e.g., &ldquo;my-store&rdquo;) or the full domain
                  </p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    <span>{error}</span>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-base font-medium shadow-lg shadow-green-500/25"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      Connect Shopify Store
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </>
                  )}
                </Button>
              </form>

              {/* Features */}
              <div className="mt-6 pt-6 border-t border-slate-800">
                <p className="text-sm text-slate-400 mb-4 text-center">We&apos;ll request access to:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {['Orders', 'Customers', 'Products'].map((scope) => (
                    <span 
                      key={scope}
                      className="px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50 text-xs text-slate-300"
                    >
                      {scope}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            {features.map((feature, i) => (
              <div key={i} className="text-center">
                <div className="h-12 w-12 mx-auto rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center mb-2">
                  <feature.icon className="h-5 w-5 text-green-400" />
                </div>
                <p className="text-xs text-slate-400">{feature.text}</p>
              </div>
            ))}
          </div>

          {/* Back Link */}
          <div className="mt-8 text-center">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors group"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
