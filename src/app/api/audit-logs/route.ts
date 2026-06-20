import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    const total = (db.prepare('SELECT COUNT(*) as c FROM audit_logs').get() as { c: number }).c;
    const logs = db.prepare(`
      SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).all(limit, offset);

    return NextResponse.json({ data: logs, total, page, limit });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
