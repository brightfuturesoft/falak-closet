import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/session';

export async function GET() {
  try {
    const authenticated = await isAdminAuthenticated();
    return NextResponse.json({ authenticated });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}
