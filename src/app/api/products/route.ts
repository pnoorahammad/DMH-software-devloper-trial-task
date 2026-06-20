import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = `
      SELECT *, (quantity - reserved) as available
      FROM products
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (search) {
      query += ` AND (name LIKE ? OR sku LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    if (category) {
      query += ` AND category = ?`;
      params.push(category);
    }

    const countQuery = query.replace('SELECT *, (quantity - reserved) as available', 'SELECT COUNT(*) as total');
    const total = (db.prepare(countQuery).get(...params) as { total: number }).total;

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const products = db.prepare(query).all(...params);

    return NextResponse.json({ data: products, total, page, limit });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();
    const { name, sku, price, quantity, category } = body;

    if (!name || !sku || price === undefined || quantity === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const id = uuidv4();

    db.prepare(`
      INSERT INTO products (id, name, sku, price, quantity, category)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, name.trim(), sku.trim().toUpperCase(), Number(price), Number(quantity), category || 'General');

    db.prepare(`
      INSERT INTO audit_logs (id, action, entity_type, entity_id, details)
      VALUES (?, 'PRODUCT_CREATED', 'product', ?, ?)
    `).run(uuidv4(), id, JSON.stringify({ name, sku, price, quantity, category }));

    const product = db.prepare('SELECT *, (quantity - reserved) as available FROM products WHERE id = ?').get(id);
    return NextResponse.json({ data: product, message: 'Product created successfully' }, { status: 201 });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).message?.includes('UNIQUE constraint')) {
      return NextResponse.json({ error: 'SKU already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
