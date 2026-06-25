import { Schema, model, Document, Types } from 'mongoose';

export type OrderStatus = 'ordered' | 'accepted' | 'picked_up' | 'cancelled';

export interface IOrderItem {
  equipment: Types.ObjectId;
  qty: number;
  priceAtOrder: number;
}

export interface IOrder extends Document {
  user: string; // username
  items: IOrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    equipment: { type: Schema.Types.ObjectId, ref: 'Equipment', required: true },
    qty: { type: Number, required: true, min: 1 },
    priceAtOrder: { type: Number, required: true },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    user: { type: String, required: true }, // username
    items: { type: [orderItemSchema], required: true },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ['ordered', 'accepted', 'picked_up', 'cancelled'],
      default: 'ordered',
    },
  },
  { collection: 'orders', timestamps: true }
);

export const Order = model<IOrder>('Order', orderSchema);
