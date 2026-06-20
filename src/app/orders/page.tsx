'use client';

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, Download, ShoppingCart } from 'lucide-react';

interface Order {
  id: string; product_id: string; product_name: string; product_sku: string;
  quantity: number; status: 'reserved' | 'completed' | 'cancelled' | 'failed';
  customer_name: string; total_price: number; created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  reserved:  { label: 'Reserved',  cls: 'badge-warning' },
  completed: { label: 'Completed', cls: 'badge-success' },
  cancelled: { label: 'Cancelled', cls: 'badge-neutral' },
  failed:    { label: 'Failed',    cls: 'badge-danger'  },
};

const STATUSES = ['', 'reserved', 'completed', 'cancelled', 'failed'];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [acting, setActing]   = useState<string | null>(null);
  const limit = 15;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), limit: String(limit), status: filter });
      const r = await fetch(`/api/orders?${p}`);
      const j = await r.json();
      setOrders(j.data || []);
      setTotal(j.total || 0);
    } finally { setLoading(false); }
  }, [page, filter]);

  useEffect(() => { load(); }, [load]);

  const act = async (id: string, action: 'complete' | 'cancel') => {
    setActing(id);
    try {
      const res  = await fetch(`/api/orders/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || 'Action failed'); return; }
      toast.success(action === 'complete' ? 'Order completed — stock deducted' : 'Order cancelled — stock released');
      load();
    } finally { setActing(null); }
  };

  const exportCsv = () => {
    const rows = [
      ['Order ID', 'Product', 'SKU', 'Customer', 'Qty', 'Total', 'Status', 'Date'],
      ...orders.map(o => [o.id, o.product_name, o.product_sku, o.customer_name, o.quantity, `$${o.total_price.toFixed(2)}`, o.status, new Date(o.created_at).toLocaleString()]),
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    Object.assign(document.createElement('a'), { href: url, download: 'orders.csv' }).click();
    URL.revokeObjectURL(url);
    toast.success('Orders exported');
  };

  const totalPages = Math.ceil(total / limit);
  const counts = { reserved: 0, completed: 0, cancelled: 0, failed: 0 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Filter tabs + actions */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', background: 'var(--surface-card)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-md)', padding: '.25rem', gap: '.125rem' }}>
          {STATUSES.map(s => (
            <button key={s} onClick={() => { setFilter(s); setPage(1); }}
              className="btn btn-sm"
              style={{
                padding: '.25rem .625rem', fontSize: '.75rem', borderRadius: 'var(--radius-sm)',
                background: filter === s ? 'var(--surface-hover)' : 'transparent',
                color: filter === s ? 'var(--text-primary)' : 'var(--text-tertiary)',
                border: filter === s ? '1px solid var(--surface-border-light)' : '1px solid transparent',
              }}
            >
              {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '.5rem' }}>
          <button onClick={exportCsv} className="btn btn-secondary btn-sm"><Download size={13} /> Export</button>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Product</th>
                <th className="hide-mobile">Customer</th>
                <th>Qty</th>
                <th className="hide-tablet">Total</th>
                <th>Status</th>
                <th className="hide-tablet">Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 8 }).map((_, j) => (
                    <td key={j}><div className="skeleton" style={{ height: 14, width: j === 0 ? 80 : j === 1 ? 140 : 70 }} /></td>
                  ))}</tr>
                ))
              ) : orders.length === 0 ? (
                <tr><td colSpan={8}>
                  <div className="empty-state">
                    <div className="empty-state-icon"><ShoppingCart size={20} /></div>
                    <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>No orders found</p>
                    <p style={{ fontSize: '.8125rem', color: 'var(--text-tertiary)' }}>
                      {filter ? `No ${filter} orders` : 'Run a simulation to generate orders'}
                    </p>
                  </div>
                </td></tr>
              ) : orders.map(o => {
                const st  = STATUS_CONFIG[o.status] || { label: o.status, cls: 'badge-neutral' };
                const isActing = acting === o.id;
                return (
                  <tr key={o.id}>
                    <td>
                      <code style={{ fontSize: '.7rem', color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>
                        {o.id.slice(0, 8)}
                      </code>
                    </td>
                    <td>
                      <p style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '.8125rem' }}>{o.product_name}</p>
                      <p style={{ fontSize: '.7rem', color: 'var(--text-tertiary)' }}>{o.product_sku}</p>
                    </td>
                    <td className="hide-mobile" style={{ color: 'var(--text-secondary)' }}>{o.customer_name}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{o.quantity}</td>
                    <td className="hide-tablet" style={{ fontWeight: 600, color: 'var(--success-text)' }}>${o.total_price.toFixed(2)}</td>
                    <td><span className={`badge ${st.cls} badge-dot`}>{st.label}</span></td>
                    <td className="hide-tablet" style={{ fontSize: '.75rem', color: 'var(--text-tertiary)' }}>
                      {new Date(o.created_at).toLocaleDateString()}{' '}
                      <span style={{ color: 'var(--text-disabled)' }}>{new Date(o.created_at).toLocaleTimeString()}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {o.status === 'reserved' ? (
                        <div style={{ display: 'flex', gap: '.25rem', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => act(o.id, 'complete')}
                            disabled={!!acting}
                            className="btn btn-sm"
                            style={{ padding: '.3125rem .5rem', background: 'var(--success-bg)', color: 'var(--success-text)', border: '1px solid var(--success-border)', fontSize: '.7rem' }}
                            data-tooltip="Complete & deduct stock"
                          >
                            {isActing ? <span className="spinner spinner-sm" /> : <CheckCircle size={12} />}
                            <span className="hide-mobile">Complete</span>
                          </button>
                          <button
                            onClick={() => act(o.id, 'cancel')}
                            disabled={!!acting}
                            className="btn btn-sm"
                            style={{ padding: '.3125rem .5rem', background: 'var(--danger-bg)', color: 'var(--danger-text)', border: '1px solid var(--danger-border)', fontSize: '.7rem' }}
                            data-tooltip="Cancel & release stock"
                          >
                            <XCircle size={12} />
                            <span className="hide-mobile">Cancel</span>
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '.75rem', color: 'var(--text-disabled)' }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.75rem 1rem', borderTop: '1px solid var(--surface-border)' }}>
            <p style={{ fontSize: '.75rem', color: 'var(--text-tertiary)' }}>
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of <strong style={{ color: 'var(--text-primary)' }}>{total}</strong> orders
            </p>
            <div style={{ display: 'flex', gap: '.375rem' }}>
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn btn-secondary btn-sm" style={{ padding: '.3125rem .5rem' }}><ChevronLeft size={14} /></button>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="btn btn-secondary btn-sm" style={{ padding: '.3125rem .5rem' }}><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
