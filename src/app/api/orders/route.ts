import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { reserveStock } from '@/lib/inventory';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = `
      SELECT o.*, p.name as product_name, p.sku as product_sku
      FROM orders o
      JOIN products p ON o.product_id = p.id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (status) {
      query += ` AND o.status = ?`;
      params.push(status);
    }

    const countQuery = query.replace(
      'SELECT o.*, p.name as product_name, p.sku as product_sku',
      'SELECT COUNT(*) as total'
    );
    const total = (db.prepare(countQuery).get(...params) as { total: number }).total;

    query += ` ORDER BY o.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const orders = db.prepare(query).all(...params);
    return NextResponse.json({ data: orders, total, page, limit });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, quantity, customerName } = body;

    if (!productId || !quantity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = reserveStock(productId, Number(quantity), customerName || 'Customer');

    if (!result.success) {
      return NextResponse.json({ error: result.reason }, { status: 409 });
    }

    const db = getDb();
    const order = db.prepare(`
      SELECT o.*, p.name as product_name, p.sku as product_sku
      FROM orders o JOIN products p ON o.product_id = p.id
      WHERE o.id = ?
    `).get(result.orderId);

    return NextResponse.json({ data: order, message: 'Stock reserved successfully' }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
