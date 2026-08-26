import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { evaluatePromotion } from '@/lib/promotions';

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

    const evaluation = evaluatePromotion(promo, subtotal);

    if (!evaluation.isValid) {
      return NextResponse.json(
        { success: false, error: evaluation.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      calculatedDiscount: evaluation.calculatedDiscount,
      message: `Promo code "${cleanCode}" applied successfully!`,
    });
  } catch (err) {
    console.error('[POST /api/promotions/validate]', err);
    const message = err instanceof Error ? err.message : 'Failed to validate promo code';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
