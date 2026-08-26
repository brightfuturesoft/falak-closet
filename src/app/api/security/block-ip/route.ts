import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : 'Server error';
}

// ─── GET /api/security/block-ip ──────────────────────────────────────────────
export async function GET() {
  try {
    const blockedIps = await prisma.blockedIp.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ success: true, blockedIps });
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
