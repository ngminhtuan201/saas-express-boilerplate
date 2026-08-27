import dotenv from "dotenv";
dotenv.config();

const requireValue = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }

  return value;
};

export const config = {
  // App
  APP_NAME: process.env.APP_NAME || "express-boilerplate",
  APP_HOST: process.env.APP_HOST || "http://localhost",
  APP_PORT: +process.env.APP_PORT || 8000,

  // Web client
  WEB_CLIENT_URL: process.env.WEB_CLIENT_URL || "http://localhost:3000",

  // Cors
  CORS_ORIGINS: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",")
    : ["http://localhost:3000"],

  // Verification
  VERIFICATION_TOKEN_EXPIRY_MINUTES: +process.env.VERIFICATION_TOKEN_EXPIRY_MINUTES || 30, // prettier-ignore

  // Database
  // prettier-ignore
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/express-boilerplate",

  // Google OAuth
  GOOGLE_OAUTH_CLIENT_ID: requireValue("GOOGLE_OAUTH_CLIENT_ID"),
  GOOGLE_OAUTH_CLIENT_SECRET: requireValue("GOOGLE_OAUTH_CLIENT_SECRET"),
  GOOGLE_OAUTH_REDIRECT_URL: requireValue("GOOGLE_OAUTH_REDIRECT_URL"),

  // JWT
  JWT_ACCESS_TOKEN_SECRET: requireValue("JWT_ACCESS_TOKEN_SECRET"),
  JWT_ACCESS_TOKEN_EXPIRY_MINUTES: +(process.env.JWT_ACCESS_TOKEN_EXPIRY_MINUTES || 15), // prettier-ignore
  JWT_REFRESH_TOKEN_SECRET: requireValue("JWT_REFRESH_TOKEN_SECRET"),
  JWT_REFRESH_TOKEN_EXPIRY_MINUTES: +process.env.JWT_REFRESH_TOKEN_EXPIRY_MINUTES || 24 * 60 * 30, // prettier-ignore

  // Cookies
  COOKIE_SECRET_KEY: requireValue("COOKIE_SECRET_KEY"),
  COOKIE_AUTH: requireValue("COOKIE_AUTH"),

  // Resend
  RESEND_API_KEY: requireValue("RESEND_API_KEY"),
  RESEND_EMAIL_FROM: process.env.RESEND_EMAIL_FROM || "onboarding@resend.dev",

  // Payment
  PAYMENT_PROVIDER: process.env.PAYMENT_PROVIDER || "stripe",

  // Stripe
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,

  // Storage
  STORAGE_PROVIDER: process.env.STORAGE_PROVIDER || "local",

  // Local storage
  LOCAL_STORAGE_DIR: process.env.LOCAL_STORAGE_DIR || "storages",

  // Cloudflare R2
  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
  R2_BUCKET: process.env.R2_BUCKET,
  R2_PUBLIC_BASE_URL: process.env.R2_PUBLIC_BASE_URL,

  // Upload
  UPLOAD_SIZE_LIMIT: +process.env.UPLOAD_SIZE_LIMIT || 1024 * 1024 * 10,

  // Redis
  REDIS_HOST: process.env.REDIS_HOST || "localhost",
  REDIS_PORT: +process.env.REDIS_PORT || 6379,
  REDIS_USERNAME: process.env.REDIS_USERNAME,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,

  // Bull board
  BULL_BOARD_USERNAME: process.env.BULL_BOARD_USERNAME || "admin",
  BULL_BOARD_PASSWORD: process.env.BULL_BOARD_PASSWORD || "admin",
};
