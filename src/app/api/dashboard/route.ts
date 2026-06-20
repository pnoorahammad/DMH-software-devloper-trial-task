import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();

    // Dashboard stats
    const stats = db.prepare(`
      SELECT
        COUNT(*) as totalProducts,
        SUM(quantity) as totalStock,
        SUM(reserved) as reservedStock,
        SUM(quantity - reserved) as availableStock
      FROM products
    `).get() as { totalProducts: number; totalStock: number; reservedStock: number; availableStock: number };

    const orderStats = db.prepare(`
      SELECT
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completedOrders,
        SUM(CASE WHEN status = 'completed' THEN total_price ELSE 0 END) as totalRevenue
      FROM orders
    `).get() as { completedOrders: number; totalRevenue: number };

    const lowStockProducts = db.prepare(`
      SELECT *, (quantity - reserved) as available
      FROM products
      WHERE (quantity - reserved) <= 5
      ORDER BY (quantity - reserved) ASC
    `).all();

    return NextResponse.json({
      data: {
        ...stats,
        ...orderStats,
        lowStockProducts,
      }
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
