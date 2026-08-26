import HomeClient from './HomeClient';
import { getActiveSlidesSafe } from '@/lib/heroSlides';
import { getActiveBannersSafe } from '@/lib/promotionBanners';

/**
 * Thin server shell for the home page. It fetches the hero slides and the top
 * promo banner through their cached libs (unstable_cache + tags, busted by the
 * admin APIs on every write) and hands them to the interactive client half,
 * so both land in the initial server-rendered HTML.
 */
export default async function HomePage() {
  const [{ slides }, banners] = await Promise.all([
    getActiveSlidesSafe(),
    getActiveBannersSafe(),
  ]);
  return <HomeClient heroSlides={slides} promoBanner={banners[0] ?? null} />;
}
