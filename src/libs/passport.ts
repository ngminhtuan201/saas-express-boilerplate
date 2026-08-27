import { Request } from "express";
import {
  Profile as GoogleProfile,
  Strategy as GoogleStrategy,
  VerifyCallback as GoogleVerifyCallback,
} from "passport-google-oauth20";
import passportJwt from "passport-jwt";
import {
  Strategy as LocalStrategy,
  VerifiedCallback as LocalVerifiedCallback,
} from "passport-local";
import { config } from "../config";
import { errors } from "../errors";
import { UserModel } from "../models";
import { JwtPayload } from "./jwt";

const extractJWTFromRequest = (req: Request): string | null => {
  const authorization = req.headers?.authorization;
  if (authorization) {
    const [bearer, authToken] = authorization.split(" ");
    if (bearer && bearer.toLowerCase() === "bearer" && authToken) {
      return authToken;
    }

    return null;
  }

  return null;
};

export const passportJWTStrategy = new passportJwt.Strategy(
  {
    jwtFromRequest: extractJWTFromRequest,
    algorithms: ["HS256"],
    secretOrKey: config.JWT_ACCESS_TOKEN_SECRET,
  },
  async (payload: JwtPayload, done: passportJwt.VerifiedCallback) => {
    try {
      const { userId } = payload;
      const user = await UserModel.findOne({ id: userId }).lean().exec();

      if (!user) {
        return done(errors.Unauthorized);
      }

      if (!user.emailVerified) {
        return done(errors.UnverifiedAccount);
      }

      done(null, user);
    } catch (error) {
      done(error);
    }
  },
);

export const passportGoogleStrategy = new GoogleStrategy(
  {
    clientID: config.GOOGLE_OAUTH_CLIENT_ID,
    clientSecret: config.GOOGLE_OAUTH_CLIENT_SECRET,
    callbackURL: config.GOOGLE_OAUTH_REDIRECT_URL,
  },
  async (
    _accessToken: string,
    _refreshToken: string,
    profile: GoogleProfile,
    done: GoogleVerifyCallback,
  ) => {
    try {
      done(null, profile);
    } catch (error) {
      done(error);
    }
  },
);

export const passportLocalStrategy = new LocalStrategy(
  {
    usernameField: "username",
    passwordField: "password",
  },
  (username: string, password: string, done: LocalVerifiedCallback) => {
    try {
      if (
        username === config.BULL_BOARD_USERNAME &&
        password === config.BULL_BOARD_PASSWORD
      ) {
        return done(null, { username });
      }
      return done(null, false, { message: "Invalid username or password" });
    } catch (error) {
      return done(error);
    }
  },
);
