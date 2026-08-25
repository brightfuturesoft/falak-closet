import { NextResponse } from 'next/server';
import { getUser, registerOrUpdateUser } from '@/actions/userActions';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email') || undefined;
    const phone = searchParams.get('phone') || undefined;
    const password = searchParams.get('password') || undefined;
    const data = await getUser({ email, phone, password });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = await registerOrUpdateUser(body);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
