'use client';

import { useState } from 'react';
import { Store, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

export default function LoginPage() {
  const [shop, setShop] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!shop) {
      setError('Please enter your shop domain to log in');
      return;
    }

    // Validate shop domain
    const shopDomain = shop.includes('.myshopify.com')
      ? shop.toLowerCase().trim()
      : `${shop.toLowerCase().trim()}.myshopify.com`;

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shop: shopDomain }),
      });

      const data = await response.json();

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else if (data.error) {
        setError(data.error);
        setIsLoading(false);
      }
    } catch (err) {
      setError('Failed to log in. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary mb-4">
            <Store className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Xeno CRM</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Customer data platform for Shopify stores
          </p>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Connect your store</CardTitle>
            <CardDescription>
              Enter your Shopify store domain to get started
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="shop">Shop domain</Label>
                <div className="relative">
                  <Input
                    id="shop"
                    name="shop"
                    type="text"
                    value={shop}
                    onChange={(e) => setShop(e.target.value)}
                    placeholder="your-store"
                    autoComplete="on"
                    disabled={isLoading}
                    className="pr-32"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    .myshopify.com
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter just your store name, e.g., &quot;your-store&quot;
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    Connect Store
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          By connecting, you agree to our{' '}
          <a href="#" className="underline hover:text-foreground">Terms of Service</a>
          {' '}and{' '}
          <a href="#" className="underline hover:text-foreground">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
