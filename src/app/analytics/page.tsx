'use client';

import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, AreaChart, Area,
} from 'recharts';
import { Shield, TrendingUp } from 'lucide-react';

interface AnalyticsData {
  ordersByDay:         { date: string; completed: number; failed: number; reserved: number }[];
  topProducts:         { name: string; sku: string; totalOrdered: number; revenue: number }[];
  stockUsage:          { name: string; totalStock: number; reserved: number; available: number }[];
  orderStatusBreakdown:{ status: string; count: number }[];
  revenueByDay:        { date: string; revenue: number }[];
  oversellBlocked:     number;
}

const PALETTE = ['#6366f1', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#60a5fa'];

const ChartTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{name: string; value: number; color: string}>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--surface-card)', border: '1px solid var(--surface-border-light)',
      borderRadius: 'var(--radius-md)', padding: '.625rem .875rem',
      boxShadow: 'var(--shadow-lg)', fontSize: '.75rem',
    }}>
      {label && <p style={{ color: 'var(--text-tertiary)', marginBottom: '.375rem', fontWeight: 500 }}>{label}</p>}
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color, fontWeight: 600, display: 'flex', gap: '.5rem', justifyContent: 'space-between', minWidth: 120 }}>
          <span>{p.name}</span>
          <span>{typeof p.value === 'number' && p.name.toLowerCase().includes('revenue') ? `$${p.value.toFixed(0)}` : p.value}</span>
        </p>
      ))}
    </div>
  );
};

