import { Schema, model, Document, Types } from 'mongoose';

export interface ITrainer extends Document {
  name: string;
  specialization: string;
  facility: Types.ObjectId;
  sport: string; // sport name
  pricePerHour: number;
  active: boolean;
}

const trainerSchema = new Schema<ITrainer>(
  {
    name: { type: String, required: true },
    specialization: { type: String, default: '' },
    facility: { type: Schema.Types.ObjectId, ref: 'Facility', required: true },
    sport: { type: String, required: true }, // sport name
    pricePerHour: { type: Number, required: true },
    active: { type: Boolean, default: true },
  },
  { collection: 'trainers', timestamps: true }
);

export const Trainer = model<ITrainer>('Trainer', trainerSchema);
