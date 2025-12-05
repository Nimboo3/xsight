'use client';

import { NavMenu, TitleBar } from '@shopify/app-bridge-react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import '@shopify/polaris/build/esm/styles.css';

function AppNavigation() {
  return (
    <>
      <TitleBar title="Xeno FDE Platform" />
      <NavMenu>
        <a href="/app" rel="home">Home</a>
        <a href="/app/customers">Customers</a>
        <a href="/app/segments">Segments</a>
        <a href="/app/analytics">Analytics</a>
      </NavMenu>
    </>
  );
}

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-container">
      <AppNavigation />
      <main className="app-main">
        {children}
      </main>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AppLayoutContent>{children}</AppLayoutContent>
    </Suspense>
  );
}
