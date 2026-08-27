import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : 'Server error';
}

// ─── GET /api/security/block-ip ──────────────────────────────────────────────
// No params → legacy full { blockedIps }. With page/pageSize → server-paginated
// admin view: query (ip/reason), sort (ip|reason|blockedAt), dir + stats.
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const blockedIps = await prisma.blockedIp.findMany({ orderBy: { createdAt: 'desc' } });

    if (!searchParams.has('page') && !searchParams.has('pageSize')) {
      return NextResponse.json({ success: true, blockedIps });
    }

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const pageSize = Math.min(500, Math.max(1, parseInt(searchParams.get('pageSize') || '8', 10) || 8));
    const query = (searchParams.get('query') || '').trim().toLowerCase();
    const sort = ['ip', 'reason', 'blockedAt'].includes(searchParams.get('sort') || '')
      ? searchParams.get('sort')!
      : 'blockedAt';
    const dir = searchParams.get('dir') === 'asc' ? 'asc' : 'desc';

    const searched = query
      ? blockedIps.filter(
          (b) => b.ip.toLowerCase().includes(query) || b.reason.toLowerCase().includes(query)
        )
      : blockedIps;

    const dirMul = dir === 'asc' ? 1 : -1;
    searched.sort((a, b) => {
      if (sort === 'ip') return a.ip.localeCompare(b.ip) * dirMul;
      if (sort === 'reason') return a.reason.localeCompare(b.reason) * dirMul;
      return (new Date(a.blockedAt).getTime() - new Date(b.blockedAt).getTime()) * dirMul;
    });

    const totalItems = searched.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safePage = Math.min(page, totalPages);
    const pageRows = searched.slice((safePage - 1) * pageSize, safePage * pageSize);

    const last24h = blockedIps.filter(
      (b) => Date.now() - new Date(b.blockedAt).getTime() < 24 * 60 * 60 * 1000
    ).length;

    return NextResponse.json({
      success: true,
      blockedIps: pageRows.map((b) => ({
        ip: b.ip,
        reason: b.reason,
        blockedBy: b.blockedBy,
        blockedAt: b.blockedAt.toISOString(),
      })),
      pagination: { page: safePage, pageSize, totalItems, totalPages },
      stats: { totalBlocked: blockedIps.length, blockedLast24h: last24h },
    });
  } catch (err) {
    // A security screen that reports "no blocked IPs" during an outage is worse
    // than one that reports the outage, so this is a real 500.
    console.error('[GET /api/security/block-ip]', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch blocked IPs' },
      { status: 500 }
    );
  }
}

// ─── POST /api/security/block-ip ─────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const { ip, reason, blockedBy } = await req.json();
    const cleanIp = String(ip ?? '').trim();

    if (!cleanIp) {
      return NextResponse.json({ success: false, error: 'IP address required' }, { status: 400 });
    }

    const fields = {
      reason: String(reason ?? '').trim() || 'Blocked by Admin',
      blockedBy: String(blockedBy ?? '').trim() || 'Admin',
      blockedAt: new Date(),
    };

    const blockedIp = await prisma.blockedIp.upsert({
      where: { ip: cleanIp },
      update: fields,
      create: { ip: cleanIp, ...fields },
    });

    return NextResponse.json({ success: true, blockedIp });
  } catch (err) {
    console.error('[POST /api/security/block-ip]', err);
    return NextResponse.json({ success: false, error: errorMessage(err) }, { status: 500 });
  }
}

// ─── DELETE /api/security/block-ip?ip=... ────────────────────────────────────
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ip = String(searchParams.get('ip') ?? '').trim();

    if (!ip) {
      return NextResponse.json({ success: false, error: 'IP address required' }, { status: 400 });
    }

    const existing = await prisma.blockedIp.findUnique({ where: { ip } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: `IP ${ip} is not currently blocked` },
        { status: 404 }
      );
    }

    await prisma.blockedIp.delete({ where: { ip } });
    return NextResponse.json({ success: true, message: `IP ${ip} unblocked successfully` });
  } catch (err) {
    console.error('[DELETE /api/security/block-ip]', err);
    return NextResponse.json({ success: false, error: errorMessage(err) }, { status: 500 });
  }
}
