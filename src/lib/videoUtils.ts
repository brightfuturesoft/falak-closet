/**
 * videoUtils.ts — Helpers for video URL parsing, YouTube ID extraction, and embed URL building.
 */

/**
 * Extracts YouTube video ID (11 characters) from all standard YouTube URL patterns:
 * - Standard Watch: https://www.youtube.com/watch?v=dQw4w9WgXcQ
 * - Shortened: https://youtu.be/dQw4w9WgXcQ
 * - YouTube Shorts: https://www.youtube.com/shorts/dQw4w9WgXcQ
 * - Embed: https://www.youtube.com/embed/dQw4w9WgXcQ
 * - Mobile: https://m.youtube.com/watch?v=dQw4w9WgXcQ
 * - With query params: https://youtu.be/dQw4w9WgXcQ?si=abcdef&t=10
 */
export function getYouTubeVideoId(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  const match = trimmed.match(
    /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i
  );
  return match ? match[1] : null;
}

/** True when the string is a recognized YouTube video link */
export function isYouTubeUrl(url: string | null | undefined): boolean {
  return Boolean(getYouTubeVideoId(url));
}

export interface YouTubeEmbedOptions {
  autoplay?: boolean;
  mute?: boolean;
  loop?: boolean;
  controls?: boolean;
}

/**
 * Generates a clean, privacy-enhanced youtube-nocookie embed URL with optimal parameters.
 */
export function getYouTubeEmbedUrl(
  url: string | null | undefined,
  options: YouTubeEmbedOptions = {}
): string | null {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return null;

  const {
    autoplay = true,
    mute = true,
    loop = true,
    controls = true,
  } = options;

  const params = new URLSearchParams();
  if (autoplay) params.set('autoplay', '1');
  if (mute) params.set('mute', '1');
  if (loop) {
    params.set('loop', '1');
    params.set('playlist', videoId);
  }
  params.set('controls', controls ? '1' : '0');
  params.set('rel', '0');
  params.set('modestbranding', '1');
  params.set('playsinline', '1');
  params.set('enablejsapi', '1');

  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}
