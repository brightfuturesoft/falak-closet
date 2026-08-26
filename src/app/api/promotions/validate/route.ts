import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/promotions/validate  body: { code, cartSubtotal }
export async function POST(req: Request) {
  try {
    const { code, cartSubtotal } = await req.json();

    if (!code) {
      return NextResponse.json({ success: false, error: 'Promo code is required' }, { status: 400 });
    }

    const cleanCode = String(code).toUpperCase().trim();
    const subtotal = Number(cartSubtotal) || 0;

    const promo = await prisma.promotion.findUnique({ where: { code: cleanCode } });

    if (!promo) {
      return NextResponse.json(
        { success: false, error: `Promo code "${cleanCode}" is invalid.` },
        { status: 404 }
      );
    }

    if (promo.status !== 'Active') {
      return NextResponse.json(
        { success: false, error: `Promo code "${cleanCode}" is no longer active.` },
        { status: 400 }
      );
    }

    if (promo.expiryDate && new Date(promo.expiryDate) < new Date()) {
      return NextResponse.json(
        { success: false, error: `Promo code "${cleanCode}" has expired.` },
        { status: 400 }
      );
    }

    if (promo.usageLimit > 0 && promo.usedCount >= promo.usageLimit) {
      return NextResponse.json(
        { success: false, error: `Promo code "${cleanCode}" has reached its usage limit.` },
        { status: 400 }
      );
    }

    if (subtotal < promo.minSpend) {
      return NextResponse.json(
        {
          success: false,
          error: `Minimum spend of ৳${promo.minSpend.toLocaleString()} required for promo code "${cleanCode}".`,
        },
        { status: 400 }
      );
    }

    let calculatedDiscount: number;
    if (promo.discountType === 'percentage') {
      calculatedDiscount = (subtotal * promo.discountValue) / 100;
      if (promo.maxDiscount > 0) {
        calculatedDiscount = Math.min(calculatedDiscount, promo.maxDiscount);
      }
    } else {
      calculatedDiscount = promo.discountValue;
    }

    // Never discount more than the cart is worth.
    calculatedDiscount = Math.min(calculatedDiscount, subtotal);

    return NextResponse.json({
      success: true,
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      calculatedDiscount,
      message: `Promo code "${cleanCode}" applied successfully!`,
    });
  } catch (err) {
    console.error('[POST /api/promotions/validate]', err);
    const message = err instanceof Error ? err.message : 'Failed to validate promo code';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
