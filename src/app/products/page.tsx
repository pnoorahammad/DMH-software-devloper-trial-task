'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { Plus, Search, Edit2, Trash2, X, Download, ChevronLeft, ChevronRight, Filter, Package } from 'lucide-react';

interface Product {
  id: string; name: string; sku: string; price: number;
  quantity: number; reserved: number; available: number; category: string;
}

const CATEGORIES = ['General', 'Electronics', 'Footwear', 'Apparel', 'Kitchen', 'Home', 'Sports', 'Books', 'Beauty', 'Toys'];

// ─── Reusable Modal ────────────────────────────────────────────
function Modal({ open, title, onClose, size = 'md', children }: {
  open: boolean; title: string; onClose: () => void; size?: 'sm' | 'md'; children: React.ReactNode;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-panel"
        style={{ maxWidth: size === 'sm' ? 360 : 440 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 style={{ fontSize: '.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h3>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: '.25rem' }}><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Form Field ─────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading]   = useState(true);
  const [modalOpen, setModalOpen]     = useState(false);
  const [editing, setEditing]         = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [saving, setSaving]           = useState(false);
  const [deleting, setDeleting]       = useState(false);
  const [form, setForm] = useState({ name: '', sku: '', price: '', quantity: '', category: 'General' });
  const searchRef = useRef<NodeJS.Timeout | null>(null);

  const limit = 10;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), limit: String(limit), search, category });
      const r = await fetch(`/api/products?${p}`);
      const j = await r.json();
      setProducts(j.data || []);
      setTotal(j.total || 0);
    } finally {
      setLoading(false);
    }
  }, [page, search, category]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (val: string) => {
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => { setSearch(val); setPage(1); }, 300);
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', sku: '', price: '', quantity: '', category: 'General' });
    setModalOpen(true);
  };
  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ name: p.name, sku: p.sku, price: String(p.price), quantity: String(p.quantity), category: p.category });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.sku.trim() || !form.price || !form.quantity) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (Number(form.price) < 0 || Number(form.quantity) < 0) {
      toast.error('Price and quantity must be positive');
      return;
    }
    setSaving(true);
    try {
      const url    = editing ? `/api/products/${editing.id}` : '/api/products';
      const method = editing ? 'PUT' : 'POST';
      const res    = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, price: Number(form.price), quantity: Number(form.quantity) }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || 'Operation failed'); return; }
      toast.success(editing ? 'Product updated successfully' : 'Product created successfully');
      setModalOpen(false);
      load();
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res  = await fetch(`/api/products/${deleteTarget.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || 'Failed to delete'); return; }
      toast.success('Product deleted');
      setDeleteTarget(null);
      load();
    } finally { setDeleting(false); }
  };

  const exportCsv = () => {
    const rows = [
      ['Name', 'SKU', 'Category', 'Price', 'Total Stock', 'Reserved', 'Available'],
      ...products.map(p => [p.name, p.sku, p.category, p.price, p.quantity, p.reserved, p.available]),
    ];
    const csv  = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), { href: url, download: 'products.csv' });
    a.click(); URL.revokeObjectURL(url);
    toast.success('Products exported to CSV');
  };

  const totalPages = Math.ceil(total / limit);
  const stockStatus = (available: number) =>
    available === 0 ? { label: 'Out of Stock', cls: 'badge-danger' }
    : available <= 5 ? { label: 'Low Stock', cls: 'badge-warning' }
    : { label: 'In Stock', cls: 'badge-success' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.625rem', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 280 }}>
          <Search size={14} style={{ position: 'absolute', left: '.625rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
          <input
            className="input input-sm"
            style={{ paddingLeft: '2rem' }}
            placeholder="Search products or SKU…"
            onChange={e => handleSearch(e.target.value)}
          />
        </div>
        {/* Category filter */}
        <select
          className="input input-sm select"
          style={{ width: 'auto', minWidth: 140 }}
          value={category}
          onChange={e => { setCategory(e.target.value); setPage(1); }}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '.5rem' }}>
          <button onClick={exportCsv} className="btn btn-secondary btn-sm">
            <Download size={13} /> Export CSV
          </button>
          <button onClick={openAdd} className="btn btn-primary btn-sm">
            <Plus size={13} /> Add Product
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th className="hide-mobile">Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Reserved</th>
                <th>Available</th>
                <th className="hide-mobile">Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j}><div className="skeleton" style={{ height: 14, width: j === 0 ? 140 : 60 }} /></td>
                    ))}
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="empty-state">
                      <div className="empty-state-icon"><Package size={20} /></div>
                      <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>No products found</p>
                      <p style={{ fontSize: '.8125rem', color: 'var(--text-tertiary)' }}>
                        {search || category ? 'Try adjusting your filters' : 'Add your first product to get started'}
                      </p>
                      {!search && !category && (
                        <button onClick={openAdd} className="btn btn-primary btn-sm"><Plus size={13} /> Add Product</button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : products.map(p => {
                const st = stockStatus(p.available);
                return (
                  <tr key={p.id}>
                    <td>
                      <p style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: '.125rem' }}>{p.name}</p>
                    </td>
                    <td><code style={{ fontSize: '.7rem', color: 'var(--text-tertiary)', background: 'var(--surface-subtle)', padding: '.125rem .375rem', borderRadius: 'var(--radius-sm)' }}>{p.sku}</code></td>
                    <td className="hide-mobile"><span className="badge badge-neutral">{p.category}</span></td>
                    <td><span style={{ fontWeight: 600, color: 'var(--success-text)' }}>${p.price.toFixed(2)}</span></td>
                    <td><span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.quantity}</span></td>
                    <td><span style={{ color: 'var(--warning-text)', fontWeight: 500 }}>{p.reserved}</span></td>
                    <td><span style={{ fontWeight: 700, color: p.available === 0 ? 'var(--danger-text)' : p.available <= 5 ? 'var(--warning-text)' : 'var(--success-text)' }}>{p.available}</span></td>
                    <td className="hide-mobile"><span className={`badge ${st.cls}`}>{st.label}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '.25rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => openEdit(p)} className="btn btn-ghost btn-sm" data-tooltip="Edit product" style={{ padding: '.3125rem' }}>
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => setDeleteTarget(p)} className="btn btn-ghost btn-sm" data-tooltip="Delete product" style={{ padding: '.3125rem', color: 'var(--danger-text)' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '.75rem 1rem', borderTop: '1px solid var(--surface-border)',
          }}>
            <p style={{ fontSize: '.75rem', color: 'var(--text-tertiary)' }}>
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of <strong style={{ color: 'var(--text-primary)' }}>{total}</strong> products
            </p>
            <div style={{ display: 'flex', gap: '.375rem', alignItems: 'center' }}>
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn btn-secondary btn-sm" style={{ padding: '.3125rem .5rem' }}><ChevronLeft size={14} /></button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => setPage(n)} className={`btn btn-sm ${page === n ? 'btn-primary' : 'btn-ghost'}`} style={{ minWidth: 32, padding: '.3125rem .375rem', fontSize: '.75rem' }}>{n}</button>
              ))}
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="btn btn-secondary btn-sm" style={{ padding: '.3125rem .5rem' }}><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal open={modalOpen} title={editing ? 'Edit Product' : 'New Product'} onClose={() => !saving && setModalOpen(false)}>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '.875rem' }}>
          <Field label="Product Name *">
            <input className="input" placeholder="e.g. Sony WH-1000XM5 Headphones" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
            <Field label="SKU *">
              <input className="input" placeholder="e.g. SNY-WH1000" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} />
            </Field>
            <Field label="Category">
              <select className="input select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
            <Field label="Price ($) *">
              <input className="input" type="number" min="0" step="0.01" placeholder="0.00" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
            </Field>
            <Field label="Quantity *">
              <input className="input" type="number" min="0" placeholder="0" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
            </Field>
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={() => setModalOpen(false)} disabled={saving} className="btn btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary">
            {saving ? <><span className="spinner spinner-sm" /> Saving…</> : editing ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteTarget} title="Delete Product" onClose={() => !deleting && setDeleteTarget(null)} size="sm">
        <div className="modal-body">
          <p style={{ fontSize: '.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Are you sure you want to permanently delete{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{deleteTarget?.name}</strong>?
            This action cannot be undone.
          </p>
        </div>
        <div className="modal-footer">
          <button onClick={() => setDeleteTarget(null)} disabled={deleting} className="btn btn-secondary">Cancel</button>
          <button onClick={handleDelete} disabled={deleting} className="btn btn-danger">
            {deleting ? <><span className="spinner spinner-sm" /> Deleting…</> : 'Delete Product'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
