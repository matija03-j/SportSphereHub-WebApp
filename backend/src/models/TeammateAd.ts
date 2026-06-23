import { Schema, model, Document, Types } from 'mongoose';

export interface IJoinRequest {
  user: string; // username
  status: 'pending' | 'approved' | 'rejected';
}

export interface ITeammateAd extends Document {
  author: string; // username
  sport: string; // sport name
  city: string;
  date: string;
  timeFrom: string;
  timeTo: string;
  neededPlayers: number;
  status: 'active' | 'inactive';
  joinRequests: Types.DocumentArray<IJoinRequest>;
}

const joinRequestSchema = new Schema<IJoinRequest>({
  user: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
});

const teammateAdSchema = new Schema<ITeammateAd>(
  {
    author: { type: String, required: true },
    sport: { type: String, required: true },
    city: { type: String, required: true },
    date: { type: String, required: true },
    timeFrom: { type: String, required: true },
    timeTo: { type: String, required: true },
    neededPlayers: { type: Number, required: true, min: 1 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    joinRequests: [joinRequestSchema],
  },
  { collection: 'teammateads', timestamps: true }
);

export const TeammateAd = model<ITeammateAd>('TeammateAd', teammateAdSchema);
