import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/authCrypto';

// GET /api/user?email=...  — lookup a single user (no password in query!)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const phone = searchParams.get('phone');

    if (!email && !phone) {
      return NextResponse.json(
        { success: false, error: 'Email or phone required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: email ? { email: email.toLowerCase() } : { phone: phone! },
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
        createdAt: true,
        // never select passwordHash or resetOtp
      },
    });

    return NextResponse.json({ success: true, user: user ?? null });
  } catch (error) {
    console.error('[GET /api/user]', error);
    return NextResponse.json({ success: true, user: null, source: 'offline' });
  }
}

// POST /api/user — upsert a user (profile update)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, phone, name, district, fullAddress, password, cart, wishlist, ip } = body;

    if (!email || !phone || !name) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and phone required' },
        { status: 400 }
      );
    }

    const passwordHash = password ? hashPassword(password) : undefined;

    const sharedFields = {
      phone,
      name,
      district: district || 'Dhaka',
      fullAddress: fullAddress || '',
      cart: cart ?? [],
      wishlist: wishlist ?? [],
      ip: ip || '',
      ...(passwordHash ? { passwordHash } : {}),
    };

    const user = await prisma.user.upsert({
      where: { email: email.toLowerCase() },
      update: sharedFields,
      create: {
        email: email.toLowerCase(),
        passwordHash: passwordHash ?? '',
        ...sharedFields,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        district: user.district,
        fullAddress: user.fullAddress,
      },
    });
  } catch (error) {
    console.error('[POST /api/user]', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
