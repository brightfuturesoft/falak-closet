import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { UserModel } from '@/models/User';

export async function GET() {
  try {
    await connectToDatabase();
    const users = await UserModel.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, users });
  } catch (error) {
    return NextResponse.json({ success: true, users: [], source: 'offline' });
  }
}
