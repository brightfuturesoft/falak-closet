'use server';

import { db } from '@/prisma/db';

export async function getProducts() {
  try {
    const products = await db.product.findMany();
    // Sort in-memory for safety and simplicity
    const sorted = [...products].sort(
      (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return { success: true, products: sorted, source: 'mongodb' };
  } catch (error: any) {
    console.error('getProducts Action Error:', error);
    return { success: true, products: [], source: 'error', error: error.message };
  }
}

export async function getProductById(id: string) {
  try {
    if (!id) {
      return { success: false, error: 'Product ID is required' };
    }
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    const product = await db.product.findFirst({
      where: isObjectId
        ? { OR: [{ id }, { productId: id }] }
        : { productId: id }
    });
    if (!product) {
      return { success: false, error: 'Product not found' };
    }
    return { success: true, product };
  } catch (error: any) {
    console.error('getProductById Action Error:', error);
    return { success: false, error: error.message };
  }
}

export async function getProductBySlug(slug: string) {
  try {
    if (!slug) {
      return { success: false, error: 'Slug is required' };
    }
    const product = await db.product.findUnique({ where: { slug } });
    if (!product) {
      return { success: false, error: 'Product not found' };
    }
    return { success: true, product };
  } catch (error: any) {
    console.error('getProductBySlug Action Error:', error);
    return { success: false, error: error.message };
  }
}

export async function createProduct(body: {
  id?: string;
  slug?: string;
  name: string;
  category: string;
  subCategory?: string;
  price: number;
  originalPrice: number;
  rating?: number;
  reviewCount?: number;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  isFlashSale?: boolean;
  discountPercentage?: number;
  workType: string;
  occasion: string;
  material: string;
  weather?: string;
  colors: { name: string; hex: string }[];
  sizes: string[];
  stock?: number;
  images: string[];
  description: string;
  features?: string[];
  careInstructions?: string[];
}) {
  try {
    // Server-side validation
    const requiredChecks: [string, boolean][] = [
      ['name', !body.name?.trim()],
      ['category', !body.category?.trim()],
      ['price', !body.price || Number(body.price) <= 0],
      ['originalPrice', !body.originalPrice || Number(body.originalPrice) <= 0],
      ['workType', !body.workType?.trim()],
      ['occasion', !body.occasion?.trim()],
      ['material', !body.material?.trim()],
      ['description', !body.description?.trim()],
      ['colors', !Array.isArray(body.colors) || body.colors.length === 0],
      ['images', !Array.isArray(body.images) || body.images.length === 0],
    ];

    for (const [field, invalid] of requiredChecks) {
      if (invalid) {
        return { success: false, error: `${field} is required` };
      }
    }

    const productId = body.id || `flk-${Math.floor(1000 + Math.random() * 9000)}`;
    const slug = body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const newProduct = await db.product.create({
      data: {
        productId,
        slug,
        name: body.name.trim(),
        category: body.category.trim(),
        subCategory: body.subCategory?.trim() || null,
        price: Number(body.price),
        originalPrice: Number(body.originalPrice),
        rating: body.rating !== undefined ? Number(body.rating) : 4.8,
        reviewCount: body.reviewCount !== undefined ? Number(body.reviewCount) : 0,
        isNewArrival: Boolean(body.isNewArrival),
        isBestSeller: Boolean(body.isBestSeller),
        isFlashSale: Boolean(body.isFlashSale),
        discountPercentage: body.discountPercentage !== undefined ? Number(body.discountPercentage) : 0,
        workType: body.workType.trim(),
        occasion: body.occasion.trim(),
        material: body.material.trim(),
        weather: body.weather?.trim() || '',
        colors: body.colors,
        sizes: body.sizes,
        stock: body.stock !== undefined ? Number(body.stock) : 10,
        images: body.images,
        description: body.description.trim(),
        features: body.features || [],
        careInstructions: body.careInstructions || [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    return { success: true, product: newProduct };
  } catch (error: any) {
    console.error('createProduct Action Error:', error);
    return { success: false, error: error.message || 'Failed to create product.' };
  }
}

export async function updateProduct(id: string, body: any) {
  try {
    if (!id) {
      return { success: false, error: 'Product ID is required' };
    }

    // Validate fields only if they are present in the body and invalid
    if ('name' in body && !body.name?.trim()) {
      return { success: false, error: 'name is required' };
    }
    if ('price' in body && Number(body.price) <= 0) {
      return { success: false, error: 'price must be greater than 0' };
    }
    if ('originalPrice' in body && Number(body.originalPrice) <= 0) {
      return { success: false, error: 'originalPrice must be greater than 0' };
    }

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    const product = await db.product.findFirst({
      where: isObjectId
        ? { OR: [{ id }, { productId: id }] }
        : { productId: id }
    });
    if (!product) {
      return { success: false, error: 'Product not found' };
    }

    const updatedData: any = {
      updatedAt: new Date()
    };

    // Safely transfer fields
    const fields = [
      'name', 'category', 'subCategory', 'price', 'originalPrice', 'rating', 'reviewCount',
      'isNewArrival', 'isBestSeller', 'isFlashSale', 'discountPercentage', 'workType',
      'occasion', 'material', 'weather', 'colors', 'sizes', 'stock', 'images', 'description',
      'features', 'careInstructions', 'slug'
    ];

    for (const field of fields) {
      if (field in body) {
        updatedData[field] = body[field];
      }
    }

    await db.product.update({
      where: { id: product.id },
      data: updatedData
    });

    return { success: true, message: 'Product updated successfully.' };
  } catch (error: any) {
    console.error('updateProduct Action Error:', error);
    return { success: false, error: error.message || 'Failed to update product.' };
  }
}

export async function deleteProduct(id: string) {
  try {
    if (!id) {
      return { success: false, error: 'Product ID is required' };
    }
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    const product = await db.product.findFirst({
      where: isObjectId
        ? { OR: [{ id }, { productId: id }] }
        : { productId: id }
    });
    if (!product) {
      return { success: false, error: 'Product not found' };
    }
    await db.product.delete({ where: { id: product.id } });
    return { success: true, message: 'Product deleted' };
  } catch (error: any) {
    console.error('deleteProduct Action Error:', error);
    return { success: false, error: error.message || 'Failed to delete product.' };
  }
}

export async function getHomeFilters() {
  try {
    const { getCategoriesWithCounts } = await import('./categoryActions');
    const catResult = await getCategoriesWithCounts();
    const categories = catResult.success ? catResult.categories : [];

    const products = await db.product.findMany();

    const occasions = Array.from(new Set(products.map(p => p.occasion).filter(v => v && v.trim() !== '')));
    const materials = Array.from(new Set(products.map(p => p.material).filter(v => v && v.trim() !== '')));
    const weathers = Array.from(new Set(products.map(p => p.weather).filter(v => v && v.trim() !== '')));

    return {
      success: true,
      categories,
      occasions,
      materials,
      weathers
    };
  } catch (error: any) {
    console.error('getHomeFilters Action Error:', error);
    return { success: false, error: error.message || 'Failed to fetch home filters.' };
  }
}
