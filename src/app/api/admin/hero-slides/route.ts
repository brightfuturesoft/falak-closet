import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectToDatabase } from '@/lib/db';
import { HeroSlideModel } from '@/models/HeroSlide';

// Helper function to check admin session authentication
async function isAuthenticatedAdmin() {
  try {
    const cookieStore = await cookies();
    return cookieStore.get('falak_admin_session')?.value === 'true';
  } catch {
    return false;
  }
}

// GET all slides (including inactive) sorted by order
export async function GET() {
  try {
    if (!(await isAuthenticatedAdmin())) {
      return NextResponse.json({ success: false, error: 'Unauthorized admin access' }, { status: 401 });
    }

    await connectToDatabase();
    const slides = await HeroSlideModel.find({}).sort({ order: 1 });
    return NextResponse.json({ success: true, slides });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

// POST create a new slide
export async function POST(req: Request) {
  try {
    if (!(await isAuthenticatedAdmin())) {
      return NextResponse.json({ success: false, error: 'Unauthorized admin access' }, { status: 401 });
    }

    await connectToDatabase();
    const body = await req.json();
    const { tag, title, subtitle, ctaText, ctaLink, image, order, isActive } = body;

    // Validate required fields
    if (!tag || !title || !subtitle || !ctaText || !ctaLink || !image) {
      return NextResponse.json(
        { success: false, error: 'All fields (tag, title, subtitle, ctaText, ctaLink, image) are required' },
        { status: 400 }
      );
    }

    const newSlide = await HeroSlideModel.create({
      tag: tag.trim(),
      title: title.trim(),
      subtitle: subtitle.trim(),
      ctaText: ctaText.trim(),
      ctaLink: ctaLink.trim(),
      image: image.trim(),
      order: Number(order) || 0,
      isActive: isActive !== false
    });

    return NextResponse.json({ success: true, slide: newSlide });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
