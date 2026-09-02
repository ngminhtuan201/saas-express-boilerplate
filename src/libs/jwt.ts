import { sign, SignOptions, verify } from "jsonwebtoken";
import { AuthToken } from "../modules/auth/auth.type";
import { config } from "./env";

export interface JwtPayload {
  userId: string;
}

const minutesToSeconds = (minutes: number): number => minutes * 60;
const minutesToMilliseconds = (minutes: number): number => minutes * 60 * 1000;

const getBaseSignOptions = (): SignOptions => ({
  jwtid: `jwtid_${Date.now()}`,
  algorithm: "HS256",
});

export const signAccessToken = (payload: JwtPayload): AuthToken => {
  return {
    token: sign(payload, config.JWT_ACCESS_TOKEN_SECRET, {
      ...getBaseSignOptions(),
      expiresIn: minutesToSeconds(config.JWT_ACCESS_TOKEN_EXPIRY_MINUTES),
    }),
    expiresAt: new Date(
      Date.now() +
        minutesToMilliseconds(config.JWT_ACCESS_TOKEN_EXPIRY_MINUTES),
    ),
  };
};

export const signRefreshToken = (payload: JwtPayload): AuthToken => {
  return {
    token: sign(payload, config.JWT_REFRESH_TOKEN_SECRET, {
      ...getBaseSignOptions(),
      expiresIn: minutesToSeconds(config.JWT_REFRESH_TOKEN_EXPIRY_MINUTES),
    }),
    expiresAt: new Date(
      Date.now() +
        minutesToMilliseconds(config.JWT_REFRESH_TOKEN_EXPIRY_MINUTES),
    ),
  };
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  return verify(token, config.JWT_REFRESH_TOKEN_SECRET) as JwtPayload;
};

export const signVerificationToken = (payload: JwtPayload): string => {
  return sign(payload, config.JWT_ACCESS_TOKEN_SECRET, {
    ...getBaseSignOptions(),
    expiresIn: minutesToSeconds(config.VERIFICATION_TOKEN_EXPIRY_MINUTES),
  });
};

export const verifyVerificationToken = (token: string): JwtPayload => {
  return verify(token, config.JWT_ACCESS_TOKEN_SECRET) as JwtPayload;
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
