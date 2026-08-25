import { NextResponse } from 'next/server';
import { getHomeFilters } from '@/actions/productActions';

export async function GET() {
  const data = await getHomeFilters();
  return NextResponse.json(data);
}
