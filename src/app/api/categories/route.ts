import { NextResponse } from 'next/server';
import { INITIAL_CATEGORIES, Category, SubCategory } from '@/data/categories';
import { PRODUCTS } from '@/data/products';

// Server-side in-memory store for Categories
let categoriesStore: Category[] = [...INITIAL_CATEGORIES];

function calculateProductCounts(cats: Category[]): Category[] {
  return cats.map((cat) => {
    const catProducts = PRODUCTS.filter(
      (p) => (p.category || '').toLowerCase() === cat.name.toLowerCase() || (p.category || '').toLowerCase() === cat.slug.toLowerCase()
    );

    const updatedSubCats: SubCategory[] = cat.subCategories.map((sub) => {
      const subCount = catProducts.filter(
        (p) => (p as any).subCategory?.toLowerCase() === sub.name.toLowerCase() || (p as any).subCategory?.toLowerCase() === sub.slug.toLowerCase()
      ).length;
      return { ...sub, productCount: subCount };
    });

    return {
      ...cat,
      productCount: catProducts.length,
      subCategories: updatedSubCats
    };
  });
}

// GET /api/categories - Returns list of all categories and subcategories
export async function GET() {
  const withCounts = calculateProductCounts(categoriesStore);
  return NextResponse.json({ success: true, categories: withCounts });
}

// POST /api/categories - Create new Category or Subcategory
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, name, slug, parentCategoryId, description, icon, isFeatured } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Category name is required.' }, { status: 400 });
    }

    const generatedSlug = slug && slug.trim()
      ? slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
      : name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

    if (action === 'create_subcategory') {
      if (!parentCategoryId) {
        return NextResponse.json({ success: false, error: 'Parent category ID is required for subcategory creation.' }, { status: 400 });
      }

      const parentIndex = categoriesStore.findIndex((c) => c.id === parentCategoryId);
      if (parentIndex === -1) {
        return NextResponse.json({ success: false, error: 'Parent category not found.' }, { status: 404 });
      }

      const newSub: SubCategory = {
        id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: name.trim(),
        slug: generatedSlug,
        description: description || ''
      };

      categoriesStore[parentIndex].subCategories.push(newSub);
      return NextResponse.json({ success: true, message: 'Subcategory created successfully.', category: categoriesStore[parentIndex], newSub });
    }

    // Create Main Category
    const newCategory: Category = {
      id: `cat-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: name.trim(),
      slug: generatedSlug,
      icon: icon || 'Tag',
      description: description || '',
      isFeatured: Boolean(isFeatured),
      subCategories: []
    };

    categoriesStore.push(newCategory);
    return NextResponse.json({ success: true, message: 'Category created successfully.', category: newCategory });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error.' }, { status: 500 });
  }
}

// PUT /api/categories - Update existing Category or Subcategory
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, isSubcategory, parentCategoryId, name, slug, description, icon, isFeatured } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Category ID is required.' }, { status: 400 });
    }

    const updatedSlug = slug && slug.trim()
      ? slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
      : (name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

    if (isSubcategory) {
      // Find parent category containing this subcategory
      for (const cat of categoriesStore) {
        const subIndex = cat.subCategories.findIndex((s) => s.id === id);
        if (subIndex !== -1) {
          cat.subCategories[subIndex] = {
            ...cat.subCategories[subIndex],
            name: name ? name.trim() : cat.subCategories[subIndex].name,
            slug: updatedSlug || cat.subCategories[subIndex].slug,
            description: description !== undefined ? description : cat.subCategories[subIndex].description
          };
          return NextResponse.json({ success: true, message: 'Subcategory updated successfully.' });
        }
      }
      return NextResponse.json({ success: false, error: 'Subcategory not found.' }, { status: 404 });
    }

    // Update Main Category
    const catIndex = categoriesStore.findIndex((c) => c.id === id);
    if (catIndex === -1) {
      return NextResponse.json({ success: false, error: 'Category not found.' }, { status: 404 });
    }

    categoriesStore[catIndex] = {
      ...categoriesStore[catIndex],
      name: name ? name.trim() : categoriesStore[catIndex].name,
      slug: updatedSlug || categoriesStore[catIndex].slug,
      icon: icon !== undefined ? icon : categoriesStore[catIndex].icon,
      description: description !== undefined ? description : categoriesStore[catIndex].description,
      isFeatured: isFeatured !== undefined ? Boolean(isFeatured) : categoriesStore[catIndex].isFeatured
    };

    return NextResponse.json({ success: true, message: 'Category updated successfully.', category: categoriesStore[catIndex] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error.' }, { status: 500 });
  }
}

// DELETE /api/categories - Delete Category or Subcategory
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const isSubcategory = searchParams.get('isSubcategory') === 'true';

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required.' }, { status: 400 });
    }

    if (isSubcategory) {
      for (const cat of categoriesStore) {
        const subIndex = cat.subCategories.findIndex((s) => s.id === id);
        if (subIndex !== -1) {
          cat.subCategories.splice(subIndex, 1);
          return NextResponse.json({ success: true, message: 'Subcategory deleted successfully.' });
        }
      }
      return NextResponse.json({ success: false, error: 'Subcategory not found.' }, { status: 404 });
    }

    const catIndex = categoriesStore.findIndex((c) => c.id === id);
    if (catIndex === -1) {
      return NextResponse.json({ success: false, error: 'Category not found.' }, { status: 404 });
    }

    categoriesStore.splice(catIndex, 1);
    return NextResponse.json({ success: true, message: 'Category deleted successfully.' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error.' }, { status: 500 });
  }
}
