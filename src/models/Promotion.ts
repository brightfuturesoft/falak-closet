import mongoose, { Schema, Document } from 'mongoose';

export interface IPromotion extends Document {
  id?: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minSpend: number;
  maxDiscount?: number;
  usageLimit: number;
  usedCount: number;
  expiryDate: string;
  status: 'Active' | 'Expired' | 'Disabled';
  createdAt: Date;
  updatedAt: Date;
}

const PromotionSchema = new Schema<IPromotion>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    discountType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
    discountValue: { type: Number, required: true },
    minSpend: { type: Number, default: 0 },
    maxDiscount: { type: Number, default: 0 },
    usageLimit: { type: Number, default: 100 },
    usedCount: { type: Number, default: 0 },
    expiryDate: { type: String, default: '2026-12-31' },
    status: { type: String, enum: ['Active', 'Expired', 'Disabled'], default: 'Active' }
  },
  { timestamps: true }
);

export const PromotionModel =
  mongoose.models.Promotion || mongoose.model<IPromotion>('Promotion', PromotionSchema);
