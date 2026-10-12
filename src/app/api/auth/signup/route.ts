import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/authCrypto';
import { signUserSessionToken, USER_SESSION_COOKIE, USER_COOKIE_OPTIONS } from '@/lib/session';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, district, fullAddress, password } = body;

    if (!name || !phone || !password) {
      return NextResponse.json(
        { success: false, error: 'Name, phone number, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const cleanPhone = phone.trim();
    const cleanDigits = cleanPhone.replace(/\D/g, '').replace(/^88/, '');
    const userEmail = (email && typeof email === 'string' && email.trim())
      ? email.toLowerCase().trim()
      : `${cleanDigits || cleanPhone}@falakcloset.com`;

    // Check if account already exists with this email or phone
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: userEmail },
          { phone: cleanPhone },
          ...(cleanDigits ? [
            { phone: cleanDigits },
            { phone: `0${cleanDigits}` },
            { phone: `+880${cleanDigits}` },
            { phone: `+88${cleanDigits}` },
            { email: `${cleanDigits}@falakcloset.com` },
          ] : []),
        ],
      },
    });

    if (existing && existing.passwordHash && existing.passwordHash.length > 5) {
      return NextResponse.json(
        { success: false, error: 'An account with this phone number or email already exists. Please sign in.' },
        { status: 409 }
      );
    }

    let user;
    if (existing) {
      // User was created from a guest order without password - upgrade to active account
      user = await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: name.trim(),
          phone: cleanPhone,
          district: district || existing.district || 'Dhaka',
          fullAddress: fullAddress || existing.fullAddress || '',
          passwordHash: hashPassword(password),
          email: userEmail,
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          name: name.trim(),
          email: userEmail,
          phone: cleanPhone,
          district: district || 'Dhaka',
          fullAddress: fullAddress || '',
          passwordHash: hashPassword(password),
          cart: [],
          wishlist: [],
          isBlocked: false,
        },
      });
    }

    // Sign the new account in immediately via the httpOnly session cookie.
    const response = NextResponse.json(
      {
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
      },
      { status: 201 }
    );
    response.cookies.set(USER_SESSION_COOKIE, signUserSessionToken(user.id), USER_COOKIE_OPTIONS);
    return response;
  } catch (error) {
    console.error('[signup]', error);
    return NextResponse.json(
      { success: false, error: 'Server error. Please try again.' },
      { status: 500 }
    );
  }
}
