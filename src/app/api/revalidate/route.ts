import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { CATEGORIES_TAG } from '@/lib/fetcher';

/**
 * POST /api/revalidate?tag=categories
 *
 * Manual/webhook cache invalidation hook. Mutations in /api/categories already
 * bust their own cache, so this is for external triggers (CMS webhook, cron, admin
 * "hard refresh"). `{ expire: 0 }` expires immediately, which is what an external
 * caller wants — a plain profile would only mark the tag stale.
 */
export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const tag = searchParams.get('tag') ?? CATEGORIES_TAG;

  revalidateTag(tag, { expire: 0 });

  return NextResponse.json({ success: true, revalidated: tag, ts: Date.now() });
}
