import rateLimit from "express-rate-limit";
import RedisRateLimitStore from "rate-limit-redis";
import { getRedis } from "../dbs/redis";
import { errors } from "../libs/errors";

const createStore = (prefix: string) => {
  try {
    return new RedisRateLimitStore({
      sendCommand: (...args: string[]) =>
        getRedis().call(args[0], ...args.slice(1)) as never,
      prefix: `rl:${prefix}:`,
    });
  } catch {
    return undefined; // Fallback to memory store if Redis is unavailable
  }
};

/**
 * General rate limiter for standard API routes (300 requests per 15 minutes)
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore("api"),
  handler: (_req, _res, next) => {
    next(
      errors.Custom(
        429,
        "TOO_MANY_REQUESTS",
        "Too many requests from this IP, please try again after 15 minutes.",
      ),
    );
  },
});

/**
 * Strict rate limiter for authentication endpoints (10 requests per 15 minutes)
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore("auth"),
  handler: (_req, _res, next) => {
    next(
      errors.Custom(
        429,
        "TOO_MANY_REQUESTS",
        "Too many authentication attempts, please try again after 15 minutes.",
      ),
    );
  },
});

/**
 * Upload rate limiter (30 uploads per 15 minutes)
 */
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore("upload"),
  handler: (_req, _res, next) => {
    next(
      errors.Custom(
        429,
        "TOO_MANY_REQUESTS",
        "Upload rate limit exceeded, please try again later.",
      ),
    );
  },
});
