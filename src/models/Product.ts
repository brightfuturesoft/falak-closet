import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProductDoc extends Document {
  id: string;
  slug: string;
  name: string;
  category: string;
  subCategory?: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviewCount: number;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  isFlashSale?: boolean;
  discountPercentage: number;
  workType: string;
  occasion: string;
  material: string;
  weather?: string;
  colors: { name: string; hex: string }[];
  sizes: string[];
  stock: number;
  images: string[];
  description: string;
  features: string[];
  careInstructions: string[];
}

const ProductSchema = new Schema<IProductDoc>(
  {
    id: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    category: { type: String, required: true, index: true },
    subCategory: { type: String, index: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number, required: true },
    rating: { type: Number, default: 4.8 },
    reviewCount: { type: Number, default: 0 },
    isNewArrival: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    isFlashSale: { type: Boolean, default: false },
    discountPercentage: { type: Number, default: 0 },
    workType: { type: String, required: true },
    occasion: { type: String, required: true },
    material: { type: String, required: true },
    weather: { type: String, default: '' },
    colors: [{ name: String, hex: String }],
    sizes: [String],
    stock: { type: Number, default: 10 },
    images: [String],
    description: { type: String, required: true },
    features: [String],
    careInstructions: [String]
  },
  { timestamps: true }
);

export const ProductModel: Model<IProductDoc> =
  mongoose.models.Product || mongoose.model<IProductDoc>('Product', ProductSchema);
