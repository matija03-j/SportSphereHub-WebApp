import { Schema, model, Document, Types } from 'mongoose';

export interface IEquipment extends Document {
  name: string;
  sport: string; // sport name
  price: number;
  stock: number;
  image: string;
  facility: Types.ObjectId;
}

const equipmentSchema = new Schema<IEquipment>(
  {
    name: { type: String, required: true },
    sport: { type: String, required: true }, // sport name
    price: { type: Number, required: true },
    stock: { type: Number, required: true, default: 0 },
    image: { type: String, default: '/uploads/default-equipment.svg' },
    facility: { type: Schema.Types.ObjectId, ref: 'Facility', required: true },
  },
  { collection: 'equipment', timestamps: true }
);

export const Equipment = model<IEquipment>('Equipment', equipmentSchema);
