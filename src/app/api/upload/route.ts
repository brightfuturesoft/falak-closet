import { NextResponse } from 'next/server';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';

/**
 * Signed Cloudinary upload/delete endpoint.
 *
 * The only place in the app that touches the Cloudinary SDK — API secrets live
 * here (server) and never cross to the client. Uploads land under a single
 * `falak-closet/` namespace so assets are easy to prune per area (products,
 * banners, …).
 */

// Route handlers are dynamic by default in Next 16 — keep uploads uncached.
export const dynamic = 'force-dynamic';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB per image
const MAX_VIDEO_BYTES = 60 * 1024 * 1024; // 60 MB per video
const NAMESPACE = 'falak-closet';
const FOLDER_RE = /^[a-z0-9/_-]{1,60}$/;

function cloudName(): string | null {
  return process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim() || null;
}

function configured(): boolean {
  return Boolean(process.env.CLOUDINARY_URL);
}

/** `products` → `falak-closet/products`; rejects anything unexpected. */
function safeFolder(raw: unknown): string | null {
  const hint = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  if (!hint) return NAMESPACE;
  if (!FOLDER_RE.test(hint)) return null;
  return `${NAMESPACE}/${hint}`;
}

interface UploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
  width: number | null;
  height: number | null;
  format: string;
  bytes: number;
}

// ─── POST /api/upload — multipart/form-data { file | files[], folder? } ──────
export async function POST(req: Request) {
  if (!configured() || !cloudName()) {
    console.error('[POST /api/upload] Cloudinary is not configured');
    return NextResponse.json(
      { success: false, error: 'Cloudinary is not configured' },
      { status: 500 }
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Expected multipart/form-data' },
      { status: 400 }
    );
  }

  const folder = safeFolder(form.get('folder'));
  if (!folder) {
    return NextResponse.json(
      { success: false, error: 'Invalid folder name' },
      { status: 400 }
    );
  }

  const files = [...form.getAll('file'), ...form.getAll('files')].filter(
    (f): f is File => f instanceof File
  );
  if (files.length === 0) {
    return NextResponse.json(
      { success: false, error: 'No media file provided' },
      { status: 400 }
    );
  }

  const results: UploadResult[] = [];
  for (const file of files) {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { success: false, error: `"${file.name}" is not a supported image or video`, uploaded: results },
        { status: 400 }
      );
    }

    const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (file.size > maxBytes) {
      return NextResponse.json(
        {
          success: false,
          error: `"${file.name}" exceeds the ${isVideo ? '60 MB' : '10 MB'} limit`,
          uploaded: results,
        },
        { status: 413 }
      );
    }

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const resourceType = isVideo ? 'video' : 'image';
      const uploaded = await new Promise<UploadApiResponse>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder, resource_type: resourceType, filename: file.name },
          (err, res) => (err || !res ? reject(err ?? new Error('Empty Cloudinary response')) : resolve(res))
        );
        stream.end(buffer);
      });

      results.push({
        url: uploaded.url,
        secureUrl: uploaded.secure_url,
        publicId: uploaded.public_id,
        width: uploaded.width ?? null,
        height: uploaded.height ?? null,
        format: uploaded.format,
        bytes: uploaded.bytes ?? file.size,
      });
    } catch (err) {
      console.error('[POST /api/upload]', err);
      return NextResponse.json(
        {
          success: false,
          error: `Cloudinary rejected "${file.name}"`,
          uploaded: results,
        },
        { status: 502 }
      );
    }
  }

  return NextResponse.json({ success: true, results }, { status: 201 });
}

// ─── DELETE /api/upload — body { publicId } ─────────────────────────────────
export async function DELETE(req: Request) {
  if (!configured() || !cloudName()) {
    console.error('[DELETE /api/upload] Cloudinary is not configured');
    return NextResponse.json(
      { success: false, error: 'Cloudinary is not configured' },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => null);
  const publicId = typeof body?.publicId === 'string' ? body.publicId.trim() : '';

  // Only our own namespace is deletable — never arbitrary Cloudinary paths.
  if (!publicId.startsWith(`${NAMESPACE}/`)) {
    return NextResponse.json(
      { success: false, error: 'Invalid publicId' },
      { status: 400 }
    );
  }

  try {
    const outcome = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
    });
    // 'not found' is fine — the asset is gone either way.
    return NextResponse.json({ success: true, result: outcome.result });
  } catch (err) {
    console.error('[DELETE /api/upload]', err);
    return NextResponse.json(
      { success: false, error: 'Failed to delete image' },
      { status: 502 }
    );
  }
}
