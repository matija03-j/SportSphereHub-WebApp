import { Schema, model, Document } from 'mongoose';

export interface IPasswordResetToken extends Document {
  user: string; // username
  token: string;
  expiresAt: Date;
}

const passwordResetTokenSchema = new Schema<IPasswordResetToken>(
  {
    user: { type: String, required: true }, // username
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
  },
  { collection: 'passwordresettokens' }
);

export const PasswordResetToken = model<IPasswordResetToken>(
  'PasswordResetToken',
  passwordResetTokenSchema
);
