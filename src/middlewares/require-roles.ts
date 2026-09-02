import { NextFunction, Request, RequestHandler, Response } from "express";
import { UserRole } from "../enums/user.enum";
import { errors } from "../libs/errors";
import { getCurrentUser } from "../libs/request";

export const requireRoles = (roles: UserRole[]): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = getCurrentUser(req);

    if (!user) {
      next(errors.Unauthorized);
      return;
    }

    if (roles.length && !roles.includes(user.role)) {
      next(errors.Forbidden);
      return;
    }

    req.user = user;
    next();
  };
};
