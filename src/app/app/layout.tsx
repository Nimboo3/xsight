'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuth, useTenant } from '@/hooks/use-auth';
import { AuthGuard } from '@/components/auth';
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Target,
  BarChart3,
  LogOut,
  Store,
  Menu,
  X,
  Home,
  ChevronDown,
  HelpCircle,
  ExternalLink,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/app', label: 'Overview', icon: LayoutDashboard },
  { href: '/app/customers', label: 'Customers', icon: Users },
  { href: '/app/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/app/segments', label: 'Segments', icon: Target },
  { href: '/app/analytics', label: 'Analytics', icon: BarChart3 },
];

function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const tenant = useTenant();

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  return (
    <aside className="flex h-full w-64 flex-col bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
        <Link href="/app" className="flex items-center gap-2.5 font-semibold text-gray-900">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-white font-bold">S</span>
          </div>
          <span className="text-lg">XSight</span>
        </Link>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="md:hidden text-gray-500 hover:text-gray-900">
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Store Info */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200">
          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Store className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {tenant?.shopName || tenant?.shopDomain?.split('.')[0] || 'My Store'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {tenant?.shopDomain || 'No store connected'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/app' && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-gray-200 p-4 space-y-3">
        {/* User Profile */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200">
          <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">
              {user?.name?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.email}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Link href="/app" className="flex-1">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300"
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </Link>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLogout}
            className="flex-1 border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </aside>
  );
}

function MobileHeader({ onMenuClick }: { onMenuClick: () => void }) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const tenant = useTenant();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
    router.push('/auth/login');
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-gray-200 bg-white/95 backdrop-blur-sm px-4 md:hidden">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onMenuClick} className="text-gray-500 hover:text-gray-900">
          <Menu className="h-5 w-5" />
        </Button>
        <Link href="/app" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
        </Link>
      </div>

      {/* User Menu */}
      <div className="relative">
        <Button 
          variant="ghost" 
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          onClick={() => setUserMenuOpen(!userMenuOpen)}
        >
          <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <span className="text-xs font-medium text-primary">
              {user?.name?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <ChevronDown className={cn('h-4 w-4 transition-transform', userMenuOpen && 'rotate-180')} />
        </Button>

        {/* Dropdown Menu */}
        {userMenuOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setUserMenuOpen(false)} 
            />
            <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-gray-200 bg-white shadow-xl z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              
              <div className="px-3 py-2 border-b border-gray-100">
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <Store className="h-4 w-4" />
                  <span className="truncate">{tenant?.shopDomain || 'No store connected'}</span>
                </div>
              </div>

              <div className="py-1">
                <Link 
                  href="/app" 
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                <a 
                  href="https://github.com/Nimboo3/dshop#readme" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <HelpCircle className="h-4 w-4" />
                  Help & Support
                  <ExternalLink className="h-3 w-3 ml-auto text-gray-400" />
                </a>
              </div>

              <div className="border-t border-gray-100 pt-1">
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 text-gray-900 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div 
            className="absolute inset-0 bg-black/20 backdrop-blur-sm" 
            onClick={() => setSidebarOpen(false)} 
          />
          <div className="absolute inset-y-0 left-0 w-64 animate-in slide-in-from-left duration-300">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <MobileHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center animate-pulse">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <p className="text-gray-500 animate-pulse">Loading...</p>
        </div>
      </div>
    }>
      <AuthGuard loginUrl="/auth/login">
        <AppLayoutContent>{children}</AppLayoutContent>
      </AuthGuard>
    </Suspense>
  );
}
