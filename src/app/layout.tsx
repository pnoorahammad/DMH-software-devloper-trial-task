import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: { default: 'Inventory OS — Oversell Prevention Platform', template: '%s · Inventory OS' },
  description: 'Enterprise-grade inventory management with real-time oversell prevention, stock reservations, and concurrent order protection. Built by Noor Ahammad.',
  keywords: ['inventory management', 'oversell prevention', 'stock control', 'order management', 'saas'],
  authors: [{ name: 'Noor Ahammad', url: 'https://github.com/pnoorahammad' }],
  openGraph: {
    title: 'Inventory OS — Oversell Prevention Platform',
    description: 'Enterprise-grade inventory management with real-time oversell prevention.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.variable} style={{ background: 'var(--surface-base)', color: 'var(--text-primary)', minHeight: '100vh' }}>
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
      </body>
    </html>
  );
}
