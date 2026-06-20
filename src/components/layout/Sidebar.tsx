'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, ShoppingCart, BarChart3,
  ScrollText, Zap, ExternalLink, Shield, ChevronRight
} from 'lucide-react';

const NAV = [
  { href: '/',            label: 'Dashboard',   icon: LayoutDashboard, desc: 'Overview & metrics' },
  { href: '/products',    label: 'Products',     icon: Package,         desc: 'Manage inventory' },
  { href: '/orders',      label: 'Orders',       icon: ShoppingCart,    desc: 'Order management' },
  { href: '/simulation',  label: 'Simulation',   icon: Zap,             desc: 'Concurrency testing' },
  { href: '/analytics',   label: 'Analytics',    icon: BarChart3,       desc: 'Charts & trends' },
  { href: '/audit-logs',  label: 'Audit Logs',   icon: ScrollText,      desc: 'Activity history' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: 'var(--sidebar-width)',
        background: 'var(--surface-raised)',
        borderRight: '1px solid var(--surface-border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        flexShrink: 0,
      }}
      className="hidden lg:flex"
    >
      {/* Logo */}
      <div style={{ padding: '1rem 1rem .75rem', borderBottom: '1px solid var(--surface-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.625rem' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--brand-500), #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, boxShadow: 'var(--shadow-brand)',
          }}>
            <Shield size={15} color="white" />
          </div>
          <div>
            <p style={{ fontSize: '.8125rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>Inventory OS</p>
            <p style={{ fontSize: '.6875rem', color: 'var(--text-tertiary)', lineHeight: 1 }}>Oversell Prevention</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '.5rem', overflowY: 'auto' }}>
        <div style={{ marginBottom: '.25rem' }}>
          <p style={{ fontSize: '.6rem', fontWeight: 700, color: 'var(--text-disabled)', letterSpacing: '.08em', textTransform: 'uppercase', padding: '.5rem .625rem .25rem' }}>
            Navigation
          </p>
        </div>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex', alignItems: 'center', gap: '.5rem',
                padding: '.4375rem .625rem', borderRadius: 'var(--radius-md)',
                marginBottom: '.125rem', textDecoration: 'none',
                fontSize: '.8125rem', fontWeight: 500,
                color: active ? 'var(--text-primary)' : 'var(--text-tertiary)',
                background: active ? 'var(--surface-hover)' : 'transparent',
                transition: 'all var(--duration-fast)',
                border: active ? '1px solid var(--surface-border-light)' : '1px solid transparent',
              }}
              onMouseEnter={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
                  (e.currentTarget as HTMLElement).style.background = 'var(--surface-hover)';
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)';
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }
              }}
            >
              <Icon size={15} style={{ flexShrink: 0, opacity: active ? 1 : .6 }} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '.75rem', borderTop: '1px solid var(--surface-border)' }}>
        <a
          href="https://digitalheroesco.com"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-brand-gradient btn-sm"
          style={{ width: '100%', fontSize: '.75rem', padding: '.5rem .75rem', borderRadius: 'var(--radius-md)', marginBottom: '.625rem' }}
        >
          <ExternalLink size={11} />
          Built for Digital Heroes
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.375rem .25rem' }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--brand-500), #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '.75rem', fontWeight: 700, color: 'white', flexShrink: 0,
          }}>N</div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: '.75rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>Noor Ahammad</p>
            <p style={{ fontSize: '.6875rem', color: 'var(--text-tertiary)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>your-email@example.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
