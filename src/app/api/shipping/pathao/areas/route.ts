import { NextRequest, NextResponse } from 'next/server';
import { getPathaoAreas } from '@/lib/shipping/pathao';

export async function GET(req: NextRequest) {
  try {
    const zoneIdStr = req.nextUrl.searchParams.get('zoneId');
    if (!zoneIdStr) {
      return NextResponse.json({ success: false, error: 'zoneId parameter is required' }, { status: 400 });
    }

    const zoneId = parseInt(zoneIdStr, 10);
    if (isNaN(zoneId)) {
      return NextResponse.json({ success: false, error: 'Invalid zoneId parameter' }, { status: 400 });
    }

    const areas = await getPathaoAreas(zoneId);
    return NextResponse.json({ success: true, areas });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to fetch Pathao areas';
    console.error('[GET /api/shipping/pathao/areas]', err);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
