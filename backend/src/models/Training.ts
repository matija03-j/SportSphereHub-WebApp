import { Schema, model, Document, Types } from 'mongoose';

export type TrainingStatus = 'scheduled' | 'completed' | 'cancelled';

export interface ITraining extends Document {
  trainer: Types.ObjectId;
  user: string; // username
  facility: Types.ObjectId;
  sport: string; // sport name
  start: Date;
  end: Date;
  status: TrainingStatus;
}

const trainingSchema = new Schema<ITraining>(
  {
    trainer: { type: Schema.Types.ObjectId, ref: 'Trainer', required: true },
    user: { type: String, required: true }, // username
    facility: { type: Schema.Types.ObjectId, ref: 'Facility', required: true },
    sport: { type: String, required: true }, // sport name
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled'],
      default: 'scheduled',
    },
  },
  { collection: 'trainings', timestamps: true }
);

export const Training = model<ITraining>('Training', trainingSchema);
