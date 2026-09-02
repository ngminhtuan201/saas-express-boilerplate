import { NextFunction, Request, Response } from "express";

/**
 * Safely assign a property to req (handling Express 5 getter-only properties like req.query and req.params)
 */
const setRequestProperty = (
  req: Request,
  prop: "body" | "query" | "params",
  value: unknown,
) => {
  Object.defineProperty(req, prop, {
    value,
    writable: true,
    enumerable: true,
    configurable: true,
  });
};

/**
 * Recursively sanitizes objects to prevent NoSQL injection by stripping keys that start with '$' or contain '.'
 */
const sanitizeNoSqlObject = (obj: unknown): unknown => {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeNoSqlObject);
  }

  const cleanObj: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    // If key starts with '$' or contains '.', strip or ignore to prevent Mongo operator injection
    if (key.startsWith("$") || key.includes(".")) {
      continue;
    }
    cleanObj[key] = sanitizeNoSqlObject(value);
  }

  return cleanObj;
};

/**
 * Middleware to sanitize incoming request data against NoSQL Injection
 */
export const noSqlInjectionSanitizer = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  if (req.body && typeof req.body === "object") {
    setRequestProperty(req, "body", sanitizeNoSqlObject(req.body));
  }
  if (req.query && typeof req.query === "object") {
    setRequestProperty(req, "query", sanitizeNoSqlObject(req.query));
  }
  if (req.params && typeof req.params === "object") {
    setRequestProperty(req, "params", sanitizeNoSqlObject(req.params));
  }
  next();
};

/**
 * Clean dangerous HTML/XSS script content from strings
 */
const sanitizeXssString = (value: string): string => {
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/javascript:[^\s"']*/gi, "")
    .replace(/on\w+\s*=\s*(["']).*?\1/gi, "");
};

const sanitizeXssObject = (obj: unknown): unknown => {
  if (obj === null || typeof obj !== "object") {
    if (typeof obj === "string") {
      return sanitizeXssString(obj);
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeXssObject);
  }

  const cleanObj: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    cleanObj[key] = sanitizeXssObject(value);
  }

  return cleanObj;
};

/**
 * Middleware to sanitize incoming request data against Cross-Site Scripting (XSS)
 */
export const xssSanitizer = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  if (req.body && typeof req.body === "object") {
    setRequestProperty(req, "body", sanitizeXssObject(req.body));
  }
  if (req.query && typeof req.query === "object") {
    setRequestProperty(req, "query", sanitizeXssObject(req.query));
  }
  if (req.params && typeof req.params === "object") {
    setRequestProperty(req, "params", sanitizeXssObject(req.params));
  }
  next();
};
