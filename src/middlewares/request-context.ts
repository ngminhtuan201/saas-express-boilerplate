import { NextFunction, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { requestContext } from "../libs/request";

export const applyRequestContext = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const requestId = (req.headers["x-request-id"] as string) || uuidv4();

  const context = {
    requestId,
  };

  requestContext.run(context, () => {
    next();
  });
};
