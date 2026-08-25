import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { HeroSlideModel } from '@/models/HeroSlide';

const DEFAULT_HERO_SLIDES = [
  {
    tag: 'FRESH OFFERS',
    title: 'Style picks for every plan',
    subtitle: 'Discover clothing deals, curated collections, and easy checkout in one place.',
    ctaText: 'View Offers',
    ctaLink: '/live-promotions',
    image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=1600&q=85',
    order: 1,
    isActive: true
  },
  {
    tag: 'SEASONAL DEALS',
    title: 'New looks with better prices',
    subtitle: 'Explore timely offers across clothes, fabrics, accessories, and more.',
    ctaText: 'Shop Deals',
    ctaLink: '/shop',
    image: 'https://images.unsplash.com/photo-1563178406-4cdc2923acbc?auto=format&fit=crop&w=1600&q=85',
    order: 2,
    isActive: true
  }
];

export async function GET() {
  try {
    await connectToDatabase();
    const slides = await HeroSlideModel.find({ isActive: true }).sort({ order: 1 });

    if (slides.length === 0) {
      // Seed default slides if database has none
      const seeded = await HeroSlideModel.insertMany(DEFAULT_HERO_SLIDES);
      return NextResponse.json({ success: true, slides: seeded });
    }

    return NextResponse.json({ success: true, slides });
  } catch (error) {
    console.error('Public Hero API Error:', error);
    // Fallback to static slides if db fails
    return NextResponse.json({ 
      success: true, 
      slides: DEFAULT_HERO_SLIDES.map((s, idx) => ({ ...s, id: `fallback-${idx}` })),
      source: 'offline' 
    });
  }
}
