import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { UserModel } from '@/models/User';
import { verifyPassword } from '@/lib/authCrypto';

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { identifier, email, password } = body;

    const queryInput = (identifier || email || '').trim();
    if (!queryInput || !password) {
      return NextResponse.json({ success: false, error: 'Email/phone and password required' }, { status: 400 });
    }

    const filter = queryInput.includes('@') 
      ? { email: queryInput.toLowerCase() } 
      : { phone: queryInput };

    const user = await UserModel.findOne(filter);

    if (!user) {
      return NextResponse.json({ success: false, error: 'No account found with these credentials' }, { status: 401 });
    }

    if (user.isBlocked) {
      return NextResponse.json({ success: false, error: 'This account has been blocked.' }, { status: 403 });
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        { success: false, error: 'This account has no password set. Please use password reset (Forgot Password) to configure one.' },
        { status: 401 }
      );
    }

    const isValid = verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Incorrect password credentials' }, { status: 401 });
    }

    // Strip sensitive fields
    const safeUser = {
      name: user.name,
      email: user.email,
      phone: user.phone,
      district: user.district,
      fullAddress: user.fullAddress,
      cart: user.cart || [],
      wishlist: user.wishlist || []
    };

    return NextResponse.json({ success: true, user: safeUser });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
