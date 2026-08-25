import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrderDoc extends Document {
  id: string;
  date: string;
  items: Array<{
    product: Record<string, unknown>;
    selectedColor: string;
    selectedSize: string;
    quantity: number;
  }>;
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  status: 'Processing' | 'Quality Checked' | 'Shipped' | 'Out for Delivery' | 'Delivered';
  shippingAddress: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    country: string;
    postalCode: string;
  };
  deliveryMethod: string;
  paymentMethod: string;
  trackingNumber: string;
  estimatedDelivery: string;
}

const OrderSchema = new Schema<IOrderDoc>(
  {
    id: { type: String, required: true, unique: true, index: true },
    date: { type: String, required: true },
    items: [
      {
        product: Schema.Types.Mixed,
        selectedColor: String,
        selectedSize: String,
        quantity: Number
      }
    ],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ['Processing', 'Quality Checked', 'Shipped', 'Out for Delivery', 'Delivered'],
      default: 'Processing'
    },
    shippingAddress: {
      fullName: String,
      phone: String,
      street: String,
      city: String,
      country: String,
      postalCode: String
    },
    deliveryMethod: String,
    paymentMethod: String,
    trackingNumber: String,
    estimatedDelivery: String
  },
  { timestamps: true }
);

export const OrderModel: Model<IOrderDoc> =
  mongoose.models.Order || mongoose.model<IOrderDoc>('Order', OrderSchema);
