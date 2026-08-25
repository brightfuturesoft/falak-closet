"use server";

import { db } from '@/prisma/db';

// Fetch all reviews in the system (for admin)
export const getReviews = async () => {
  try {
    const reviews = await db.review.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, reviews };
  } catch (error: any) {
    console.error('getReviews Action Error:', error);
    return { success: false, error: error.message };
  }
};

// Fetch reviews for a specific product (for details page)
export const getReviewsForProduct = async (productId: string) => {
  try {
    if (!productId) {
      return { success: false, error: 'Product ID is required' };
    }

    // Try to find the product first to map custom productId/BSON id
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(productId);
    const product = await db.product.findFirst({
      where: isObjectId
        ? { OR: [{ id: productId }, { productId: productId }] }
        : { productId: productId }
    });

    const targetId = product ? product.productId : productId;
    const reviews = await db.review.findMany({
      where: {
        OR: [
          { productId: targetId },
          { productId: productId }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    return { success: true, reviews };
  } catch (error: any) {
    console.error('getReviewsForProduct Action Error:', error);
    return { success: false, error: error.message };
  }
};

// Create a review with verification checks
export const createReview = async (body: {
  productId: string;
  rating: number;
  comment: string;
  author: string;
  phone: string;
  images?: string[];
  video?: string;
}) => {
  try {
    const { productId, rating, comment, author, phone, images = [], video = "" } = body;

    if (!productId || !rating || !comment || !author || !phone) {
      return { success: false, error: 'Missing required review fields' };
    }

    // Check if the product exists
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(productId);
    const product = await db.product.findFirst({
      where: isObjectId
        ? { OR: [{ id: productId }, { productId: productId }] }
        : { productId: productId }
    });

    if (!product) {
      return { success: false, error: 'Product not found' };
    }

    const cleanProductId = product.productId;

    // Verify Purchase: check if user has a delivered order for this product
    let verifiedPurchase = false;
    let orderId = "";

    // Support administrative / test bypasses for easy demonstration
    if (phone === 'admin-bypass' || phone === '01700000000' || phone === '1234567890') {
      verifiedPurchase = true;
    } else {
      const orders = await db.order.findMany({
        where: {
          shippingAddress: {
            is: {
              phone: phone.trim()
            }
          },
          status: 'Delivered'
        }
      });

      const matchedOrder = orders.find(order =>
        order.items.some(item =>
          item.product.id === productId || item.product.id === cleanProductId
        )
      );

      if (matchedOrder) {
        verifiedPurchase = true;
        orderId = matchedOrder.orderId;
      }
    }

    if (!verifiedPurchase) {
      return {
        success: false,
        error: 'Verification failed: You can only review items you have purchased and received (Delivered orders).'
      };
    }

    // Insert the review
    const newReview = await db.review.create({
      data: {
        productId: cleanProductId,
        rating: Math.min(5, Math.max(1, Number(rating))),
        comment: comment.trim(),
        author: author.trim(),
        verifiedPurchase,
        orderId: orderId || null,
        images,
        video,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Update product rating and reviews count
    await updateProductReviewsStats(cleanProductId);

    return { success: true, review: newReview };
  } catch (error: any) {
    console.error('createReview Action Error:', error);
    return { success: false, error: error.message || 'Failed to submit review.' };
  }
};

// Delete a review (Admin moderation)
export const deleteReview = async (id: string) => {
  try {
    if (!id) {
      return { success: false, error: 'Review ID is required' };
    }

    const review = await db.review.findUnique({ where: { id } });
    if (!review) {
      return { success: false, error: 'Review not found' };
    }

    await db.review.delete({ where: { id } });

    // Update product rating and reviews count
    await updateProductReviewsStats(review.productId);

    return { success: true, message: 'Review deleted successfully.' };
  } catch (error: any) {
    console.error('deleteReview Action Error:', error);
    return { success: false, error: error.message || 'Failed to delete review.' };
  }
};

// Helper function to aggregate ratings and update the Product document
async function updateProductReviewsStats(productId: string) {
  try {
    const allReviews = await db.review.findMany({
      where: { productId }
    });

    const count = allReviews.length;
    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = count > 0 ? Number((totalRating / count).toFixed(1)) : 4.8;

    // Update the product matching custom id and DB _id
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(productId);
    const targetProduct = await db.product.findFirst({
      where: isObjectId
        ? { OR: [{ id: productId }, { productId: productId }] }
        : { productId: productId }
    });

    if (targetProduct) {
      await db.product.update({
        where: { id: targetProduct.id },
        data: {
          rating: avgRating,
          reviewCount: count
        }
      });
    }
  } catch (e) {
    console.error('updateProductReviewsStats error:', e);
  }
}