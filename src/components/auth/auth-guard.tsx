'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: ReactNode;
  /** URL to redirect to if not authenticated */
  loginUrl?: string;
  /** Whether to require a connected store (default: true) */
  requireStore?: boolean;
  /** Component to show while checking auth */
  loadingComponent?: ReactNode;
}

/**
 * Loading spinner component
 */
function DefaultLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Checking authentication...</p>
      </div>
    </div>
  );
}

/**
 * Auth Guard Component
 * 
 * Wraps protected routes and redirects to login if user is not authenticated.
 * Redirects to connect page if user hasn't connected a store (when requireStore is true).
 * Shows a loading state while checking authentication.
 * 
 * Usage:
 * ```tsx
 * <AuthGuard>
 *   <ProtectedPage />
 * </AuthGuard>
 * 
 * // Don't require store connection
 * <AuthGuard requireStore={false}>
 *   <ConnectStorePage />
 * </AuthGuard>
 * ```
 */
export function AuthGuard({ 
  children, 
  loginUrl = '/auth/login',
  requireStore = true,
  loadingComponent,
}: AuthGuardProps) {
  const { isAuthenticated, isLoading, hasStore } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't redirect while still loading
    if (isLoading) return;

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      const returnUrl = encodeURIComponent(pathname || '/app');
      router.push(`${loginUrl}?returnUrl=${returnUrl}`);
      return;
    }

    // Redirect to connect page if store required but not connected
    if (requireStore && !hasStore && pathname !== '/connect') {
      router.push('/connect');
      return;
    }
  }, [isAuthenticated, isLoading, hasStore, requireStore, router, pathname, loginUrl]);

  // Show loading state while checking auth
  if (isLoading) {
    return <>{loadingComponent || <DefaultLoading />}</>;
  }

  // If not authenticated, we're about to redirect - show loading
  if (!isAuthenticated) {
    return <>{loadingComponent || <DefaultLoading />}</>;
  }

  // If store required but not connected, we're about to redirect
  if (requireStore && !hasStore) {
    return <>{loadingComponent || <DefaultLoading />}</>;
  }

  // Authenticated and (store connected or not required) - render children
  return <>{children}</>;
}

/**
 * Higher-order component version of AuthGuard
 * 
 * Usage:
 * ```tsx
 * export default withAuthGuard(ProtectedPage);
 * ```
 */
export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<AuthGuardProps, 'children'>
) {
  return function AuthGuardedComponent(props: P) {
    return (
      <AuthGuard {...options}>
        <Component {...props} />
      </AuthGuard>
    );
  };
}
