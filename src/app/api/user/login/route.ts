import { NextResponse } from 'next/server';
import { loginUser } from '@/actions/userActions';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = await loginUser(body);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
