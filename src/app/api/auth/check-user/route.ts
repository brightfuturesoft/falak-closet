import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

export async function POST(req: Request) {
  try {
    // 1. First verify if current browser session is logged in
    const sessionUser = await getSessionUser();
    if (sessionUser) {
      return NextResponse.json({
        success: true,
        isLoggedIn: true,
        accountExists: true,
        hasPassword: true,
        user: {
          id: sessionUser.id,
          name: sessionUser.name,
          phone: sessionUser.phone,
          email: sessionUser.email,
          district: sessionUser.district,
          fullAddress: sessionUser.fullAddress,
        },
      });
    }

    // 2. Parse request body to check phone or email
    const body = await req.json().catch(() => ({}));
    const rawPhone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const rawEmail = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const cleanDigits = rawPhone.replace(/\D/g, '').replace(/^88/, '');

    if (!rawPhone && !rawEmail && !cleanDigits) {
      return NextResponse.json({
        success: true,
        isLoggedIn: false,
        accountExists: false,
        user: null,
      });
    }

    const whereConditions: any[] = [];

    if (rawEmail) {
      whereConditions.push({ email: rawEmail });
    }

    if (rawPhone) {
      whereConditions.push({ phone: rawPhone });
    }

    if (cleanDigits) {
      whereConditions.push(
        { phone: cleanDigits },
        { phone: `0${cleanDigits}` },
        { phone: `+880${cleanDigits}` },
        { phone: `+88${cleanDigits}` },
        { email: `${cleanDigits}@falakcloset.com` }
      );
    }

    const matchedUser = await prisma.user.findFirst({
      where: { OR: whereConditions },
    });

    if (matchedUser) {
      const hasPassword = Boolean(
        matchedUser.passwordHash && matchedUser.passwordHash.length > 5
      );

      return NextResponse.json({
        success: true,
        isLoggedIn: false,
        accountExists: true,
        hasPassword,
        user: {
          id: matchedUser.id,
          name: matchedUser.name,
          phone: matchedUser.phone,
          email: matchedUser.email,
          district: matchedUser.district,
          fullAddress: matchedUser.fullAddress,
        },
      });
    }

    return NextResponse.json({
      success: true,
      isLoggedIn: false,
      accountExists: false,
      user: null,
    });
  } catch (error) {
    console.error('[check-user error]', error);
    return NextResponse.json(
      { success: false, error: 'Could not verify user account' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (sessionUser) {
      return NextResponse.json({
        success: true,
        isLoggedIn: true,
        accountExists: true,
        hasPassword: true,
        user: {
          id: sessionUser.id,
          name: sessionUser.name,
          phone: sessionUser.phone,
          email: sessionUser.email,
          district: sessionUser.district,
          fullAddress: sessionUser.fullAddress,
        },
      });
    }

    return NextResponse.json({
      success: true,
      isLoggedIn: false,
      accountExists: false,
      user: null,
    });
  } catch (error) {
    console.error('[check-user GET error]', error);
    return NextResponse.json(
      { success: false, error: 'Could not check session' },
      { status: 500 }
    );
  }
}
