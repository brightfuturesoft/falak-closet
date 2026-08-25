import { NextResponse } from 'next/server';
import { getHeroSlides } from '@/actions/heroActions';

export async function GET() {
  const data = await getHeroSlides();
  return NextResponse.json(data);
}
