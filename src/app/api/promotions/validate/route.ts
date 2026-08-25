import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { PromotionModel } from '@/models/Promotion';

export async function POST(req: Request) {
  try {
    const { code, cartSubtotal } = await req.json();

    if (!code) {
      return NextResponse.json({ success: false, error: 'Promo code is required' }, { status: 400 });
    }

    const cleanCode = code.toUpperCase().trim();
    await connectToDatabase();

    const promo = await PromotionModel.findOne({ code: cleanCode });

    if (!promo) {
      return NextResponse.json({ success: false, error: `Promo code "${cleanCode}" is invalid.` }, { status: 404 });
    }

    if (promo.status !== 'Active') {
      return NextResponse.json({ success: false, error: `Promo code "${cleanCode}" is no longer active.` }, { status: 400 });
    }

    if (promo.expiryDate && new Date(promo.expiryDate) < new Date()) {
      return NextResponse.json({ success: false, error: `Promo code "${cleanCode}" has expired.` }, { status: 400 });
    }

    if (cartSubtotal < promo.minSpend) {
      return NextResponse.json({
        success: false,
        error: `Minimum spend of ৳${promo.minSpend.toLocaleString()} required for promo code "${cleanCode}".`
      }, { status: 400 });
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

    return NextResponse.json({
      success: true,
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      calculatedDiscount,
      message: `Promo code "${cleanCode}" applied successfully!`
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
