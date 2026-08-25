import mongoose, { Schema, Document } from 'mongoose';

export interface IBlockedIp extends Document {
  ip: string;
  reason: string;
  blockedBy: string;
  blockedAt: Date;
}

const BlockedIpSchema = new Schema<IBlockedIp>(
  {
    ip: { type: String, required: true, unique: true, index: true },
    reason: { type: String, default: 'Security Violation / Suspicious Activity' },
    blockedBy: { type: String, default: 'Administrator' },
    blockedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const BlockedIpModel = mongoose.models.BlockedIp || mongoose.model<IBlockedIp>('BlockedIp', BlockedIpSchema);
