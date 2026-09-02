import httpStatus from "http-status";

export const ERROR_MESSAGE_CODE = {
  Forbidden: "FORBIDDEN",
  Unauthorized: "UNAUTHORIZED",
  BadRequest: "BAD_REQUEST",
  NotFound: "NOT_FOUND",
  Conflict: "CONFLICT",
  ServiceUnavailable: "SERVICE_UNAVAILABLE",
  InternalServerError: "INTERNAL_SERVER_ERROR",

  EmailTaken: "EMAIL_TAKEN",
  InvalidCredentials: "INVALID_CREDENTIALS",
  TokenExpired: "TOKEN_EXPIRED",
  UnverifiedAccount: "UNVERIFIED_ACCOUNT",
  ValidationFailed: "VALIDATION_FAILED",
  FileMissing: "FILE_MISSING",
  InvalidFileType: "INVALID_FILE_TYPE",
  UserNotFound: "USER_NOT_FOUND",
  DuplicateKey: "DUPLICATE_KEY",
};

export class AppError extends Error {
  statusCode: number;
  messageCode: string;
  details?: unknown;
  isOperational: boolean;

  constructor(
    statusCode: number,
    messageCode: string,
    message: string,
    details?: unknown,
    isOperational = true,
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.messageCode = messageCode;
    this.details = details;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errors = {
  get BadRequest(): AppError {
    return new AppError(
      httpStatus.BAD_REQUEST,
      ERROR_MESSAGE_CODE.BadRequest,
      "The request is invalid.",
    );
  },
  get Unauthorized(): AppError {
    return new AppError(
      httpStatus.UNAUTHORIZED,
      ERROR_MESSAGE_CODE.Unauthorized,
      "The request has not been authenticated.",
    );
  },
  get Forbidden(): AppError {
    return new AppError(
      httpStatus.FORBIDDEN,
      ERROR_MESSAGE_CODE.Forbidden,
      "The request is forbidden.",
    );
  },
  get NotFound(): AppError {
    return new AppError(
      httpStatus.NOT_FOUND,
      ERROR_MESSAGE_CODE.NotFound,
      "The requested resource was not found.",
    );
  },
  get Conflict(): AppError {
    return new AppError(
      httpStatus.CONFLICT,
      ERROR_MESSAGE_CODE.Conflict,
      "The request conflict with current state.",
    );
  },
  get ServiceUnavailable(): AppError {
    return new AppError(
      httpStatus.SERVICE_UNAVAILABLE,
      ERROR_MESSAGE_CODE.ServiceUnavailable,
      "The service is unavailable.",
    );
  },

  get TokenExpired(): AppError {
    return new AppError(
      httpStatus.UNAUTHORIZED,
      ERROR_MESSAGE_CODE.TokenExpired,
      "Session expired. Please login again.",
    );
  },
  ValidationFailed: (details?: unknown): AppError =>
    new AppError(
      httpStatus.BAD_REQUEST,
      ERROR_MESSAGE_CODE.ValidationFailed,
      typeof details === "string"
        ? details
        : "Failed to validate your request data.",
      details,
    ),
  get InvalidCredentials(): AppError {
    return new AppError(
      httpStatus.UNAUTHORIZED,
      ERROR_MESSAGE_CODE.InvalidCredentials,
      "Invalid credentials.",
    );
  },
  get EmailTaken(): AppError {
    return new AppError(
      httpStatus.CONFLICT,
      ERROR_MESSAGE_CODE.EmailTaken,
      "The email has been taken.",
    );
  },
  get UnverifiedAccount(): AppError {
    return new AppError(
      httpStatus.FORBIDDEN,
      ERROR_MESSAGE_CODE.UnverifiedAccount,
      "The account has not been verified.",
    );
  },
  get FileMissing(): AppError {
    return new AppError(
      httpStatus.BAD_REQUEST,
      ERROR_MESSAGE_CODE.FileMissing,
      "No file provided.",
    );
  },
  get InvalidFileType(): AppError {
    return new AppError(
      httpStatus.BAD_REQUEST,
      ERROR_MESSAGE_CODE.InvalidFileType,
      "File type is not supported.",
    );
  },
  get UserNotFound(): AppError {
    return new AppError(
      httpStatus.NOT_FOUND,
      ERROR_MESSAGE_CODE.UserNotFound,
      "User not found.",
    );
  },
  Custom: (
    statusCode: number,
    messageCode: string,
    message: string,
    details?: unknown,
  ): AppError => new AppError(statusCode, messageCode, message, details),
};
