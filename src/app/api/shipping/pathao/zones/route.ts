import { NextRequest, NextResponse } from 'next/server';
import { getPathaoZones } from '@/lib/shipping/pathao';

export async function GET(req: NextRequest) {
  try {
    const cityIdStr = req.nextUrl.searchParams.get('cityId');
    if (!cityIdStr) {
      return NextResponse.json({ success: false, error: 'cityId parameter is required' }, { status: 400 });
    }

    const cityId = parseInt(cityIdStr, 10);
    if (isNaN(cityId)) {
      return NextResponse.json({ success: false, error: 'Invalid cityId parameter' }, { status: 400 });
    }

    const zones = await getPathaoZones(cityId);
    return NextResponse.json({ success: true, zones });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to fetch Pathao zones';
    console.error('[GET /api/shipping/pathao/zones]', err);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
