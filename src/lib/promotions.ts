import { DiscountType, PromotionStatus } from '@prisma/client';

export interface EvaluationResult {
  isValid: boolean;
  error?: string;
  calculatedDiscount?: number;
}

export interface PromoEvaluationInput {
  code: string;
  status: PromotionStatus;
  expiryDate: string;
  usageLimit: number;
  usedCount: number;
  minSpend: number;
  discountType: DiscountType;
  discountValue: number;
  maxDiscount: number;
}

/**
 * Reusable server-side promotion validation logic.
 * Used by both /api/promotions/validate and order creation validation.
 */
export function evaluatePromotion(
  promo: PromoEvaluationInput,
  subtotal: number
): EvaluationResult {
  const cleanCode = promo.code.trim().toUpperCase();

  if (promo.status !== PromotionStatus.Active) {
    return { isValid: false, error: `Promo code "${cleanCode}" is no longer active.` };
  }

  // Handle expiry
  if (promo.expiryDate && new Date(promo.expiryDate) < new Date()) {
    return { isValid: false, error: `Promo code "${cleanCode}" has expired.` };
  }

  // Handle usage limit
  if (promo.usageLimit > 0 && promo.usedCount >= promo.usageLimit) {
    return { isValid: false, error: `Promo code "${cleanCode}" has reached its usage limit.` };
  }

  // Handle minimum spend
  if (subtotal < promo.minSpend) {
    return {
      isValid: false,
      error: `Minimum spend of ৳${promo.minSpend.toLocaleString()} required for promo code "${cleanCode}".`,
    };
  }

  // Calculate discount
  let calculatedDiscount: number;
  if (promo.discountType === 'percentage') {
    calculatedDiscount = (subtotal * promo.discountValue) / 100;
    if (promo.maxDiscount > 0) {
      calculatedDiscount = Math.min(calculatedDiscount, promo.maxDiscount);
    }
  } else {
    calculatedDiscount = promo.discountValue;
  }

  // Never discount more than the cart is worth
  calculatedDiscount = Math.min(calculatedDiscount, subtotal);

  return {
    isValid: true,
    calculatedDiscount,
  };
}
