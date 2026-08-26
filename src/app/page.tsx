import HomeClient from './HomeClient';
import { getActiveSlidesSafe } from '@/lib/heroSlides';

/**
 * Thin server shell for the home page. It fetches the hero slides through the
 * cached lib (unstable_cache + HERO_SLIDES_TAG, busted by /api/hero-slides on
 * every admin write) and hands them to the interactive client half, so the
 * hero lands in the initial server-rendered HTML.
 */
export default async function HomePage() {
  const { slides } = await getActiveSlidesSafe();
  return <HomeClient heroSlides={slides} />;
}
