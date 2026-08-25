import mongoose, { Schema, Document } from 'mongoose';

export interface ISubCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface ICategory extends Document {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  image?: string;
  subCategories: ISubCategory[];
  isFeatured?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SubCategorySchema = new Schema<ISubCategory>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    description: { type: String, default: '' }
  },
  { _id: false }
);

const CategorySchema = new Schema<ICategory>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    icon: { type: String, default: 'Tag' },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    subCategories: [SubCategorySchema],
    isFeatured: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const CategoryModel =
  mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);
