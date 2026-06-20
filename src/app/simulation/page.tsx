'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Zap, CheckCircle, XCircle, Package, Clock, BarChart2, Info, Shield } from 'lucide-react';

interface Product { id: string; name: string; sku: string; quantity: number; reserved: number; available: number; }
interface OrderResult { requestId: number; customerId: string; quantity: number; status: string; reason?: string; }
interface SimResult {
  productName: string; initialStock: number; requestedTotal: number;
  successful: number; failed: number; remainingStock: number;
  orders: OrderResult[]; duration: number;
}

const PRESETS = [
  { label: '10 Users', requests: 10 },
  { label: '25 Users', requests: 25 },
  { label: '50 Users', requests: 50 },
  { label: '100 Users', requests: 100 },
];

export default function SimulationPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState('');
  const [requests, setRequests]   = useState(25);
  const [qtyPer, setQtyPer]       = useState(1);
  const [running, setRunning]     = useState(false);
  const [result, setResult]       = useState<SimResult | null>(null);
  const [filter, setFilter]       = useState<'all' | 'success' | 'failed'>('all');

  useEffect(() => {
    fetch('/api/products?limit=100')
      .then(r => r.json())
      .then(j => {
        const data = j.data || [];
        setProducts(data);
        if (data.length) setProductId(data[0].id);
      });
  }, []);

  const selected = products.find(p => p.id === productId);
  const wouldOversell = selected && (requests * qtyPer) > selected.available;

  const run = async () => {
    if (!productId) { toast.error('Select a product first'); return; }
    setRunning(true);
    setResult(null);
    setFilter('all');
    try {
      const res  = await fetch('/api/simulation', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, concurrentRequests: requests, quantityPerRequest: qtyPer }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || 'Simulation failed'); return; }
      const d = json.data as SimResult;
      setResult(d);
      toast.success(`Done! ${d.successful} succeeded · ${d.failed} blocked in ${d.duration}ms`);
      // Refresh products list
      fetch('/api/products?limit=100').then(r => r.json()).then(j => setProducts(j.data || []));
    } finally { setRunning(false); }
  };

  const filteredOrders = result?.orders.filter(o =>
    filter === 'all' ? true : filter === 'success' ? o.status === 'success' : o.status === 'failed'
  ) ?? [];

  const successPct = result ? Math.round((result.successful / result.orders.length) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Config card */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.375rem' }}>
              <Zap size={16} color="var(--brand-400)" />
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Concurrent Purchase Simulation</h2>
            </div>
            <p style={{ fontSize: '.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Fire multiple simultaneous purchase requests at a single product. The atomic lock engine prevents any overselling — inventory can <em>never</em> go negative.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.375rem', padding: '.4375rem .75rem', background: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: 'var(--radius-md)', flexShrink: 0 }}>
            <Shield size={13} color="var(--success-text)" />
            <span style={{ fontSize: '.75rem', fontWeight: 600, color: 'var(--success-text)' }}>Prevention Engine Active</span>
          </div>
        </div>

        {/* Preset buttons */}
        <div style={{ marginBottom: '1rem' }}>
          <p className="label" style={{ marginBottom: '.5rem' }}>Quick Presets</p>
          <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
            {PRESETS.map(({ label, requests: r }) => (
              <button key={label} onClick={() => setRequests(r)}
                className="btn btn-sm"
                style={{
                  background: requests === r ? 'var(--brand-500)' : 'var(--surface-card)',
                  color: requests === r ? '#fff' : 'var(--text-secondary)',
                  border: `1px solid ${requests === r ? 'var(--brand-500)' : 'var(--surface-border-light)'}`,
                }}
              >{label}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '.75rem', marginBottom: '1.25rem' }}>
          <div>
            <label className="label">Product</label>
            <select className="input select" value={productId} onChange={e => setProductId(e.target.value)}>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} — {p.available} available</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Concurrent Requests (1–100)</label>
            <input className="input" type="number" min={1} max={100} value={requests}
              onChange={e => setRequests(Math.max(1, Math.min(100, Number(e.target.value))))} />
          </div>
          <div>
            <label className="label">Units per Request (1–10)</label>
            <input className="input" type="number" min={1} max={10} value={qtyPer}
              onChange={e => setQtyPer(Math.max(1, Math.min(10, Number(e.target.value))))} />
          </div>
        </div>

        {/* Prediction banner */}
        {selected && (
          <div style={{
            padding: '.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem',
            background: wouldOversell ? 'var(--warning-bg)' : 'var(--info-bg)',
            border: `1px solid ${wouldOversell ? 'var(--warning-border)' : 'var(--info-border)'}`,
            display: 'flex', alignItems: 'center', gap: '.625rem',
          }}>
            <Info size={14} color={wouldOversell ? 'var(--warning-text)' : 'var(--info-text)'} style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '.8125rem', color: wouldOversell ? 'var(--warning-text)' : 'var(--info-text)' }}>
              <strong>{selected.name}</strong> · Available: <strong>{selected.available}</strong> · 
              Total requested: <strong>{requests * qtyPer}</strong>
              {wouldOversell
                ? <span> · <strong>Oversell prevention will block {requests * qtyPer - selected.available} units</strong></span>
                : <span> · All requests can be fulfilled</span>
              }
            </div>
          </div>
        )}

        <button onClick={run} disabled={running || !productId} className="btn btn-primary btn-lg">
          {running ? (
            <><span className="spinner" /> Simulating {requests} concurrent requests…</>
          ) : (
            <><Zap size={16} /> Launch {requests}-User Simulation</>
          )}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} className="animate-fade-up">
          {/* Result KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '.75rem' }}>
            {[
              { label: 'Initial Stock',   value: result.initialStock,   icon: Package,   color: '#818cf8' },
              { label: 'Total Requests',  value: result.orders.length,  icon: Zap,       color: '#60a5fa' },
              { label: '✓ Successful',    value: result.successful,     icon: CheckCircle, color: 'var(--success-text)' },
              { label: '✗ Blocked',       value: result.failed,         icon: XCircle,   color: 'var(--danger-text)' },
              { label: 'Remaining Stock', value: result.remainingStock, icon: BarChart2, color: 'var(--warning-text)' },
              { label: 'Duration',        value: `${result.duration}ms`, icon: Clock,    color: 'var(--text-tertiary)' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="card" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.375rem', marginBottom: '.5rem' }}>
                  <Icon size={13} color={color} />
                  <span style={{ fontSize: '.7rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</span>
                </div>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color, lineHeight: 1 }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Success rate bar */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.875rem' }}>
              <div>
                <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '.25rem' }}>{result.productName}</p>
                <p style={{ fontSize: '.75rem', color: 'var(--text-tertiary)' }}>
                  {result.successful} of {result.orders.length} requests succeeded · {result.successful * qtyPer} units reserved & completed
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: successPct > 50 ? 'var(--success-text)' : 'var(--warning-text)', lineHeight: 1 }}>{successPct}%</p>
                <p style={{ fontSize: '.7rem', color: 'var(--text-tertiary)' }}>success rate</p>
              </div>
            </div>
            <div className="progress-bar" style={{ height: 8 }}>
              <div className="progress-fill" style={{ width: `${successPct}%`, background: 'linear-gradient(90deg, #34d399, #10b981)' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '.5rem' }}>
              <span style={{ fontSize: '.75rem', color: 'var(--success-text)', fontWeight: 600 }}>✓ {result.successful} succeeded</span>
              <span style={{ fontSize: '.75rem', color: 'var(--danger-text)', fontWeight: 600 }}>✗ {result.failed} blocked by engine</span>
            </div>
          </div>

          {/* Request log */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid var(--surface-border)', flexWrap: 'wrap', gap: '.5rem' }}>
              <h3 style={{ fontSize: '.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>Request Log — {result.orders.length} requests</h3>
              <div style={{ display: 'flex', gap: '.375rem' }}>
                {(['all', 'success', 'failed'] as const).map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className="btn btn-sm"
                    style={{
                      fontSize: '.7rem', padding: '.25rem .5rem',
                      background: filter === f ? 'var(--surface-hover)' : 'transparent',
                      color: filter === f ? 'var(--text-primary)' : 'var(--text-tertiary)',
                      border: `1px solid ${filter === f ? 'var(--surface-border-light)' : 'transparent'}`,
                    }}
                  >{f === 'all' ? 'All' : f === 'success' ? `✓ Success (${result.successful})` : `✗ Blocked (${result.failed})`}</button>
                ))}
              </div>
            </div>
            <div style={{ maxHeight: 360, overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Customer ID</th>
                    <th>Qty</th>
                    <th>Result</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(o => (
                    <tr key={o.requestId}>
                      <td style={{ color: 'var(--text-disabled)', fontFamily: 'monospace', fontSize: '.7rem' }}>{String(o.requestId).padStart(3, '0')}</td>
                      <td><code style={{ fontSize: '.7rem', color: 'var(--text-tertiary)' }}>{o.customerId}</code></td>
                      <td style={{ fontWeight: 600 }}>{o.quantity}</td>
                      <td>
                        <span className={`badge ${o.status === 'success' ? 'badge-success' : 'badge-danger'} badge-dot`}>
                          {o.status === 'success' ? 'Success' : 'Blocked'}
                        </span>
                      </td>
                      <td style={{ fontSize: '.75rem', color: 'var(--text-tertiary)' }}>{o.reason || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
