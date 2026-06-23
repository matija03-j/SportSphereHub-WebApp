import { Schema, model, Document, Types } from 'mongoose';

export interface IReview extends Document {
  user: string; // username
  facility: Types.ObjectId;
  reaction: 'like' | 'dislike';
  comment: string;
  createdAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    user: { type: String, required: true }, // username
    facility: { type: Schema.Types.ObjectId, ref: 'Facility', required: true },
    reaction: { type: String, enum: ['like', 'dislike'], required: true },
    comment: { type: String, default: '' },
  },
  { collection: 'reviews', timestamps: true }
);

export const Review = model<IReview>('Review', reviewSchema);
