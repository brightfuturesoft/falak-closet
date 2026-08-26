import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/authCrypto';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, district, fullAddress, password } = body;

    if (!name || !email || !phone || !password) {
      return NextResponse.json(
        { success: false, error: 'Name, email, phone, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists. Please sign in.' },
        { status: 409 }
      );
    }

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        district: district || 'Dhaka',
        fullAddress: fullAddress || '',
        passwordHash: hashPassword(password),
        cart: [],
        wishlist: [],
        isBlocked: false,
      },
    });

    return NextResponse.json(
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
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[signup]', error);
    return NextResponse.json(
      { success: false, error: 'Server error. Please try again.' },
      { status: 500 }
    );
  }
}
