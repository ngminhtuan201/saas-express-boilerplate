import mongoose from "mongoose";
import { UserOAuthProvider, UserRole } from "../enums/user.enum";
import { BaseModel } from "./Base";

export interface User extends BaseModel {
  email: string;
  emailVerified: boolean;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  hashedPassword?: string;

  verificationToken?: string;
  verificationTokenExpiry?: Date;

  oauthId?: string;
  oauthProvider?: UserOAuthProvider;
  oauthAvatarUrl?: string;
}

const userSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      unique: true,
    },
    email: { type: String, unique: true, required: true },
    emailVerified: { type: Boolean, default: false, required: true },
    fullName: { type: String, required: true },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
      required: true,
    },
    avatarUrl: { type: String, required: false },
    hashedPassword: { type: String, required: false },

    verificationToken: { type: String, required: false },
    verificationTokenExpiry: { type: Date, required: false },

    oauthId: { type: String, required: false },
    oauthProvider: {
      type: String,
      enum: Object.values(UserOAuthProvider),
      required: false,
    },
    oauthAvatarUrl: { type: String, required: false },
  },
  {
    timestamps: true,
  },
);

userSchema.index(
  { verificationToken: 1 },
  {
    unique: true,
    partialFilterExpression: {
      verificationToken: { $exists: true, $ne: null },
    },
  },
);

export const UserModel = mongoose.model<User>("User", userSchema);
