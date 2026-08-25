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

// PUT update an existing slide
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAuthenticatedAdmin())) {
      return NextResponse.json({ success: false, error: 'Unauthorized admin access' }, { status: 401 });
    }

    await connectToDatabase();
    const resolvedParams = await params;
    const slideId = resolvedParams.id;
    const body = await req.json();

    const updatedSlide = await HeroSlideModel.findByIdAndUpdate(
      slideId,
      body,
      { new: true }
    );

    if (!updatedSlide) {
      return NextResponse.json({ success: false, error: 'Hero slide not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, slide: updatedSlide });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE a slide
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAuthenticatedAdmin())) {
      return NextResponse.json({ success: false, error: 'Unauthorized admin access' }, { status: 401 });
    }

    await connectToDatabase();
    const resolvedParams = await params;
    const slideId = resolvedParams.id;

    const deleted = await HeroSlideModel.findByIdAndDelete(slideId);

    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Hero slide not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Hero slide deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
