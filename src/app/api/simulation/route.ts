import { NextRequest, NextResponse } from 'next/server';
import { runSimulation } from '@/lib/inventory';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, concurrentRequests, quantityPerRequest } = body;

    if (!productId || !concurrentRequests || !quantityPerRequest) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (concurrentRequests < 1 || concurrentRequests > 100) {
      return NextResponse.json({ error: 'concurrentRequests must be between 1 and 100' }, { status: 400 });
    }

    if (quantityPerRequest < 1 || quantityPerRequest > 10) {
      return NextResponse.json({ error: 'quantityPerRequest must be between 1 and 10' }, { status: 400 });
    }

    const result = runSimulation(productId, Number(concurrentRequests), Number(quantityPerRequest));
    return NextResponse.json({ data: result });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
