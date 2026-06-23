import { Schema, model, Document } from 'mongoose';

export interface ISport extends Document {
  name: string;
}

const sportSchema = new Schema<ISport>(
  {
    name: { type: String, required: true, unique: true, trim: true },
  },
  { collection: 'sports' }
);

export const Sport = model<ISport>('Sport', sportSchema);
