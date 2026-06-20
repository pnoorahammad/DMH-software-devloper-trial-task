'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuth = pathname === '/login' || pathname === '/signup';

  return (
    <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
      <div style={{ background: 'var(--surface-base)', color: 'var(--text-primary)', minHeight: '100vh' }}>
        {isAuth ? (
          <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {children}
          </main>
        ) : (
          <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
            <Sidebar />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
              <Header />
              <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
                <div style={{ maxWidth: 1440, margin: '0 auto', padding: '1.5rem' }}>
                  {children}
                </div>
              </main>
            </div>
          </div>
        )}
      </div>
      <Toaster
        position="bottom-right"
        gutter={8}
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--surface-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--surface-border-light)',
            borderRadius: 'var(--radius-lg)',
            fontSize: '.8125rem',
            fontWeight: 500,
            boxShadow: 'var(--shadow-lg)',
            padding: '.625rem .875rem',
            maxWidth: 360,
          },
          success: {
            iconTheme: { primary: '#34d399', secondary: 'transparent' },
            style: { borderLeft: '3px solid #34d399' },
          },
          error: {
            iconTheme: { primary: '#f87171', secondary: 'transparent' },
            style: { borderLeft: '3px solid #f87171' },
          },
        }}
      />
    </ThemeProvider>
  );
}
