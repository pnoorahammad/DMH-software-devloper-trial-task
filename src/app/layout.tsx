import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ClientLayout from '@/components/layout/ClientLayout';

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
      <body className={inter.variable}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
