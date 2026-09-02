import dotenv from "dotenv";
dotenv.config();

const parseNumber = (val: string | undefined, defaultVal: number): number => {
  if (!val) return defaultVal;
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? defaultVal : parsed;
};

export const config = {
  // App
  NODE_ENV: process.env.NODE_ENV || "development",
  APP_NAME: process.env.APP_NAME || "express-boilerplate",
  APP_HOST: process.env.APP_HOST || "http://localhost",
  APP_PORT: parseNumber(process.env.APP_PORT, 8000),

  // Web client
  WEB_CLIENT_URL: process.env.WEB_CLIENT_URL || "http://localhost:3000",

  // Cors
  CORS_ORIGINS: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",")
    : ["http://localhost:3000"],

  // Verification
  VERIFICATION_TOKEN_EXPIRY_MINUTES: parseNumber(
    process.env.VERIFICATION_TOKEN_EXPIRY_MINUTES,
    30,
  ),

  // Database
  MONGODB_URI:
    process.env.MONGODB_URI || "mongodb://localhost:27017/express-boilerplate",

  // Google OAuth
  GOOGLE_OAUTH_CLIENT_ID: process.env.GOOGLE_OAUTH_CLIENT_ID || "",
  GOOGLE_OAUTH_CLIENT_SECRET: process.env.GOOGLE_OAUTH_CLIENT_SECRET || "",
  GOOGLE_OAUTH_REDIRECT_URL: process.env.GOOGLE_OAUTH_REDIRECT_URL || "",

  // JWT
  JWT_ACCESS_TOKEN_SECRET:
    process.env.JWT_ACCESS_TOKEN_SECRET || "default_jwt_access_secret",
  JWT_ACCESS_TOKEN_EXPIRY_MINUTES: parseNumber(
    process.env.JWT_ACCESS_TOKEN_EXPIRY_MINUTES,
    15,
  ),
  JWT_REFRESH_TOKEN_SECRET:
    process.env.JWT_REFRESH_TOKEN_SECRET || "default_jwt_refresh_secret",
  JWT_REFRESH_TOKEN_EXPIRY_MINUTES: parseNumber(
    process.env.JWT_REFRESH_TOKEN_EXPIRY_MINUTES,
    24 * 60 * 30,
  ),

  // Cookies
  COOKIE_SECRET_KEY: process.env.COOKIE_SECRET_KEY || "default_cookie_secret",
  COOKIE_AUTH: process.env.COOKIE_AUTH || "cookie_auth",

  // Resend
  RESEND_API_KEY: process.env.RESEND_API_KEY || "",
  RESEND_EMAIL_FROM: process.env.RESEND_EMAIL_FROM || "onboarding@resend.dev",

  // Payment
  PAYMENT_PROVIDER: process.env.PAYMENT_PROVIDER || "stripe",

  // Stripe
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || "",
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || "",

  // Storage
  STORAGE_PROVIDER: process.env.STORAGE_PROVIDER || "local",

  // Local storage
  LOCAL_STORAGE_DIR: process.env.LOCAL_STORAGE_DIR || "storages",

  // Cloudflare R2
  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID || "",
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID || "",
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY || "",
  R2_BUCKET: process.env.R2_BUCKET || "",
  R2_PUBLIC_BASE_URL: process.env.R2_PUBLIC_BASE_URL || "",

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "",
  CLOUDINARY_FOLDER: process.env.CLOUDINARY_FOLDER || "uploads",

  // Upload
  UPLOAD_SIZE_LIMIT: parseNumber(
    process.env.UPLOAD_SIZE_LIMIT,
    1024 * 1024 * 10,
  ),

  // Redis
  REDIS_HOST: process.env.REDIS_HOST || "localhost",
  REDIS_PORT: parseNumber(process.env.REDIS_PORT, 6379),
  REDIS_USERNAME: process.env.REDIS_USERNAME,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,

  // Bull board
  BULL_BOARD_USERNAME: process.env.BULL_BOARD_USERNAME || "admin",
  BULL_BOARD_PASSWORD: process.env.BULL_BOARD_PASSWORD || "admin",
};
