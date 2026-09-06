import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { CATEGORIES_TAG } from '@/lib/fetcher';

function slugify(text: string) {
  return text.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function shortId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : 'Server error';
}

/**
 * Invalidate every cached read of the taxonomy after a write.
 * Next 16 requires the second `profile` argument on revalidateTag —
 * 'max' gives stale-while-revalidate instead of a blocking cache miss.
 */
function bustCategoryCache() {
  revalidateTag(CATEGORIES_TAG, 'max');
  revalidatePath('/');
  revalidatePath('/shop');
}

// ─── GET /api/categories ─────────────────────────────────────────────────────
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return NextResponse.json({ success: true, categories });
  } catch (err) {
    console.error('[GET /api/categories]', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch categories' }, { status: 500 });
  }
}

// ─── POST /api/categories ────────────────────────────────────────────────────
// body: { action?: 'create_subcategory', name, slug?, icon?, description?, isFeatured?, parentCategoryId? }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, name, slug, parentCategoryId, description, icon, image, type, isFeatured, sortOrder } = body;

    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    }

    const generatedSlug = slugify(slug || name);

    // ── Create Subcategory ──────────────────────────────────────────────────
    if (action === 'create_subcategory') {
      if (!parentCategoryId) {
        return NextResponse.json({ success: false, error: 'Parent category ID is required' }, { status: 400 });
      }

      const parent = await prisma.category.findUnique({ where: { id: parentCategoryId } });
      if (!parent) {
        return NextResponse.json({ success: false, error: 'Parent category not found' }, { status: 404 });
      }

      const newSub = {
        id: `sub-${shortId()}`,
        name: name.trim(),
        slug: generatedSlug,
        description: description ?? '',
      };

      const updated = await prisma.category.update({
        where: { id: parentCategoryId },
        data: { subCategories: { push: newSub } },
      });

      bustCategoryCache();
      return NextResponse.json({ success: true, message: 'Subcategory created', category: updated, newSub });
    }

    // ── Create Main Category ────────────────────────────────────────────────
    // Check slug uniqueness
    const existing = await prisma.category.findUnique({ where: { slug: generatedSlug } });
    if (existing) {
      return NextResponse.json({ success: false, error: 'A category with this slug already exists' }, { status: 409 });
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        slug: generatedSlug,
        type: type || 'category',
        icon: icon ?? 'Tag',
        description: description ?? '',
        image: image ?? '',
        isFeatured: Boolean(isFeatured),
        sortOrder: sortOrder ?? 0,
        subCategories: [],
      },
    });

    bustCategoryCache();
    return NextResponse.json({ success: true, message: 'Category created', category }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/categories]', err);
    return NextResponse.json({ success: false, error: errorMessage(err) }, { status: 500 });
  }
}

// ─── PUT /api/categories ─────────────────────────────────────────────────────
// body: { id, isSubcategory?, parentCategoryId?, name?, slug?, icon?, image?, type?, description?, isFeatured?, sortOrder? }
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, isSubcategory, parentCategoryId, name, slug, description, icon, image, type, isFeatured, sortOrder } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    // ── Update Subcategory ──────────────────────────────────────────────────
    if (isSubcategory) {
      // Find which parent contains this subcategory
      const parent = parentCategoryId
        ? await prisma.category.findUnique({ where: { id: parentCategoryId } })
        : await prisma.category.findFirst({ where: { subCategories: { some: { id } } } });

      if (!parent) {
        return NextResponse.json({ success: false, error: 'Subcategory not found' }, { status: 404 });
      }

      const updatedSlug = slug ? slugify(slug) : name ? slugify(name) : undefined;
      const updatedSubs = parent.subCategories.map((s) =>
        s.id === id
          ? {
              ...s,
              ...(name ? { name: name.trim() } : {}),
              ...(updatedSlug ? { slug: updatedSlug } : {}),
              ...(description !== undefined ? { description } : {}),
            }
          : s
      );

      const updated = await prisma.category.update({
        where: { id: parent.id },
        data: { subCategories: updatedSubs },
      });

      bustCategoryCache();
      return NextResponse.json({ success: true, message: 'Subcategory updated', category: updated });
    }

    // ── Update Main Category ────────────────────────────────────────────────
    const updatedSlug = slug ? slugify(slug) : name ? slugify(name) : undefined;

    // A rename must not collide with another category's slug (slug is @unique).
    if (updatedSlug) {
      const clash = await prisma.category.findUnique({ where: { slug: updatedSlug } });
      if (clash && clash.id !== id) {
        return NextResponse.json(
          { success: false, error: 'Another category already uses this slug' },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(updatedSlug ? { slug: updatedSlug } : {}),
        ...(type !== undefined ? { type } : {}),
        ...(icon !== undefined ? { icon } : {}),
        ...(image !== undefined ? { image } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(isFeatured !== undefined ? { isFeatured: Boolean(isFeatured) } : {}),
        ...(sortOrder !== undefined ? { sortOrder } : {}),
      },
    });

    bustCategoryCache();
    return NextResponse.json({ success: true, message: 'Category updated', category: updated });
  } catch (err) {
    console.error('[PUT /api/categories]', err);
    return NextResponse.json({ success: false, error: errorMessage(err) }, { status: 500 });
  }
}

// ─── DELETE /api/categories?id=...&type=category|subcategory&parentId=... ────
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type') ?? 'category';           // 'category' | 'subcategory'
    const isSubcategory = type === 'subcategory' || searchParams.get('isSubcategory') === 'true';
    const parentId = searchParams.get('parentId');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    if (isSubcategory) {
      const parent = parentId
        ? await prisma.category.findUnique({ where: { id: parentId } })
        : await prisma.category.findFirst({ where: { subCategories: { some: { id } } } });

      if (!parent) {
        return NextResponse.json({ success: false, error: 'Subcategory not found' }, { status: 404 });
      }

      const filteredSubs = parent.subCategories.filter((s) => s.id !== id);
      await prisma.category.update({
        where: { id: parent.id },
        data: { subCategories: filteredSubs },
      });

      bustCategoryCache();
      return NextResponse.json({ success: true, message: 'Subcategory deleted' });
    }

    await prisma.category.delete({ where: { id } });
    bustCategoryCache();
    return NextResponse.json({ success: true, message: 'Category deleted' });
  } catch (err) {
    console.error('[DELETE /api/categories]', err);
    return NextResponse.json({ success: false, error: errorMessage(err) }, { status: 500 });
  }
}
