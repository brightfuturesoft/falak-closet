import mongoose, { Schema, Document } from 'mongoose';

export interface IUserItem {
  productId: string;
  selectedColor: string;
  selectedSize: string;
  quantity: number;
}

export interface IUser extends Document {
  email: string;
  phone: string;
  name: string;
  district: string;
  fullAddress: string;
  passwordHash?: string;
  resetOtp?: string;
  cart: IUserItem[];
  wishlist: string[];
  ip?: string;
  isBlocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, index: true },
    phone: { type: String, required: true },
    name: { type: String, required: true },
    district: { type: String, default: 'Dhaka' },
    fullAddress: { type: String, default: '' },
    passwordHash: { type: String, default: '' },
    resetOtp: { type: String, default: '' },
    cart: [
      {
        productId: String,
        selectedColor: String,
        selectedSize: String,
        quantity: { type: Number, default: 1 }
      }
    ],
    wishlist: [{ type: String }],
    ip: { type: String, default: '' },
    isBlocked: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
