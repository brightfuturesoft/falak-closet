import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { BlockedIpModel } from '@/models/BlockedIp';

export async function GET() {
  try {
    await connectToDatabase();
    const blockedIps = await BlockedIpModel.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, blockedIps });
  } catch (error) {
    return NextResponse.json({ success: true, blockedIps: [], source: 'offline' });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { ip, reason, blockedBy } = await req.json();

    if (!ip || !ip.trim()) {
      return NextResponse.json({ success: false, error: 'IP address required' }, { status: 400 });
    }

    const cleanIp = ip.trim();
    const blocked = await BlockedIpModel.findOneAndUpdate(
      { ip: cleanIp },
      { ip: cleanIp, reason: reason || 'Blocked by Admin', blockedBy: blockedBy || 'Admin', blockedAt: new Date() },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, blockedIp: blocked });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const ip = searchParams.get('ip');

    if (!ip) {
      return NextResponse.json({ success: false, error: 'IP address required' }, { status: 400 });
    }

    await BlockedIpModel.deleteOne({ ip: ip.trim() });
    return NextResponse.json({ success: true, message: `IP ${ip} unblocked successfully` });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
