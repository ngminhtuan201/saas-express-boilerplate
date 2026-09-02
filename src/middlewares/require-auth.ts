import { NextFunction, Request, RequestHandler, Response } from "express";
import passport from "passport";
import { errors } from "../libs/errors";
import { User } from "../models/User";

export const requireAuth = (): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    passport.authenticate(
      "jwt",
      { session: false },
      (error: Error, user: User, _info: unknown) => {
        if (error || !user) {
          next(errors.Unauthorized);
          return;
        }

        req.user = user;
        next();
      },
    )(req, res, next);
  };
};
