import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();
    const product = db.prepare('SELECT *, (quantity - reserved) as available FROM products WHERE id = ?').get(id);
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    return NextResponse.json({ data: product });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();
    const body = await req.json();
    const { name, sku, price, quantity, category } = body;

    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as { quantity: number; reserved: number } | undefined;
    if (!existing) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    if (quantity !== undefined && Number(quantity) < existing.reserved) {
      return NextResponse.json(
        { error: `Cannot set quantity below reserved amount (${existing.reserved})` },
        { status: 400 }
      );
    }

    const fields: string[] = [];
    const values: (string | number)[] = [];

    if (name !== undefined) { fields.push('name = ?'); values.push(name.trim()); }
    if (sku !== undefined) { fields.push('sku = ?'); values.push(sku.trim().toUpperCase()); }
    if (price !== undefined) { fields.push('price = ?'); values.push(Number(price)); }
    if (quantity !== undefined) { fields.push('quantity = ?'); values.push(Number(quantity)); }
    if (category !== undefined) { fields.push('category = ?'); values.push(category); }
    fields.push("updated_at = datetime('now')");

    values.push(id);

    db.prepare(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`).run(...values);

    db.prepare(`
      INSERT INTO audit_logs (id, action, entity_type, entity_id, details)
      VALUES (?, 'STOCK_UPDATED', 'product', ?, ?)
    `).run(uuidv4(), id, JSON.stringify({ name, sku, price, quantity, category }));

    const updated = db.prepare('SELECT *, (quantity - reserved) as available FROM products WHERE id = ?').get(id);
    return NextResponse.json({ data: updated, message: 'Product updated successfully' });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).message?.includes('UNIQUE constraint')) {
      return NextResponse.json({ error: 'SKU already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as { name: string; reserved: number } | undefined;
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    if (product.reserved > 0) {
      return NextResponse.json(
        { error: 'Cannot delete product with active reservations' },
        { status: 400 }
      );
    }

    db.prepare('DELETE FROM products WHERE id = ?').run(id);

    db.prepare(`
      INSERT INTO audit_logs (id, action, entity_type, entity_id, details)
      VALUES (?, 'PRODUCT_DELETED', 'product', ?, ?)
    `).run(uuidv4(), id, JSON.stringify({ name: product.name }));

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
