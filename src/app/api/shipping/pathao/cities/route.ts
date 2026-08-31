import { NextResponse } from 'next/server';
import { getPathaoCities } from '@/lib/shipping/pathao';

export async function GET() {
  try {
    const cities = await getPathaoCities();
    return NextResponse.json({ success: true, cities });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to fetch Pathao cities';
    console.error('[GET /api/shipping/pathao/cities]', err);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
