import { User } from "../../models/User";

export type SafeUser = Omit<
  User,
  "hashedPassword" | "verificationToken" | "verificationTokenExpiry"
>;

export const sanitizeUser = (
  user:
    | User
    | (Record<string, unknown> & { toObject?: () => Record<string, unknown> }),
): SafeUser => {
  if (!user) {
    return user as unknown as SafeUser;
  }

  // Handle mongoose document or plain object
  const userObj: Record<string, unknown> =
    typeof (user as { toObject?: () => Record<string, unknown> }).toObject ===
    "function"
      ? (user as { toObject: () => Record<string, unknown> }).toObject()
      : { ...user };

  delete userObj.hashedPassword;
  delete userObj.verificationToken;
  delete userObj.verificationTokenExpiry;
  delete userObj.__v;

  return userObj as unknown as SafeUser;
};
