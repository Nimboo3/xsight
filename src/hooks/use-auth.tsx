'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { API_BASE, AUTH_PREFIX } from '@/lib/api-config';

// API configuration from centralized config
const AUTH_API = `${API_BASE}${AUTH_PREFIX}`;

/**
 * User information from authenticated session
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
}

/**
 * Tenant information from authenticated session
 */
export interface AuthTenant {
  id: string;
  shopDomain: string;
  shopName: string | null;
}

/**
 * Authentication state
 */
export interface AuthState {
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
  /** Whether auth status is being checked */
  isLoading: boolean;
  /** User info if authenticated */
  user: AuthUser | null;
  /** Tenant info if authenticated and store connected */
  tenant: AuthTenant | null;
  /** Whether the user has connected a Shopify store */
  hasStore: boolean;
  /** Error message if auth check failed */
  error: string | null;
}

/**
 * Auth context value with state and methods
 */
export interface AuthContextValue extends AuthState {
  /** Login with email and password */
  login: (email: string, password: string) => Promise<{ success: boolean; redirect: string; error?: string }>;
  /** Signup with name, email, and password */
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  /** Logout and clear session */
  logout: () => Promise<void>;
  /** Refresh auth status */
  refresh: () => Promise<void>;
  /** Get headers for API requests */
  getAuthHeaders: () => Promise<Record<string, string>>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication Provider
 * 
 * Manages authentication state for the XSight application.
 * Users authenticate with email/password, then connect their Shopify store.
 * 
 * Usage:
 * ```tsx
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 * ```
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    tenant: null,
    hasStore: false,
    error: null,
  });

  /**
   * Check current authentication status
   */
  const checkAuth = useCallback(async () => {
    try {
      setState(s => ({ ...s, isLoading: true, error: null }));

      const response = await fetch(`${AUTH_API}/me`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to check auth status');
      }

      const data = await response.json();

      setState(s => ({
        ...s,
        isAuthenticated: data.authenticated,
        user: data.user || null,
        tenant: data.tenant || null,
        hasStore: !!data.tenant,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Auth check failed:', error);
      setState(s => ({
        ...s,
        isAuthenticated: false,
        user: null,
        tenant: null,
        hasStore: false,
        isLoading: false,
        error: 'Failed to check authentication status',
      }));
    }
  }, []);

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  /**
   * Login with email and password
   * Returns redirect URL based on whether user has connected a store
   */
  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await fetch(`${AUTH_API}/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Re-check auth to update state
        await checkAuth();
        return {
          success: true,
          redirect: data.hasTenant ? '/app' : '/connect',
        };
      }

      return {
        success: false,
        redirect: '/auth/login',
        error: data.error || 'Login failed',
      };
    } catch (error) {
      console.error('Login failed:', error);
      return {
        success: false,
        redirect: '/auth/login',
        error: 'Login failed. Please try again.',
      };
    }
  }, [checkAuth]);

  /**
   * Signup with name, email, and password
   */
  const signup = useCallback(async (name: string, email: string, password: string) => {
    try {
      const response = await fetch(`${AUTH_API}/signup`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Re-check auth to update state (user is now logged in)
        await checkAuth();
        return { success: true };
      }

      return {
        success: false,
        error: data.error || 'Signup failed',
      };
    } catch (error) {
      console.error('Signup failed:', error);
      return {
        success: false,
        error: 'Signup failed. Please try again.',
      };
    }
  }, [checkAuth]);

  /**
   * Logout and clear session
   */
  const logout = useCallback(async () => {
    try {
      await fetch(`${AUTH_API}/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      setState(s => ({
        ...s,
        isAuthenticated: false,
        user: null,
        tenant: null,
        hasStore: false,
      }));
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, []);

  /**
   * Get headers for authenticated API requests
   * 
   * The JWT cookie is sent automatically via credentials: 'include'
   */
  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    return {
      'Content-Type': 'application/json',
    };
  }, []);

  const value: AuthContextValue = {
    ...state,
    login,
    signup,
    logout,
    refresh: checkAuth,
    getAuthHeaders,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access authentication context
 * 
 * @throws Error if used outside AuthProvider
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

/**
 * Hook that returns true only when auth check is complete and user is authenticated
 */
export function useIsAuthenticated(): boolean {
  const { isAuthenticated, isLoading } = useAuth();
  return !isLoading && isAuthenticated;
}

/**
 * Hook that returns the authenticated user or null
 */
export function useUser(): AuthUser | null {
  const { user } = useAuth();
  return user;
}

/**
 * Hook that returns the authenticated tenant or null
 */
export function useTenant(): AuthTenant | null {
  const { tenant } = useAuth();
  return tenant;
}

/**
 * Hook that returns whether the user has connected a Shopify store
 */
export function useHasStore(): boolean {
  const { hasStore, isLoading } = useAuth();
  return !isLoading && hasStore;
}
