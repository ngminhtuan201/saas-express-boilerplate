import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors";
import { getRequestContext, logger } from "../libs";

const isDev = process.env.NODE_ENV === "development";

export const handleResponseError = (
  error: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const context = getRequestContext();
  const requestId = context?.requestId;

  logger.error(error);

  const statusCode = error?.statusCode || 500;
  const errorResponse: unknown = {
    name: error?.name || "Error",
    message: error?.message || "Something went wrong",
    statusCode,
    requestId,
  };

  if (isDev && error.stack) {
    errorResponse["stack"] = error.stack;
  }

  return res.status(statusCode).send({ error: errorResponse });
};
