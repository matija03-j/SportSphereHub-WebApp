import { Schema, model, Document, Types } from 'mongoose';

export interface IPasswordResetToken extends Document {
  user: Types.ObjectId;
  token: string;
  expiresAt: Date;
}

const passwordResetTokenSchema = new Schema<IPasswordResetToken>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
  },
  { collection: 'passwordresettokens' }
);

export const PasswordResetToken = model<IPasswordResetToken>(
  'PasswordResetToken',
  passwordResetTokenSchema
);
