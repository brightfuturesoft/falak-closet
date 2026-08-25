'use server';

import { db } from '@/prisma/db';
import { INITIAL_CATEGORIES } from '@/data/categories';

export async function getCategories() {
  try {
    let categories = await db.category.findMany();

    if (!categories || categories.length === 0) {
      // Seed dynamically if empty
      const insertData = INITIAL_CATEGORIES.map(cat => ({
        categoryId: cat.id,
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon || 'Tag',
        description: cat.description || '',
        image: cat.image || '',
        subCategories: cat.subCategories.map(sub => ({
          id: sub.id,
          name: sub.name,
          slug: sub.slug,
          description: sub.description || ''
        })),
        isFeatured: cat.isFeatured || false,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      await db.category.createMany({ data: insertData });
      categories = await db.category.findMany();
    }

    return { success: true, categories };
  } catch (error: any) {
    console.error('getCategories Action Error:', error);
    return { success: false, error: error.message || 'Failed to fetch categories.' };
  }
}

export async function getCategoriesWithCounts() {
  try {
    const categoriesResult = await getCategories();
    if (!categoriesResult.success || !categoriesResult.categories) {
      return categoriesResult;
    }

    const categories = categoriesResult.categories;
    const products = await db.product.findMany();

    // Map categories and subcategories to include counts
    const withCounts = categories.map(cat => {
      const categoryProductCount = products.filter(p => {
        const catName = p.category?.toLowerCase();
        return catName === cat.name.toLowerCase() || catName === cat.slug.toLowerCase();
      }).length;

      const updatedSubCats = (cat.subCategories || []).map(sub => {
        const subProductCount = products.filter(p => {
          const subName = p.subCategory?.toLowerCase();
          return subName === sub.name.toLowerCase() || subName === sub.slug.toLowerCase();
        }).length;
        return {
          id: sub.id,
          name: sub.name,
          slug: sub.slug,
          description: sub.description,
          productCount: subProductCount
        };
      });

      return {
        _id: cat.id, // In standard Prisma, cat.id is the string ObjectId mapping to _id
        id: cat.categoryId, // In standard Prisma, cat.categoryId is the unique id e.g. 'men'
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        description: cat.description,
        image: cat.image,
        isFeatured: cat.isFeatured,
        productCount: categoryProductCount,
        subCategories: updatedSubCats
      };
    });

    return { success: true, categories: withCounts };
  } catch (error: any) {
    console.error('getCategoriesWithCounts Action Error:', error);
    return { success: false, error: error.message || 'Failed to fetch categories with counts.' };
  }
}

export async function createCategory(body: {
  action?: string;
  name: string;
  slug?: string;
  parentCategoryId?: string;
  description?: string;
  icon?: string;
  isFeatured?: boolean;
}) {
  try {
    const { action, name, slug, parentCategoryId, description, icon, isFeatured } = body;

    if (!name || !name.trim()) {
      return { success: false, error: 'Category name is required.' };
    }

    const generatedSlug = slug && slug.trim()
      ? slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
      : name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

    if (action === 'create_subcategory') {
      if (!parentCategoryId) {
        return { success: false, error: 'Parent category ID is required for subcategory creation.' };
      }

      // Find parent category by its unique string categoryId (e.g. 'men')
      const parentCategory = await db.category.findUnique({ where: { categoryId: parentCategoryId } });
      if (!parentCategory) {
        return { success: false, error: 'Parent category not found.' };
      }

      const newSub = {
        id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: name.trim(),
        slug: generatedSlug,
        description: description || ''
      };

      const updatedSubCategories = [...(parentCategory.subCategories || []), newSub];

      await db.category.update({
        where: { categoryId: parentCategoryId },
        data: {
          subCategories: updatedSubCategories,
          updatedAt: new Date()
        }
      });

      return {
        success: true,
        message: 'Subcategory created successfully.',
        newSub
      };
    }

    // Create Main Category
    const newCategory = await db.category.create({
      data: {
        categoryId: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: name.trim(),
        slug: generatedSlug,
        icon: icon || 'Tag',
        description: description || '',
        image: '',
        isFeatured: Boolean(isFeatured),
        subCategories: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    return { success: true, message: 'Category created successfully.', category: newCategory };
  } catch (error: any) {
    console.error('createCategory Action Error:', error);
    return { success: false, error: error.message || 'Failed to create category.' };
  }
}

export async function updateCategory(body: {
  id: string;
  isSubcategory?: boolean;
  name?: string;
  slug?: string;
  description?: string;
  icon?: string;
  isFeatured?: boolean;
}) {
  try {
    const { id, isSubcategory, name, slug, description, icon, isFeatured } = body;

    if (!id) {
      return { success: false, error: 'Category ID is required.' };
    }

    const updatedSlug = slug && slug.trim()
      ? slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
      : (name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

    if (isSubcategory) {
      // Find parent category containing this subcategory
      const categories = await db.category.findMany();
      const parentCategory = categories.find(cat =>
        (cat.subCategories || []).some(sub => sub.id === id)
      );

      if (!parentCategory) {
        return { success: false, error: 'Subcategory not found.' };
      }

      const updatedSubCats = parentCategory.subCategories.map(sub => {
        if (sub.id === id) {
          return {
            id: sub.id,
            name: name ? name.trim() : sub.name,
            slug: updatedSlug || sub.slug,
            description: description !== undefined ? description : sub.description
          };
        }
        return sub;
      });

      await db.category.update({
        where: { id: parentCategory.id },
        data: {
          subCategories: updatedSubCats,
          updatedAt: new Date()
        }
      });

      return { success: true, message: 'Subcategory updated successfully.' };
    }

    // Update Main Category
    const category = await db.category.findUnique({ where: { id } });
    if (!category) {
      return { success: false, error: 'Category not found.' };
    }

    const updatedData: any = {
      updatedAt: new Date()
    };
    if (name) updatedData.name = name.trim();
    if (updatedSlug) updatedData.slug = updatedSlug;
    if (icon !== undefined) updatedData.icon = icon;
    if (description !== undefined) updatedData.description = description;
    if (isFeatured !== undefined) updatedData.isFeatured = Boolean(isFeatured);

    await db.category.update({
      where: { id },
      data: updatedData
    });

    return { success: true, message: 'Category updated successfully.' };
  } catch (error: any) {
    console.error('updateCategory Action Error:', error);
    return { success: false, error: error.message || 'Failed to update category.' };
  }
}

export async function deleteCategory(id: string, isSubcategory?: boolean) {
  try {
    if (!id) {
      return { success: false, error: 'ID is required.' };
    }

    if (isSubcategory) {
      const categories = await db.category.findMany();
      const parentCategory = categories.find(cat =>
        (cat.subCategories || []).some(sub => sub.id === id)
      );

      if (!parentCategory) {
        return { success: false, error: 'Subcategory not found.' };
      }

      const updatedSubCats = parentCategory.subCategories.filter(sub => sub.id !== id);

      await db.category.update({
        where: { id: parentCategory.id },
        data: {
          subCategories: updatedSubCats,
          updatedAt: new Date()
        }
      });

      return { success: true, message: 'Subcategory deleted successfully.' };
    }

    await db.category.delete({ where: { id } });
    return { success: true, message: 'Category deleted successfully.' };
  } catch (error: any) {
    console.error('deleteCategory Action Error:', error);
    return { success: false, error: error.message || 'Failed to delete category.' };
  }
}
