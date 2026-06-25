import { Schema, model, Document, Types } from 'mongoose';

export type Role = 'athlete' | 'employee' | 'admin';
export type UserStatus = 'pending' | 'approved' | 'rejected';

export interface IUser extends Document {
  username: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  profileImage: string;
  sports: string[]; // sport names
  role: Role;
  status: UserStatus;
}

const userSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    profileImage: { type: String, default: '/uploads/default-avatar.png' },
    sports: [{ type: String }],
    role: { type: String, enum: ['athlete', 'employee', 'admin'], required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  },
  { collection: 'users', timestamps: true }
);

export const User = model<IUser>('User', userSchema);