function ChartCard({ title, children, height = 200 }: { title: string; children: React.ReactNode; height?: number }) {
  return (
    <div className="card" style={{ padding: '1.25rem' }}>
      <h3 style={{ fontSize: '.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>{title}</h3>
      {children}
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData]       = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics').then(r => r.json()).then(j => setData(j.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card skeleton" style={{ height: 280 }} />
      ))}
    </div>
  );

  if (!data) return (
    <div className="empty-state">
      <p style={{ color: 'var(--text-tertiary)' }}>Failed to load analytics. Please refresh.</p>
    </div>
  );

  const ordersByDayAsc  = [...data.ordersByDay].reverse();
  const revenueAsc      = [...data.revenueByDay].reverse();
  const hasOrders       = data.ordersByDay.length > 0;
  const hasRevenue      = data.revenueByDay.length > 0;
  const totalRevenue    = data.revenueByDay.reduce((s, d) => s + d.revenue, 0);
  const totalOrders     = data.orderStatusBreakdown.reduce((s, d) => s + d.count, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Header metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, color: 'var(--success-text)' },
          { label: 'Total Orders', value: totalOrders, color: 'var(--brand-400)' },
          { label: 'Oversell Blocked', value: data.oversellBlocked, color: 'var(--danger-text)' },
          { label: 'Products Tracked', value: data.stockUsage.length, color: 'var(--warning-text)' },
        ].map(({ label, value, color }) => (
          <div key={label} className="kpi-card" style={{ padding: '1rem 1.25rem' }}>
            <p className="kpi-card-label">{label}</p>
            <p className="kpi-card-value" style={{ fontSize: '1.625rem', color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Oversell alert */}
      {data.oversellBlocked > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.875rem 1.125rem', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-lg)' }}>
          <Shield size={18} color="var(--danger-text)" style={{ flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: '.875rem', fontWeight: 600, color: 'var(--danger-text)' }}>
              {data.oversellBlocked} Oversell Attempt{data.oversellBlocked !== 1 ? 's' : ''} Blocked
            </p>
            <p style={{ fontSize: '.75rem', color: 'var(--text-tertiary)' }}>
              The prevention engine protected your inventory from {data.oversellBlocked} unauthorized purchase{data.oversellBlocked !== 1 ? 's' : ''}.
            </p>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
        {/* Revenue trend */}
        <ChartCard title="Revenue Trend">
          {!hasRevenue ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <TrendingUp size={24} color="var(--text-tertiary)" />
              <p style={{ fontSize: '.8125rem', color: 'var(--text-tertiary)' }}>Complete orders to see revenue data</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={revenueAsc}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#6366f1" strokeWidth={2} fill="url(#revenueGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Order status breakdown */}
        <ChartCard title="Order Status Distribution">
          {data.orderStatusBreakdown.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <p style={{ fontSize: '.8125rem', color: 'var(--text-tertiary)' }}>No orders yet. Run a simulation!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={data.orderStatusBreakdown}
                    dataKey="count"
                    nameKey="status"
                    cx="50%" cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    label={({ name, percent }: { name?: string; percent?: number }) =>
                      `${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {data.orderStatusBreakdown.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', flexShrink: 0 }}>
                {data.orderStatusBreakdown.map((d, i) => (
                  <div key={d.status} style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: PALETTE[i % PALETTE.length], flexShrink: 0 }} />
                    <span style={{ fontSize: '.7rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{d.status}</span>
                    <span style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--text-primary)', marginLeft: 'auto' }}>{d.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ChartCard>

        {/* Orders by day */}
        <ChartCard title="Orders by Day">
          {!hasOrders ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <p style={{ fontSize: '.8125rem', color: 'var(--text-tertiary)' }}>No order data yet. Run a simulation!</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ordersByDayAsc} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="completed" name="Completed" fill="#34d399" radius={[3, 3, 0, 0]} />
                <Bar dataKey="reserved"  name="Reserved"  fill="#fbbf24" radius={[3, 3, 0, 0]} />
                <Bar dataKey="failed"    name="Failed"    fill="#f87171" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Stock usage */}
        <ChartCard title="Stock Allocation (Top 8)">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.stockUsage.slice(0, 8)} layout="vertical" barCategoryGap="25%">
              <XAxis type="number" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 9 }} width={90} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="available" name="Available" fill="#34d399" stackId="s" radius={[0, 0, 0, 0]} />
              <Bar dataKey="reserved"  name="Reserved"  fill="#fbbf24" stackId="s" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Top products table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>Top Products by Revenue</h3>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Product</th>
                <th className="hide-mobile">SKU</th>
                <th>Orders</th>
                <th>Revenue</th>
                <th className="hide-tablet">Share</th>
              </tr>
            </thead>
            <tbody>
              {data.topProducts.length === 0 ? (
                <tr><td colSpan={6}><div className="empty-state" style={{ padding: '2rem' }}><p style={{ color: 'var(--text-tertiary)', fontSize: '.8125rem' }}>No orders yet</p></div></td></tr>
              ) : data.topProducts.map((p, i) => {
                const revShare = totalRevenue > 0 ? Math.round((p.revenue / totalRevenue) * 100) : 0;
                return (
                  <tr key={p.sku}>
                    <td>
                      <div style={{
                        width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: i === 0 ? '#fbbf24' : i === 1 ? '#9ca3af' : i === 2 ? '#d97706' : 'var(--surface-subtle)',
                        fontSize: '.7rem', fontWeight: 700, color: i < 3 ? '#000' : 'var(--text-tertiary)',
                      }}>{i + 1}</div>
                    </td>
                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{p.name}</td>
                    <td className="hide-mobile"><code style={{ fontSize: '.7rem', color: 'var(--text-tertiary)', background: 'var(--surface-subtle)', padding: '.125rem .375rem', borderRadius: 'var(--radius-sm)' }}>{p.sku}</code></td>
                    <td style={{ fontWeight: 600 }}>{p.totalOrdered}</td>
                    <td style={{ fontWeight: 700, color: 'var(--success-text)' }}>${(p.revenue || 0).toFixed(2)}</td>
                    <td className="hide-tablet">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                        <div className="progress-bar" style={{ flex: 1 }}>
                          <div className="progress-fill" style={{ width: `${revShare}%`, background: PALETTE[i % PALETTE.length] }} />
                        </div>
                        <span style={{ fontSize: '.7rem', color: 'var(--text-tertiary)', width: 28, textAlign: 'right' }}>{revShare}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
