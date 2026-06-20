import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();

    const ordersByDay = db.prepare(`
      SELECT
        date(created_at) as date,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
        COUNT(CASE WHEN status = 'reserved' THEN 1 END) as reserved
      FROM orders
      GROUP BY date(created_at)
      ORDER BY date DESC
      LIMIT 30
    `).all();

    const topProducts = db.prepare(`
      SELECT
        p.name, p.sku,
        COUNT(o.id) as totalOrdered,
        SUM(CASE WHEN o.status = 'completed' THEN o.total_price ELSE 0 END) as revenue
      FROM products p
      LEFT JOIN orders o ON p.id = o.product_id AND o.status = 'completed'
      GROUP BY p.id
      ORDER BY revenue DESC
      LIMIT 10
    `).all();

    const stockUsage = db.prepare(`
      SELECT name, quantity as totalStock, reserved, (quantity - reserved) as available
      FROM products
      ORDER BY quantity DESC
      LIMIT 10
    `).all();

    const orderStatusBreakdown = db.prepare(`
      SELECT status, COUNT(*) as count FROM orders GROUP BY status
    `).all();

    const oversellBlocked = (db.prepare(`
      SELECT COUNT(*) as c FROM audit_logs WHERE action = 'OVERSELL_ATTEMPT_BLOCKED'
    `).get() as { c: number }).c;

    const revenueByDay = db.prepare(`
      SELECT
        date(created_at) as date,
        SUM(total_price) as revenue
      FROM orders
      WHERE status = 'completed'
      GROUP BY date(created_at)
      ORDER BY date DESC
      LIMIT 30
    `).all();

    return NextResponse.json({
      data: {
        ordersByDay,
        topProducts,
        stockUsage,
        orderStatusBreakdown,
        revenueByDay,
        oversellBlocked,
      }
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
