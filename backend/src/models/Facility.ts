import { Schema, model, Document, Types } from 'mongoose';

export type ResourceType = 'open' | 'closed' | 'hall';

export interface IResource {
  _id?: Types.ObjectId;
  name: string;
  type: ResourceType;
  capacity: number;
  equipmentDescription: string;
  sport: string; // sport name
}

export interface IFacility extends Document {
  name: string;
  city: string;
  address: string;
  maticniBroj: string;
  pib: string;
  employees: string[]; // usernames
  status: 'pending' | 'approved';
  pricePerHour: number;
  workingHours: { open: string; close: string };
  maxNoShows: number;
  sports: string[]; // sport names
  description: string;
  images: string[];
  likes: string[]; // usernames
  dislikes: string[]; // usernames
  resources: Types.DocumentArray<IResource>;
}

const resourceSchema = new Schema<IResource>({
  name: { type: String, required: true },
  type: { type: String, enum: ['open', 'closed', 'hall'], required: true },
  capacity: { type: Number, required: true },
  equipmentDescription: { type: String, maxlength: 300, default: '' },
  sport: { type: String, required: true },
});

const facilitySchema = new Schema<IFacility>(
  {
    name: { type: String, required: true },
    city: { type: String, required: true },
    address: { type: String, required: true },
    maticniBroj: { type: String, required: true, unique: true },
    pib: { type: String, required: true, unique: true },
    employees: [{ type: String }],
    status: { type: String, enum: ['pending', 'approved'], default: 'pending' },
    pricePerHour: { type: Number, required: true },
    workingHours: {
      open: { type: String, default: '08:00' },
      close: { type: String, default: '22:00' },
    },
    maxNoShows: { type: Number, default: 3 },
    sports: [{ type: String }],
    description: { type: String, default: '' },
    images: [{ type: String }],
    likes: [{ type: String }],
    dislikes: [{ type: String }],
    resources: [resourceSchema],
  },
  { collection: 'facilities', timestamps: true }
);

export const Facility = model<IFacility>('Facility', facilitySchema);
