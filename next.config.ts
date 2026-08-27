import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Trim the default X-Powered-By response header (Best Practices hygiene).
  poweredByHeader: false,
  images: {
    // Serve AVIF to browsers that accept it, WebP otherwise. Product photos
    // come from Cloudinary (f_auto handles this natively); this covers the
    // hero carousel and any next/image-hosted assets.
    formats: ['image/avif', 'image/webp'],
    // Optimized variants rarely change — cache them on the CDN for 31 days.
    minimumCacheTTL: 2678400,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**'
      },
      // Cloudinary is the project's primary image host (uploads via /api/upload).
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**'
      }
    ]
  }
};

export default nextConfig;
