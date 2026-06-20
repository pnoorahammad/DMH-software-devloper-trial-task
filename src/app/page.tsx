'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Package, Archive, Lock, CheckCircle, DollarSign,
  AlertTriangle, Zap, TrendingUp, ArrowUpRight, ExternalLink,
  ShoppingCart, BarChart3, Shield
} from 'lucide-react';

interface Stats {
  totalProducts: number; totalStock: number; reservedStock: number;
  availableStock: number; completedOrders: number; totalRevenue: number;
  lowStockProducts: Array<{ id: string; name: string; sku: string; available: number; category: string }>;
}

function KpiCard({ label, value, icon: Icon, iconColor, trend, trendLabel, delay = 0 }: {
  label: string; value: string | number; icon: React.ElementType;
  iconColor: string; trend?: 'up' | 'down'; trendLabel?: string; delay?: number;
}) {
  return (
    <div className="kpi-card animate-fade-up" style={{ animationDelay: `${delay}ms` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '.875rem' }}>
        <p className="kpi-card-label">{label}</p>
        <div style={{
          width: 34, height: 34, borderRadius: 'var(--radius-md)',
          background: `${iconColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon size={16} color={iconColor} />
        </div>
      </div>
      <p className="kpi-card-value">{value}</p>
      {trendLabel && (
        <p className="kpi-card-sub" style={{ display: 'flex', alignItems: 'center', gap: '.25rem', marginTop: '.5rem' }}>
          <ArrowUpRight size={11} color={trend === 'up' ? '#34d399' : '#f87171'} />
          <span style={{ color: trend === 'up' ? '#34d399' : '#f87171', fontWeight: 600 }}>{trendLabel}</span>
        </p>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="kpi-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.875rem' }}>
        <div className="skeleton" style={{ width: 80, height: 10 }} />
        <div className="skeleton" style={{ width: 34, height: 34, borderRadius: 'var(--radius-md)' }} />
      </div>
      <div className="skeleton" style={{ width: 100, height: 32, marginBottom: '.5rem' }} />
      <div className="skeleton" style={{ width: 60, height: 10 }} />
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(j => setStats(j.data)).finally(() => setLoading(false));
  }, []);

  const s = stats;
  const fillRate = s ? Math.round(((s.totalStock - (s.availableStock ?? 0)) / Math.max(s.totalStock, 1)) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Hero banner */}
      <div style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--surface-border)',
        borderRadius: 'var(--radius-2xl)',
        padding: '1.5rem',
        position: 'relative', overflow: 'hidden',
      }} className="animate-fade-up">
        {/* Glow */}
        <div style={{
          position: 'absolute', top: -60, right: -60, width: 300, height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.625rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.375rem', padding: '.25rem .625rem', background: 'var(--info-bg)', border: '1px solid var(--info-border)', borderRadius: '99px' }}>
                <div className="status-dot status-dot-success" />
                <span style={{ fontSize: '.6875rem', fontWeight: 600, color: 'var(--info-text)' }}>ENGINE ACTIVE</span>
              </div>
            </div>
            <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-.02em', marginBottom: '.375rem' }}>
              Inventory Oversell Prevention
            </h2>
            <p style={{ fontSize: '.875rem', color: 'var(--text-secondary)', maxWidth: 480, lineHeight: 1.6 }}>
              Enterprise-grade stock protection with atomic transactions. Built by{' '}
              <span style={{ color: 'var(--brand-400)', fontWeight: 600 }}>Noor Ahammad</span>
              {' · '}
              <span style={{ color: 'var(--text-tertiary)' }}>your-email@example.com</span>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '.625rem', flexWrap: 'wrap' }}>
            <a
              href="https://digitalheroesco.com"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-brand-gradient btn-lg"
            >
              <ExternalLink size={14} />
              Built for Digital Heroes
            </a>
            <Link href="/simulation" className="btn btn-secondary btn-lg">
              <Zap size={14} />
              Run Simulation
            </Link>
          </div>
        </div>
      </div>

      {/* KPI grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : s ? (
          <>
            <KpiCard label="Products"       value={s.totalProducts}  icon={Package}     iconColor="#818cf8" delay={0} />
            <KpiCard label="Total Stock"    value={s.totalStock ?? 0}    icon={Archive}     iconColor="#60a5fa" delay={40} />
            <KpiCard label="Available"      value={s.availableStock ?? 0} icon={CheckCircle} iconColor="#34d399" delay={80} />
            <KpiCard label="Reserved"       value={s.reservedStock ?? 0}  icon={Lock}        iconColor="#fbbf24" delay={120} />
            <KpiCard label="Orders Done"    value={s.completedOrders ?? 0} icon={ShoppingCart} iconColor="#a78bfa" delay={160} />
            <KpiCard
              label="Revenue"
              value={`$${((s.totalRevenue ?? 0)).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
              icon={DollarSign}
              iconColor="#34d399"
              delay={200}
            />
          </>
        ) : null}
      </div>

      {/* Mid row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        {/* Stock Health */}
        <div className="card animate-fade-up stagger-3" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>Stock Health</h3>
            <span className="badge badge-info">{fillRate}% reserved</span>
          </div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.625rem' }}>
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 12 }} />)}
            </div>
          ) : s ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.875rem' }}>
              {[
                { label: 'Available', value: s.availableStock ?? 0, total: s.totalStock, color: '#34d399' },
                { label: 'Reserved',  value: s.reservedStock ?? 0,  total: s.totalStock, color: '#fbbf24' },
              ].map(({ label, value, total, color }) => {
                const pct = total > 0 ? Math.round((value / total) * 100) : 0;
                return (
                  <div key={label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.375rem' }}>
                      <span style={{ fontSize: '.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
                      <span style={{ fontSize: '.75rem', color, fontWeight: 700 }}>{value} <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>({pct}%)</span></span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>

        {/* Quick actions */}
        <div className="card animate-fade-up stagger-4" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.375rem' }}>
            {[
              { href: '/products',   icon: Package,    label: 'Manage Products',  desc: 'Add, edit, update stock', color: '#818cf8' },
              { href: '/simulation', icon: Zap,        label: 'Run Simulation',   desc: 'Test concurrency limits', color: '#fbbf24' },
              { href: '/orders',     icon: ShoppingCart,label: 'View Orders',     desc: 'Process pending orders',  color: '#34d399' },
              { href: '/analytics',  icon: BarChart3,  label: 'Analytics',        desc: 'Revenue & trends',        color: '#a78bfa' },
            ].map(({ href, icon: Icon, label, desc, color }) => (
              <Link key={href} href={href} style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.5rem .625rem', borderRadius: 'var(--radius-md)', textDecoration: 'none', transition: 'background var(--duration-fast)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={15} color={color} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: '.8125rem', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.2 }}>{label}</p>
                  <p style={{ fontSize: '.7rem', color: 'var(--text-tertiary)', lineHeight: 1.2 }}>{desc}</p>
                </div>
                <ArrowUpRight size={13} style={{ color: 'var(--text-tertiary)', marginLeft: 'auto', flexShrink: 0 }} />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Low stock alerts */}
      {!loading && s && s.lowStockProducts?.length > 0 && (
        <div className="card animate-fade-up stagger-5" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              <AlertTriangle size={16} color="#fbbf24" />
              <h3 style={{ fontSize: '.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>Low Stock Alerts</h3>
              <span className="badge badge-warning">{s.lowStockProducts.length} items</span>
            </div>
            <Link href="/products" className="btn btn-ghost btn-sm" style={{ fontSize: '.75rem' }}>
              View all <ArrowUpRight size={12} />
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '.625rem' }}>
            {s.lowStockProducts.map(p => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '.625rem .875rem', background: 'var(--warning-bg)',
                border: '1px solid var(--warning-border)', borderRadius: 'var(--radius-md)',
              }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ fontSize: '.8125rem', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                  <p style={{ fontSize: '.7rem', color: 'var(--text-tertiary)' }}>{p.sku}</p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '.5rem' }}>
                  <p style={{ fontSize: '1.125rem', fontWeight: 700, color: p.available === 0 ? '#f87171' : '#fbbf24', lineHeight: 1 }}>{p.available}</p>
                  <p style={{ fontSize: '.6875rem', color: 'var(--text-tertiary)' }}>left</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System status */}
      <div className="card animate-fade-up stagger-6" style={{ padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            <Shield size={14} color="#34d399" />
            <span style={{ fontSize: '.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Oversell Prevention</span>
            <span className="badge badge-success badge-dot">Active</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            <span style={{ fontSize: '.75rem', color: 'var(--text-tertiary)' }}>Storage: SQLite WAL Mode</span>
            <span className="badge badge-info">Atomic</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            <span style={{ fontSize: '.75rem', color: 'var(--text-tertiary)' }}>Concurrency: Serialized Transactions</span>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <span style={{ fontSize: '.75rem', color: 'var(--text-tertiary)' }}>
              Built by <span style={{ color: 'var(--brand-400)', fontWeight: 600 }}>Noor Ahammad</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
