/**
 * cloudinary.ts — Reusable client-side helpers for the Cloudinary storage layer.
 *
 * Uploads always go through the signed server route (/api/upload); this module
 * only shapes requests/results and derives cheap URL transforms. Nothing here
 * touches API secrets.
 */

export interface UploadedImage {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
}

/**
 * Upload one or many images via POST /api/upload.
 * Uploads are sequential so `onProgress` stays meaningful; typical batches are
 * small (a handful of product photos) so parallelism isn't worth the complexity.
 */
export async function uploadImages(
  input: File | File[],
  folder?: string,
  onProgress?: (done: number, total: number) => void
): Promise<UploadedImage[]> {
  const files = Array.isArray(input) ? input : [input];
  if (files.length === 0) return [];

  const results: UploadedImage[] = [];

  for (let i = 0; i < files.length; i++) {
    const form = new FormData();
    form.append('file', files[i]);
    if (folder) form.append('folder', folder);

    let res: Response;
    try {
      res = await fetch('/api/upload', { method: 'POST', body: form });
    } catch {
      throw new Error('Upload failed — check your connection and try again.');
    }

    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.success || !Array.isArray(data.results)) {
      throw new Error(data?.error || `Upload failed (HTTP ${res.status})`);
    }

    for (const r of data.results) {
      results.push({
        url: r.secureUrl || r.url,
        publicId: r.publicId,
        ...(typeof r.width === 'number' ? { width: r.width } : {}),
        ...(typeof r.height === 'number' ? { height: r.height } : {}),
      });
    }
    onProgress?.(i + 1, files.length);
  }

  return results;
}

/** Best-effort Cloudinary asset cleanup — never throws, never blocks the UI. */
export async function deleteCloudinaryImage(publicId: string): Promise<boolean> {
  try {
    const res = await fetch('/api/upload', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicId }),
    });
    return res.ok;
  } catch (err) {
    console.warn('[deleteCloudinaryImage] failed:', publicId, err);
    return false;
  }
}

/** True for Cloudinary delivery URLs (https://res.cloudinary.com/...). */
export function isCloudinaryUrl(src: string): boolean {
  return typeof src === 'string' && src.includes('res.cloudinary.com');
}

/**
 * Parse the public id out of a delivery URL, e.g.
 * `.../image/upload/v1712345678/falak-closet/products/abc.jpg`
 *   → `falak-closet/products/abc`
 * Returns null for anything that isn't a plain Cloudinary URL.
 */
export function cloudinaryPublicIdFromUrl(url: string): string | null {
  if (!isCloudinaryUrl(url)) return null;

  try {
    const { pathname } = new URL(url);
    const marker = '/image/upload/';
    const idx = pathname.indexOf(marker);
    if (idx === -1) return null;

    let rest = pathname.slice(idx + marker.length);
    // Drop a leading version segment (v1712345678) if present.
    if (/^v\d+\//.test(rest)) rest = rest.replace(/^v\d+\//, '');
    // Drop the extension — public ids never include it.
    const dot = rest.lastIndexOf('.');
    if (dot > -1) rest = rest.slice(0, dot);

    return rest || null;
  } catch {
    return null;
  }
}

/**
 * Inject f_auto,q_auto (+ optional w/h/c_fill) into an existing Cloudinary URL
 * right after `/upload/`. Non-Cloudinary URLs pass through untouched, so this
 * is safe to call on any stored image src.
 */
export function cloudinaryThumb(url: string, w: number, h?: number): string {
  if (!isCloudinaryUrl(url)) return url;

  const transforms = [
    'f_auto',
    'q_auto',
    `w_${w}`,
    ...(h ? [`h_${h}`, 'c_fill'] : []),
  ].join(',');

  // Only a leading version segment (v1712345678/) is dropped — real folder
  // paths stay untouched. Pre-existing transform segments (rare in our URLs)
  // simply accumulate, which is valid Cloudinary syntax.
  return url.replace(/\/upload\/(?:v\d+\/)?/, `/upload/${transforms}/`);
}
