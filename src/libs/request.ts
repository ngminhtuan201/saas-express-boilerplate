import { AsyncLocalStorage } from "async_hooks";
import { NextFunction, Request, Response } from "express";
import morgan from "morgan";
import { User } from "../models/User";
import { logger } from "./logger";

// Request context
export interface IRequestContext {
  requestId: string;
  userId?: string;
}

export const requestContext = new AsyncLocalStorage<IRequestContext>();

export const getRequestContext = (): IRequestContext | undefined => {
  return requestContext.getStore();
};

export const getCurrentUser = (req: Request): User | undefined => {
  return req?.user as User;
};

export type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<unknown> | unknown;

export const catchAsync =
  (fn: AsyncRequestHandler) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch((err) => next(err));
  };

// Request logging
const isProduction = process.env.NODE_ENV === "production";

morgan.token("message", (_req: Request, res: Response) => {
  return res.locals.errorMessage || "no message";
});

morgan.token("requestId", (req: Request) => {
  return (req.headers["x-request-id"] as string) || "no-id";
});

const getIpFormat = (): string => (isProduction ? ":remote-addr - " : "");
const successResponseFormat = `✅ [request] [:requestId] ${getIpFormat()}:method :url :status - :response-time ms`;
const errorResponseFormat = `❌ [request] [:requestId] ${getIpFormat()}:method :url :status - :response-time ms - message: :message`;

export const logSuccessRequest = morgan(successResponseFormat, {
  skip: (_req: Request, res: Response) => res.statusCode >= 400,
  stream: { write: (message: string) => logger.info(message.trim()) },
});

export const logFailedRequest = morgan(errorResponseFormat, {
  skip: (_req: Request, res: Response) => res.statusCode < 400,
  stream: { write: (message: string) => logger.error(message.trim()) },
});

// Request query helpers
export const getSortField = (req: Request): string =>
  String(req.query?.sortField || "").trim() || "updatedAt";

export const getSortOrder = (req: Request): string =>
  String(req.query?.sortOrder || "").trim() || "desc";
