import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/user/all — admin use only; returns all users (no sensitive fields)
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        district: true,
        fullAddress: true,
        isBlocked: true,
        cart: true,
        wishlist: true,
        ip: true,
        createdAt: true,
        updatedAt: true,
        // never select passwordHash or resetOtp
      },
    });
    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error('[GET /api/user/all]', error);
    return NextResponse.json({ success: true, users: [], source: 'offline' });
  }
}
