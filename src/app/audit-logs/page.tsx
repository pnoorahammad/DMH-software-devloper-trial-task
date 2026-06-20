'use client';

import { useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Download, ScrollText, Search } from 'lucide-react';
import toast from 'react-hot-toast';

interface AuditLog {
  id: string; action: string; entity_type: string;
  entity_id: string | null; details: string | null; created_at: string;
}

const ACTION_META: Record<string, { label: string; icon: string; cls: string }> = {
  PRODUCT_CREATED:          { label: 'Product Created',       icon: '📦', cls: 'badge-info' },
  PRODUCT_DELETED:          { label: 'Product Deleted',       icon: '🗑️', cls: 'badge-danger' },
  STOCK_UPDATED:            { label: 'Stock Updated',         icon: '✏️', cls: 'badge-neutral' },
  STOCK_RESERVED:           { label: 'Stock Reserved',        icon: '🔒', cls: 'badge-warning' },
  ORDER_COMPLETED:          { label: 'Order Completed',       icon: '✅', cls: 'badge-success' },
  RESERVATION_RELEASED:     { label: 'Reservation Released',  icon: '🔓', cls: 'badge-neutral' },
  OVERSELL_ATTEMPT_BLOCKED: { label: 'Oversell Blocked',      icon: '🛡️', cls: 'badge-danger' },
  SIMULATION_RUN:           { label: 'Simulation Run',        icon: '⚡', cls: 'badge-info' },
};

function parseDetails(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

function DetailCell({ details, action }: { details: Record<string, unknown>; action: string }) {
  const parts: string[] = [];
  if (details.name)         parts.push(String(details.name));
  if (details.sku)          parts.push(String(details.sku));
  if (details.quantity !== undefined) parts.push(`qty: ${details.quantity}`);
  if (details.requested !== undefined) parts.push(`req: ${details.requested}, avail: ${details.available}`);
  if (details.customer)     parts.push(`by ${details.customer}`);
  if (details.totalPrice !== undefined) parts.push(`$${Number(details.totalPrice).toFixed(2)}`);
  if (details.successful !== undefined) parts.push(`✓ ${details.successful} ok, ✗ ${details.failed} blocked`);
  if (details.concurrentRequests) parts.push(`${details.concurrentRequests} concurrent`);
  return (
    <span style={{ fontSize: '.75rem', color: 'var(--text-secondary)' }}>
      {parts.join(' · ') || '—'}
    </span>
  );
}

export default function AuditLogsPage() {
  const [logs, setLogs]     = useState<AuditLog[]>([]);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const limit = 30;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/audit-logs?page=${page}&limit=${limit}`);
      const j = await r.json();
      setLogs(j.data || []);
      setTotal(j.total || 0);
    } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const filtered = search.trim()
    ? logs.filter(l => l.action.includes(search.toUpperCase()) || (l.details || '').toLowerCase().includes(search.toLowerCase()))
    : logs;

  const exportCsv = () => {
    const rows = [
      ['Timestamp', 'Action', 'Entity Type', 'Entity ID', 'Details'],
      ...logs.map(l => [new Date(l.created_at).toLocaleString(), l.action, l.entity_type, l.entity_id || '', (l.details || '').replace(/"/g, '""')]),
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    Object.assign(document.createElement('a'), { href: url, download: 'audit-logs.csv' }).click();
    URL.revokeObjectURL(url);
    toast.success('Audit log exported');
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '.625rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 280 }}>
          <Search size={14} style={{ position: 'absolute', left: '.625rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
          <input className="input input-sm" style={{ paddingLeft: '2rem' }} placeholder="Filter by action or details…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '.75rem', color: 'var(--text-tertiary)' }}>{total} events</span>
          <button onClick={exportCsv} className="btn btn-secondary btn-sm"><Download size={13} /> Export</button>
          <button onClick={load} className="btn btn-secondary btn-sm">Refresh</button>
        </div>
      </div>

      {/* Activity feed */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th className="hide-mobile">Entity</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 12 }).map((_, i) => (
                  <tr key={i}>{[140, 160, 80, 200].map((w, j) => (
                    <td key={j}><div className="skeleton" style={{ height: 14, width: w }} /></td>
                  ))}</tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={4}>
                  <div className="empty-state">
                    <div className="empty-state-icon"><ScrollText size={20} /></div>
                    <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>No events found</p>
                    <p style={{ fontSize: '.8125rem', color: 'var(--text-tertiary)' }}>
                      {search ? 'Try a different search term' : 'Events will appear here as you use the system'}
                    </p>
                  </div>
                </td></tr>
              ) : filtered.map(log => {
                const meta    = ACTION_META[log.action] || { label: log.action.replace(/_/g, ' '), icon: '📋', cls: 'badge-neutral' };
                const details = parseDetails(log.details);
                return (
                  <tr key={log.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <p style={{ fontSize: '.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{new Date(log.created_at).toLocaleTimeString()}</p>
                      <p style={{ fontSize: '.7rem', color: 'var(--text-tertiary)' }}>{new Date(log.created_at).toLocaleDateString()}</p>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span className={`badge ${meta.cls}`} style={{ gap: '.3rem' }}>
                        {meta.icon} {meta.label}
                      </span>
                    </td>
                    <td className="hide-mobile">
                      <span className="badge badge-neutral" style={{ fontSize: '.65rem' }}>{log.entity_type}</span>
                      {log.entity_id && (
                        <p style={{ fontSize: '.65rem', fontFamily: 'monospace', color: 'var(--text-disabled)', marginTop: '.125rem' }}>
                          {log.entity_id.slice(0, 12)}…
                        </p>
                      )}
                    </td>
                    <td style={{ maxWidth: 340 }}>
                      <DetailCell details={details} action={log.action} />
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
              Page {page} of {totalPages} · {total} total events
            </p>
            <div style={{ display: 'flex', gap: '.375rem' }}>
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn btn-secondary btn-sm" style={{ padding: '.3125rem .5rem' }}><ChevronLeft size={14} /></button>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="btn btn-secondary btn-sm" style={{ padding: '.3125rem .5rem' }}><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="card" style={{ padding: '1rem 1.25rem' }}>
        <p style={{ fontSize: '.75rem', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '.625rem', textTransform: 'uppercase', letterSpacing: '.05em' }}>Event Types</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
          {Object.entries(ACTION_META).map(([, meta]) => (
            <span key={meta.label} className={`badge ${meta.cls}`} style={{ gap: '.3rem' }}>
              {meta.icon} {meta.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
