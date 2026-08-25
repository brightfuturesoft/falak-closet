import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { CategoryModel } from '@/models/Category';
import { ProductModel } from '@/models/Product';
import { INITIAL_CATEGORIES } from '@/data/categories';

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// GET /api/categories - Returns list of all categories and subcategories from DB with dynamic product counts
export async function GET() {
  try {
    await connectToDatabase();
    let categories = await CategoryModel.find({}).lean();

    if (!categories || categories.length === 0) {
      // Seed dynamically if database collections are empty
      await CategoryModel.insertMany(INITIAL_CATEGORIES);
      categories = await CategoryModel.find({}).lean();
    }

    // Calculate live product counts for main categories and subcategories
    const withCounts = await Promise.all(
      categories.map(async (cat: any) => {
        const categoryProductCount = await ProductModel.countDocuments({
          $or: [
            { category: { $regex: new RegExp(`^${escapeRegExp(cat.name)}$`, 'i') } },
            { category: { $regex: new RegExp(`^${escapeRegExp(cat.slug)}$`, 'i') } }
          ]
        });

        const updatedSubCats = await Promise.all(
          (cat.subCategories || []).map(async (sub: any) => {
            const subProductCount = await ProductModel.countDocuments({
              $or: [
                { subCategory: { $regex: new RegExp(`^${escapeRegExp(sub.name)}$`, 'i') } },
                { subCategory: { $regex: new RegExp(`^${escapeRegExp(sub.slug)}$`, 'i') } }
              ]
            });
            return { ...sub, productCount: subProductCount };
          })
        );

        return {
          ...cat,
          productCount: categoryProductCount,
          subCategories: updatedSubCats
        };
      })
    );

    return NextResponse.json({ success: true, categories: withCounts });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error.' }, { status: 500 });
  }
}

// POST /api/categories - Create new Category or Subcategory in DB
export async function POST(req: Request) {
  try {
    await connectToDatabase();
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

      const parentCategory = await CategoryModel.findOne({ id: parentCategoryId });
      if (!parentCategory) {
        return NextResponse.json({ success: false, error: 'Parent category not found.' }, { status: 404 });
      }

      const newSub = {
        id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: name.trim(),
        slug: generatedSlug,
        description: description || ''
      };

      parentCategory.subCategories.push(newSub);
      await parentCategory.save();
      return NextResponse.json({ success: true, message: 'Subcategory created successfully.', category: parentCategory, newSub });
    }

    // Create Main Category
    const newCategory = new CategoryModel({
      id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      slug: generatedSlug,
      icon: icon || 'Tag',
      description: description || '',
      isFeatured: Boolean(isFeatured),
      subCategories: []
    });

    await newCategory.save();
    return NextResponse.json({ success: true, message: 'Category created successfully.', category: newCategory });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error.' }, { status: 500 });
  }
}

// PUT /api/categories - Update existing Category or Subcategory in DB
export async function PUT(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { id, isSubcategory, name, slug, description, icon, isFeatured } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Category ID is required.' }, { status: 400 });
    }

    const updatedSlug = slug && slug.trim()
      ? slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
      : (name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

    if (isSubcategory) {
      // Find parent category containing this subcategory
      const parentCategory = await CategoryModel.findOne({ 'subCategories.id': id });
      if (!parentCategory) {
        return NextResponse.json({ success: false, error: 'Subcategory not found.' }, { status: 404 });
      }

      const subIndex = parentCategory.subCategories.findIndex((s: any) => s.id === id);
      if (subIndex !== -1) {
        parentCategory.subCategories[subIndex] = {
          ...parentCategory.subCategories[subIndex],
          name: name ? name.trim() : parentCategory.subCategories[subIndex].name,
          slug: updatedSlug || parentCategory.subCategories[subIndex].slug,
          description: description !== undefined ? description : parentCategory.subCategories[subIndex].description
        };
        await parentCategory.save();
        return NextResponse.json({ success: true, message: 'Subcategory updated successfully.' });
      }
      return NextResponse.json({ success: false, error: 'Subcategory not found.' }, { status: 404 });
    }

    // Update Main Category
    const category = await CategoryModel.findOne({ id });
    if (!category) {
      return NextResponse.json({ success: false, error: 'Category not found.' }, { status: 404 });
    }

    category.name = name ? name.trim() : category.name;
    category.slug = updatedSlug || category.slug;
    category.icon = icon !== undefined ? icon : category.icon;
    category.description = description !== undefined ? description : category.description;
    category.isFeatured = isFeatured !== undefined ? Boolean(isFeatured) : category.isFeatured;

    await category.save();
    return NextResponse.json({ success: true, message: 'Category updated successfully.', category });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error.' }, { status: 500 });
  }
}

// DELETE /api/categories - Delete Category or Subcategory from DB
export async function DELETE(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const isSubcategory = searchParams.get('isSubcategory') === 'true';

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required.' }, { status: 400 });
    }

    if (isSubcategory) {
      const parentCategory = await CategoryModel.findOne({ 'subCategories.id': id });
      if (!parentCategory) {
        return NextResponse.json({ success: false, error: 'Subcategory not found.' }, { status: 404 });
      }

      const subIndex = parentCategory.subCategories.findIndex((s: any) => s.id === id);
      if (subIndex !== -1) {
        parentCategory.subCategories.splice(subIndex, 1);
        await parentCategory.save();
        return NextResponse.json({ success: true, message: 'Subcategory deleted successfully.' });
      }
      return NextResponse.json({ success: false, error: 'Subcategory not found.' }, { status: 404 });
    }

    const deleteResult = await CategoryModel.deleteOne({ id });
    if (deleteResult.deletedCount === 0) {
      return NextResponse.json({ success: false, error: 'Category not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Category deleted successfully.' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error.' }, { status: 500 });
  }
}
