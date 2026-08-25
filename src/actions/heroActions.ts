'use server';

import { db } from '@/prisma/db';

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

export async function getHeroSlides() {
  try {
    const slides = await db.heroSlide.findMany({ where: { isActive: true } });
    
    if (!slides || slides.length === 0) {
      // Seed default slides if database has none
      const insertData = DEFAULT_HERO_SLIDES.map(slide => ({
        tag: slide.tag,
        title: slide.title,
        subtitle: slide.subtitle,
        ctaText: slide.ctaText,
        ctaLink: slide.ctaLink,
        image: slide.image,
        order: slide.order,
        isActive: slide.isActive,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      await db.heroSlide.createMany({ data: insertData });
      const seededSlides = await db.heroSlide.findMany({ where: { isActive: true } });
      const sortedSeeded = [...seededSlides].sort((a: any, b: any) => a.order - b.order);
      return { success: true, slides: sortedSeeded };
    }

    // Sort in-memory for safety and speed
    const sorted = [...slides].sort((a: any, b: any) => a.order - b.order);
    return { success: true, slides: sorted };
  } catch (error: any) {
    console.error('getHeroSlides Action Error:', error);
    // Fallback to static slides if db fails
    const fallback = DEFAULT_HERO_SLIDES.map((s, idx) => ({
      id: `fallback-${idx}`,
      ...s,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    return {
      success: true,
      slides: fallback,
      source: 'offline'
    };
  }
}
