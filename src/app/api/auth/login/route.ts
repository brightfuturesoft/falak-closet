import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, hashPassword, needsRehash } from '@/lib/authCrypto';
import { signUserSessionToken, USER_SESSION_COOKIE, USER_COOKIE_OPTIONS } from '@/lib/session';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const loginId = (body.identifier || body.email || body.phone || '').trim();
    const password = typeof body.password === 'string' ? body.password : '';

    if (!loginId || !password) {
      return NextResponse.json(
        { success: false, error: 'Email or phone number and password are required' },
        { status: 400 }
      );
    }

    const isEmail = loginId.includes('@');
    const cleanDigits = loginId.replace(/\D/g, '').replace(/^88/, '');

    const user = await prisma.user.findFirst({
      where: isEmail
        ? { email: loginId.toLowerCase() }
        : {
            OR: [
              { phone: loginId },
              { phone: cleanDigits },
              { phone: `0${cleanDigits}` },
              { phone: `+880${cleanDigits}` },
              { phone: `+88${cleanDigits}` },
              { email: loginId.toLowerCase() },
              ...(cleanDigits ? [{ email: `${cleanDigits}@falakcloset.com` }] : []),
            ],
          },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No account found with this email or phone number' },
        { status: 404 }
      );
    }

    if (user.isBlocked) {
      return NextResponse.json(
        { success: false, error: 'This account has been suspended. Please contact support.' },
        { status: 403 }
      );
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        { success: false, error: 'No password set for this account. Please reset your password.' },
        { status: 401 }
      );
    }

    const isValid = verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Incorrect password. Please try again.' },
        { status: 401 }
      );
    }

    // Upgrade legacy shared-salt hashes to per-user-salt format on successful login.
    if (needsRehash(user.passwordHash)) {
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: hashPassword(password) },
      });
    }

    // Establish the httpOnly server session.
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        district: user.district,
        fullAddress: user.fullAddress,
      },
      wishlist: user.wishlist ?? [],
      cart: user.cart ?? [],
    });
    response.cookies.set(USER_SESSION_COOKIE, signUserSessionToken(user.id), USER_COOKIE_OPTIONS);
    return response;
  } catch (error) {
    console.error('[login]', error);
    return NextResponse.json(
      { success: false, error: 'Server error. Please try again.' },
      { status: 500 }
    );
  }
}
