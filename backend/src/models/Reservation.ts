import { Schema, model, Document, Types } from 'mongoose';

export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'no_show'
  | 'completed';

export interface IReservation extends Document {
  facility: Types.ObjectId;
  resourceId: Types.ObjectId;
  user: string; // username
  sport: string; // sport name
  start: Date;
  end: Date;
  status: ReservationStatus;
}

const reservationSchema = new Schema<IReservation>(
  {
    facility: { type: Schema.Types.ObjectId, ref: 'Facility', required: true },
    resourceId: { type: Schema.Types.ObjectId, required: true },
    user: { type: String, required: true }, // username
    sport: { type: String, required: true }, // sport name
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'no_show', 'completed'],
      default: 'pending',
    },
  },
  { collection: 'reservations', timestamps: true }
);

export const Reservation = model<IReservation>('Reservation', reservationSchema);
