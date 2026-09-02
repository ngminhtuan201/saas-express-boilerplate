import bcrypt from "bcryptjs";
import { JwtPayload, signAccessToken, signRefreshToken } from "../../libs/jwt";
import { User, UserModel } from "../../models/User";
import { AuthToken } from "./auth.type";

export const hashPassword = async (password: string): Promise<string> => {
  const rounds = 10;
  const salt = await bcrypt.genSalt(rounds);

  return bcrypt.hash(password, salt);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string,
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export const extractJwtPayloadFromUser = (user: User): JwtPayload => {
  return {
    userId: user.id,
  };
};

export const signAuthTokens = (
  jwtPayload: JwtPayload,
): {
  accessToken: AuthToken;
  refreshToken: AuthToken;
} => {
  return {
    accessToken: signAccessToken(jwtPayload),
    refreshToken: signRefreshToken(jwtPayload),
  };
};

export const isEmailTaken = async (email: string): Promise<boolean> => {
  return !!(await UserModel.exists({ email: email }));
};
