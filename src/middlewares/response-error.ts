import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { ERROR_MESSAGE_CODE } from "../libs/errors";
import { logger } from "../libs/logger";
import { getRequestContext } from "../libs/request";

const isDev = process.env.NODE_ENV === "development";

export interface StandardErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    statusCode: number;
    requestId?: string;
    details?: unknown;
    stack?: string;
  };
}

interface CustomErrorLike extends Error {
  statusCode?: number;
  messageCode?: string;
  details?: unknown;
  code?: number | string;
  keyValue?: Record<string, unknown>;
  errors?: Record<string, { message?: string }>;
  path?: string;
  value?: unknown;
  field?: string;
}

export const handleResponseError = (
  err: CustomErrorLike,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const context = getRequestContext();
  const requestId = context?.requestId;

  let statusCode = err?.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
  let code = err?.messageCode || ERROR_MESSAGE_CODE.InternalServerError;
  let message = err?.message || "Something went wrong";
  let details = err?.details;

  // 1. Mongoose Validation Error
  if (err?.name === "ValidationError" && err?.errors) {
    statusCode = httpStatus.BAD_REQUEST;
    code = ERROR_MESSAGE_CODE.ValidationFailed;
    message = "Validation failed for one or more fields.";
    details = Object.keys(err.errors).map((key) => ({
      field: key,
      message: err.errors?.[key]?.message,
    }));
  }

  // 2. Mongoose Cast Error (Invalid ObjectId / field type)
  else if (err?.name === "CastError") {
    statusCode = httpStatus.BAD_REQUEST;
    code = ERROR_MESSAGE_CODE.BadRequest;
    message = `Invalid value for field '${err.path}': ${err.value}`;
  }

  // 3. MongoDB Duplicate Key Error (E11000)
  else if (err?.code === 11000 || err?.name === "MongoServerError") {
    statusCode = httpStatus.CONFLICT;
    code = ERROR_MESSAGE_CODE.DuplicateKey;
    const duplicatedFields = err.keyValue
      ? Object.keys(err.keyValue).join(", ")
      : "resource";
    message = `Duplicate key error: A record with this ${duplicatedFields} already exists.`;
    details = err.keyValue;
  }

  // 4. JWT Errors
  else if (err?.name === "JsonWebTokenError") {
    statusCode = httpStatus.UNAUTHORIZED;
    code = ERROR_MESSAGE_CODE.Unauthorized;
    message = "Invalid authentication token.";
  } else if (err?.name === "TokenExpiredError") {
    statusCode = httpStatus.UNAUTHORIZED;
    code = ERROR_MESSAGE_CODE.TokenExpired;
    message = "Authentication token has expired.";
  }

  // 5. Multer File Upload Errors
  else if (err?.name === "MulterError") {
    statusCode = httpStatus.BAD_REQUEST;
    code = ERROR_MESSAGE_CODE.BadRequest;
    if (err.code === "LIMIT_FILE_SIZE") {
      statusCode = httpStatus.REQUEST_ENTITY_TOO_LARGE || 413;
      message = "File size exceeds the allowed limit.";
    } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
      message = `Unexpected file field: ${err.field}`;
    } else {
      message = err.message || "File upload error.";
    }
  }

  // 6. Body Parser Syntax Error (Invalid JSON payload)
  else if (err instanceof SyntaxError && "body" in err) {
    statusCode = httpStatus.BAD_REQUEST;
    code = ERROR_MESSAGE_CODE.BadRequest;
    message = "Malformed JSON syntax in request body.";
  }

  // Set message in res.locals for Morgan logging
  res.locals.errorMessage = message;

  // Log error
  if (statusCode >= 500) {
    logger.error(
      `❌ [server] Error 500: ${message}\nStack: ${err?.stack || ""}`,
    );
  } else {
    logger.warn(`⚠️ [server] Error ${statusCode} [${code}]: ${message}`);
  }

  const responsePayload: StandardErrorResponse = {
    success: false,
    error: {
      code,
      message,
      statusCode,
      requestId,
      ...(details !== undefined && { details }),
      ...(isDev && err?.stack && { stack: err.stack }),
    },
  };

  return res.status(statusCode).json(responsePayload);
};
