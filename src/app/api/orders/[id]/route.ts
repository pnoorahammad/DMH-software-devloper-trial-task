import { NextRequest, NextResponse } from 'next/server';
import { completeOrder, cancelOrder } from '@/lib/inventory';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { action } = body; // 'complete' or 'cancel'

    let result: { success: boolean; reason?: string };

    if (action === 'complete') {
      result = completeOrder(id);
    } else if (action === 'cancel') {
      result = cancelOrder(id);
    } else {
      return NextResponse.json({ error: 'Invalid action. Use "complete" or "cancel"' }, { status: 400 });
    }

    if (!result.success) {
      return NextResponse.json({ error: result.reason }, { status: 400 });
    }

    return NextResponse.json({ message: `Order ${action}d successfully` });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
