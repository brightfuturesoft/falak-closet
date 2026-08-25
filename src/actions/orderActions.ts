'use server';

import { db } from '@/prisma/db';

const DEFAULT_PROMOTIONS = [
  {
    code: 'EID2026',
    discountType: 'percentage',
    discountValue: 15,
    minSpend: 2500,
    maxDiscount: 1000,
    usageLimit: 500,
    usedCount: 142,
    expiryDate: '2026-06-30',
    status: 'Active'
  },
  {
    code: 'FALAK10',
    discountType: 'percentage',
    discountValue: 10,
    minSpend: 1500,
    maxDiscount: 500,
    usageLimit: 1000,
    usedCount: 689,
    expiryDate: '2026-12-31',
    status: 'Active'
  },
  {
    code: 'WELCOME500',
    discountType: 'fixed',
    discountValue: 500,
    minSpend: 3500,
    maxDiscount: 500,
    usageLimit: 200,
    usedCount: 95,
    expiryDate: '2026-09-30',
    status: 'Active'
  }
];

// READ All Orders
export async function getOrders() {
  try {
    const orders = await db.order.findMany();
    const sorted = [...orders].sort(
      (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return { success: true, orders: sorted };
  } catch (error: any) {
    console.error('getOrders Action Error:', error);
    return { success: true, orders: [], source: 'offline', error: error.message };
  }
}

// CREATE Order & Auto-register profile
export async function createOrder(body: any) {
  try {
    const orderId = body.id || `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder = await db.order.create({
      data: {
        orderId,
        date: body.date || new Date().toISOString().split('T')[0],
        items: body.items.map((item: any) => ({
          product: {
            id: item.product?.id || item.product?.productId || '',
            name: item.product?.name || '',
            price: Number(item.product?.price) || 0,
            images: item.product?.images || [],
            slug: item.product?.slug || '',
            code: item.product?.code || ''
          },
          selectedColor: item.selectedColor,
          selectedSize: item.selectedSize,
          quantity: Number(item.quantity)
        })),
        subtotal: Number(body.subtotal),
        discount: Number(body.discount) || 0,
        shippingFee: Number(body.shippingFee) || 0,
        total: Number(body.total),
        status: body.status || 'Processing',
        shippingAddress: {
          fullName: body.shippingAddress?.fullName || '',
          phone: body.shippingAddress?.phone || '',
          street: body.shippingAddress?.street || '',
          city: body.shippingAddress?.city || '',
          country: body.shippingAddress?.country || 'Bangladesh',
          postalCode: body.shippingAddress?.postalCode || ''
        },
        deliveryMethod: body.deliveryMethod || '',
        paymentMethod: body.paymentMethod || '',
        paymentStatus: body.paymentStatus || (body.paymentMethod === 'bKash' ? 'Pending Review' : 'Unpaid'),
        bkashSenderNumber: body.bkashSenderNumber || null,
        bkashTrxId: body.bkashTrxId || null,
        trackingNumber: body.trackingNumber || '',
        estimatedDelivery: body.estimatedDelivery || '',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Auto-register user profile
    try {
      const email = body.userEmail || (body.shippingAddress?.fullName ? `${body.shippingAddress.fullName.toLowerCase().replace(/[^a-z0-9]/g, '')}@falakcloset.com` : undefined);
      const phone = body.shippingAddress?.phone;
      const name = body.shippingAddress?.fullName;

      if (phone && name) {
        const targetEmail = email || `${phone}@falakcloset.com`;
        const existing = await db.user.findFirst({ where: { phone } });

        const updateFields = {
          email: targetEmail.toLowerCase(),
          phone,
          name,
          district: body.shippingAddress?.district || body.shippingAddress?.city || 'Dhaka',
          fullAddress: body.shippingAddress?.fullAddress || body.shippingAddress?.street || 'Dhaka, Bangladesh',
          ip: body.userIp || '103.24.12.89'
        };

        if (existing) {
          await db.user.update({
            where: { id: existing.id },
            data: {
              ...updateFields,
              updatedAt: new Date()
            }
          });
        } else {
          await db.user.create({
            data: {
              ...updateFields,
              cart: [],
              wishlist: [],
              passwordHash: '',
              resetOtp: '',
              isBlocked: false,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
        }
      }
    } catch (e) {
      console.error('Auto-register user failed:', e);
    }

    return { success: true, order: newOrder };
  } catch (error: any) {
    console.error('createOrder Action Error:', error);
    return { success: false, error: error.message || 'Order creation failed.' };
  }
}

// UPDATE Order Status
export async function updateOrderStatus(orderId: string, status: string) {
  try {
    if (!orderId || !status) {
      return { success: false, error: 'Order ID and Status are required' };
    }

    const order = await db.order.findFirst({
      where: {
        OR: [
          { id: orderId },
          { orderId }
        ]
      }
    });
    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    await db.order.update({
      where: { id: order.id },
      data: {
        status,
        updatedAt: new Date()
      }
    });

    const updated = await db.order.findUnique({ where: { id: order.id } });
    return { success: true, order: updated };
  } catch (error: any) {
    console.error('updateOrderStatus Action Error:', error);
    return { success: false, error: error.message || 'Status update failed.' };
  }
}

// READ All Promotions
export async function getPromotions() {
  try {
    const promotions = await db.promotion.findMany();

    if (!promotions || promotions.length === 0) {
      // Seed default promotions if empty
      const insertData = DEFAULT_PROMOTIONS.map(promo => ({
        code: promo.code,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        minSpend: promo.minSpend,
        maxDiscount: promo.maxDiscount,
        usageLimit: promo.usageLimit,
        usedCount: promo.usedCount,
        expiryDate: promo.expiryDate,
        status: promo.status,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      await db.promotion.createMany({ data: insertData });
      const seeded = await db.promotion.findMany();
      const sorted = [...seeded].sort(
        (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      return { success: true, promotions: sorted };
    }

    const sorted = [...promotions].sort(
      (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return { success: true, promotions: sorted };
  } catch (error: any) {
    console.error('getPromotions Action Error:', error);
    return { success: true, promotions: DEFAULT_PROMOTIONS.map(p => ({ id: p.code, _id: p.code, ...p })), source: 'offline' };
  }
}

// CREATE Promotion
export async function createPromotion(body: {
  code: string;
  discountType?: string;
  discountValue: number;
  minSpend?: number;
  maxDiscount?: number;
  usageLimit?: number;
  expiryDate?: string;
  status?: string;
}) {
  try {
    const { code, discountType, discountValue, minSpend, maxDiscount, usageLimit, expiryDate, status } = body;

    if (!code || !discountValue) {
      return { success: false, error: 'Promo code and discount value are required' };
    }

    const promotion = {
      code: code.toUpperCase().trim(),
      discountType: discountType || 'percentage',
      discountValue: Number(discountValue),
      minSpend: Number(minSpend) || 0,
      maxDiscount: Number(maxDiscount) || 0,
      usageLimit: Number(usageLimit) || 100,
      usedCount: 0,
      expiryDate: expiryDate || '2026-12-31',
      status: status || 'Active',
      createdAt: new Date(),
      updatedAt: new Date()
    }


    const newPromo = await db.promotion.create({
      data: {
        ...promotion
      }
    });

    return { success: true, promotion: newPromo };
  } catch (error: any) {
    console.error('createPromotion Action Error:', error);
    return { success: false, error: error.message || 'Promotion creation failed.' };
  }
}

// UPDATE Promotion
export async function updatePromotion(body: {
  id?: string;
  code: string;
  discountType?: string;
  discountValue?: number;
  minSpend?: number;
  maxDiscount?: number;
  usageLimit?: number;
  expiryDate?: string;
  status?: string;
}) {
  try {
    const { id, code, discountType, discountValue, minSpend, maxDiscount, usageLimit, expiryDate, status } = body;

    if (!code && !id) {
      return { success: false, error: 'Promo code or ID required' };
    }

    const filter = id ? { id } : { code: code.toUpperCase().trim() };
    const promo = await db.promotion.findFirst({ where: filter });
    if (!promo) {
      return { success: false, error: 'Promotion not found' };
    }

    const updatedData: any = {
      updatedAt: new Date()
    };

    if (code) updatedData.code = code.toUpperCase().trim();
    if (discountType) updatedData.discountType = discountType;
    if (discountValue !== undefined) updatedData.discountValue = Number(discountValue);
    if (minSpend !== undefined) updatedData.minSpend = Number(minSpend);
    if (maxDiscount !== undefined) updatedData.maxDiscount = Number(maxDiscount);
    if (usageLimit !== undefined) updatedData.usageLimit = Number(usageLimit);
    if (expiryDate) updatedData.expiryDate = expiryDate;
    if (status) updatedData.status = status;

    const updated = await db.promotion.update({
      where: { id: promo.id },
      data: updatedData
    });

    return { success: true, promotion: updated };
  } catch (error: any) {
    console.error('updatePromotion Action Error:', error);
    return { success: false, error: error.message || 'Promotion update failed.' };
  }
}

// DELETE Promotion
export async function deletePromotion(params: { code?: string; id?: string }) {
  try {
    const { code, id } = params;

    if (!code && !id) {
      return { success: false, error: 'Promo code or ID required for deletion' };
    }

    const filter = id ? { id } : { code: code!.toUpperCase().trim() };
    const promo = await db.promotion.findFirst({ where: filter });
    if (!promo) {
      return { success: false, error: 'Promotion not found' };
    }

    await db.promotion.delete({ where: { id: promo.id } });

    return { success: true, message: 'Promotion deleted successfully' };
  } catch (error: any) {
    console.error('deletePromotion Action Error:', error);
    return { success: false, error: error.message || 'Promotion deletion failed.' };
  }
}

// VALIDATE Promotion Code
export async function validatePromotion(body: { code: string; cartSubtotal: number }) {
  try {
    const { code, cartSubtotal } = body;

    if (!code) {
      return { success: false, error: 'Promo code is required' };
    }

    const cleanCode = code.toUpperCase().trim();
    const promo = await db.promotion.findUnique({ where: { code: cleanCode } });

    if (!promo) {
      return { success: false, error: `Promo code "${cleanCode}" is invalid.` };
    }

    if (promo.status !== 'Active') {
      return { success: false, error: `Promo code "${cleanCode}" is no longer active.` };
    }

    if (promo.expiryDate && new Date(promo.expiryDate) < new Date()) {
      return { success: false, error: `Promo code "${cleanCode}" has expired.` };
    }

    if (cartSubtotal < promo.minSpend) {
      return {
        success: false,
        error: `Minimum spend of ৳${promo.minSpend.toLocaleString()} required for promo code "${cleanCode}".`
      };
    }

    // Calculate Discount
    let calculatedDiscount = 0;
    if (promo.discountType === 'percentage') {
      calculatedDiscount = (cartSubtotal * promo.discountValue) / 100;
      if (promo.maxDiscount && promo.maxDiscount > 0) {
        calculatedDiscount = Math.min(calculatedDiscount, promo.maxDiscount);
      }
    } else {
      calculatedDiscount = promo.discountValue;
    }

    return {
      success: true,
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      calculatedDiscount,
      promotion: {
        id: promo.id,
        _id: promo.id,
        code: promo.code,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        minSpend: promo.minSpend,
        maxDiscount: promo.maxDiscount,
        usageLimit: promo.usageLimit,
        usedCount: promo.usedCount,
        expiryDate: promo.expiryDate,
        status: promo.status
      },
      message: `Promo code "${cleanCode}" applied successfully!`
    };
  } catch (error: any) {
    console.error('validatePromotion Action Error:', error);
    return { success: false, error: error.message || 'Promo code validation failed.' };
  }
}

export async function updateOrderPaymentStatus(orderId: string, paymentStatus: string) {
  try {
    if (!orderId || !paymentStatus) {
      return { success: false, error: 'Order ID and payment status are required' };
    }
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(orderId);
    const order = await db.order.findFirst({
      where: isObjectId
        ? { OR: [{ id: orderId }, { orderId: orderId }] }
        : { orderId: orderId }
    });
    if (!order) {
      return { success: false, error: 'Order not found' };
    }
    await db.order.update({
      where: { id: order.id },
      data: {
        paymentStatus,
        status: paymentStatus === 'Verified' ? 'Processing' : order.status
      }
    });
    return { success: true, message: `Payment status updated to ${paymentStatus}` };
  } catch (error: any) {
    console.error('updateOrderPaymentStatus error:', error);
    return { success: false, error: error.message };
  }
}
