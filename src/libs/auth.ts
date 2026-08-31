import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import mongoose from "mongoose";
import { config } from "../config";
import { addSendEmailJob } from "../worker/modules/emails/send-email.queue";

const createAuth = () => {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("MongoDB connection not established before auth init");
  }

  return betterAuth({
    appName: config.APP_NAME,
    secret: config.BETTER_AUTH_SECRET,
    baseURL: config.BETTER_AUTH_BASE_URL,
    trustedOrigins: [config.BETTER_AUTH_BASE_URL, ...config.CORS_ORIGINS],

    database: mongodbAdapter(db, {
      client: mongoose.connection.getClient(),
      transaction: false,
    }),

    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 64,
      requireEmailVerification: true,
      sendResetPassword: async ({ user, url, token }) => {
        addSendEmailJob({
          type: "reset-password",
          receiver: user.email,
          payload: { token, url },
        });
      },
    },

    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url, token }) => {
        addSendEmailJob({
          type: "verify",
          receiver: user.email,
          payload: { token, url },
        });
      },
    },

    socialProviders: {
      google: {
        clientId: config.GOOGLE_OAUTH_CLIENT_ID,
        clientSecret: config.GOOGLE_OAUTH_CLIENT_SECRET,
      },
    },

    rateLimit: {
      enabled: true,
      window: 60,
      max: 100,
    },
  });
};

type AuthInstance = ReturnType<typeof createAuth>;

let authInstance: AuthInstance | undefined;

export const getAuth = (): AuthInstance => {
  if (!authInstance) {
    authInstance = createAuth();
  }

  return authInstance;
};
