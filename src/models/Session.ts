import mongoose from "mongoose";

export interface Session {
  userId: string;
  refreshToken: string;
  expiresAt: Date;
}

const sessionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    refreshToken: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const SessionModel = mongoose.model<Session>("Session", sessionSchema);
