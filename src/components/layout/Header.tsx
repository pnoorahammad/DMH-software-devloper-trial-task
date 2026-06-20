'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Menu, X, Shield, ExternalLink, LayoutDashboard, Package, ShoppingCart, Zap, BarChart3, ScrollText, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';

const NAV = [
  { href: '/',           label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/products',   label: 'Products',   icon: Package },
  { href: '/orders',     label: 'Orders',     icon: ShoppingCart },
  { href: '/simulation', label: 'Simulation', icon: Zap },
  { href: '/analytics',  label: 'Analytics',  icon: BarChart3 },
  { href: '/audit-logs', label: 'Audit Logs', icon: ScrollText },
];

const PAGE_TITLES: Record<string, { title: string; desc: string }> = {
  '/':            { title: 'Dashboard',            desc: 'Overview of your inventory system' },
  '/products':    { title: 'Product Management',   desc: 'Manage your product catalog and stock levels' },
  '/orders':      { title: 'Orders',               desc: 'Track and manage customer orders' },
  '/simulation':  { title: 'Simulation Engine',    desc: 'Test concurrent purchase scenarios' },
  '/analytics':   { title: 'Analytics',            desc: 'Performance metrics and inventory trends' },
  '/audit-logs':  { title: 'Audit Logs',           desc: 'Complete history of all system events' },
};

export default function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const page = PAGE_TITLES[pathname] || { title: 'Inventory OS', desc: '' };

  return (
    <>
      <header style={{
        height: 'var(--header-height)',
        background: 'var(--surface-raised)',
        borderBottom: '1px solid var(--surface-border)',
        display: 'flex', alignItems: 'center',
        padding: '0 1.25rem', gap: '1rem',
        flexShrink: 0, position: 'sticky', top: 0, zIndex: 30,
      }}>
        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="btn btn-ghost btn-sm lg:hidden"
          style={{ padding: '.375rem' }}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        {/* Mobile logo */}
        <div className="lg:hidden" style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
          <div style={{
            width: 28, height: 28, borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--brand-500), #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Shield size={13} color="white" />
          </div>
          <span style={{ fontSize: '.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>Inventory OS</span>
        </div>

        {/* Page title — desktop */}
        <div className="hidden lg:block" style={{ flex: 1 }}>
          <h1 style={{ fontSize: '.9375rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>{page.title}</h1>
          {page.desc && <p style={{ fontSize: '.75rem', color: 'var(--text-tertiary)', lineHeight: 1.2 }}>{page.desc}</p>}
        </div>

        <div style={{ flex: 1 }} className="lg:hidden" />

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexShrink: 0 }}>
          <a
            href="https://digitalheroesco.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-brand-gradient btn-sm hidden sm:inline-flex"
          >
            <ExternalLink size={11} />
            Built for Digital Heroes
          </a>

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="btn btn-ghost btn-sm"
            style={{ padding: '.375rem', borderRadius: '50%' }}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* User pill */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '.5rem',
            padding: '.25rem .625rem .25rem .25rem',
            background: 'var(--surface-card)',
            border: '1px solid var(--surface-border)',
            borderRadius: '99px', cursor: 'default',
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--brand-500), #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '.6875rem', fontWeight: 700, color: 'white', flexShrink: 0,
            }}>N</div>
            <span style={{ fontSize: '.75rem', fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap' }} className="hidden sm:inline">
              Noor Ahammad
            </span>
          </div>
        </div>
      </header>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 40,
          background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(4px)',
        }} onClick={() => setMobileOpen(false)}>
          <div
            style={{
              position: 'absolute', left: 0, top: 0, bottom: 0, width: 260,
              background: 'var(--surface-raised)', borderRight: '1px solid var(--surface-border)',
              padding: '1rem .75rem', display: 'flex', flexDirection: 'column', gap: '.25rem',
              animation: 'fadeUp 200ms var(--ease-default) both',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.75rem', paddingBottom: '.75rem', borderBottom: '1px solid var(--surface-border)' }}>
              <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, var(--brand-500), #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={13} color="white" />
              </div>
              <span style={{ fontSize: '.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>Inventory OS</span>
            </div>
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '.5rem',
                  padding: '.5rem .75rem', borderRadius: 'var(--radius-md)',
                  textDecoration: 'none', fontSize: '.875rem', fontWeight: 500,
                  color: pathname === href ? 'var(--text-primary)' : 'var(--text-secondary)',
                  background: pathname === href ? 'var(--surface-hover)' : 'transparent',
                }}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
            <div style={{ marginTop: 'auto', paddingTop: '.75rem', borderTop: '1px solid var(--surface-border)' }}>
              <a
                href="https://digitalheroesco.com"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-brand-gradient"
                style={{ width: '100%', justifyContent: 'center', marginBottom: '.5rem' }}
              >
                <ExternalLink size={13} />
                Built for Digital Heroes
              </a>
              <p style={{ fontSize: '.75rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>Noor Ahammad · your-email@example.com</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
