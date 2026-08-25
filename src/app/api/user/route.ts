import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { UserModel } from '@/models/User';
import { hashPassword, verifyPassword } from '@/lib/authCrypto';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const phone = searchParams.get('phone');
    const password = searchParams.get('password');

    if (!email && !phone) {
      return NextResponse.json({ success: false, error: 'Email or phone required' }, { status: 400 });
    }

    await connectToDatabase();
    const filter = email ? { email: email.toLowerCase() } : { phone };
    const user = await UserModel.findOne(filter);

    if (!user) {
      return NextResponse.json({ success: true, user: null });
    }

    // Verify password if provided
    if (password && user.passwordHash) {
      const isValid = verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return NextResponse.json({ success: false, error: 'Incorrect password' }, { status: 401 });
      }
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    return NextResponse.json({ success: true, user: null, source: 'offline' });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { email, phone, name, district, fullAddress, password, cart, wishlist, ip } = body;

    if (!email || !phone || !name) {
      return NextResponse.json({ success: false, error: 'Name, email, and phone required' }, { status: 400 });
    }

    const updateFields: any = {
      email: email.toLowerCase(),
      phone,
      name,
      district: district || 'Dhaka',
      fullAddress: fullAddress || '',
      cart: cart || [],
      wishlist: wishlist || [],
      ip: ip || ''
    };

    if (password) {
      updateFields.passwordHash = hashPassword(password);
    }

    const updatedUser = await UserModel.findOneAndUpdate(
      { email: email.toLowerCase() },
      updateFields,
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
