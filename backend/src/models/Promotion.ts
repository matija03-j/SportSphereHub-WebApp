import { Schema, model, Document, Types } from 'mongoose';

export interface IPromotion extends Document {
  name: string;
  facility: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  discountType: 'percent' | 'fixed';
  value: number;
  sport: string; // sport name
}

const promotionSchema = new Schema<IPromotion>(
  {
    name: { type: String, required: true },
    facility: { type: Schema.Types.ObjectId, ref: 'Facility', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    discountType: { type: String, enum: ['percent', 'fixed'], required: true },
    value: { type: Number, required: true },
    sport: { type: String }, // sport name
  },
  { collection: 'promotions', timestamps: true }
);

export const Promotion = model<IPromotion>('Promotion', promotionSchema);
