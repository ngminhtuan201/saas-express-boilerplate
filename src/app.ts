import type {} from "./types/express";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { RedisStore } from "connect-redis";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import expressSession from "express-session";
import helmet from "helmet";
import http from "http";
import mongoose from "mongoose";
import passport from "passport";
import path from "path";
import winston from "winston";

import { connectToMongoDB } from "./dbs/mongodb";
import { getRedis, initRedis } from "./dbs/redis";
import { StorageProvider } from "./enums/storage.enum";
import { setupSwagger } from "./libs/api-docs";
import {
  passportGoogleStrategy,
  passportJWTStrategy,
  passportLocalStrategy,
} from "./libs/auth";
import { config } from "./libs/env";
import { logger } from "./libs/logger";
import { logFailedRequest, logSuccessRequest } from "./libs/request";
import { apiLimiter } from "./middlewares/rate-limit";
import { applyRequestContext } from "./middlewares/request-context";
import { handleResponseError } from "./middlewares/response-error";
import { noSqlInjectionSanitizer, xssSanitizer } from "./middlewares/security";

// Worker modules
import { sendEmailQueue } from "./worker/modules/send-email/send-email.queue";

// API routes
import { authRouter } from "./modules/auth/auth.route";
import { healthRouter } from "./modules/health/health.route";
import { paymentRouter } from "./modules/payments/payment.route";
import { uploadRouter } from "./modules/upload/upload.route";
import { userRouter } from "./modules/users/user.route";

class ServerApp {
  private app: express.Application;
  private logger: winston.Logger;
  private server?: http.Server;

  constructor() {
    this.app = express();
    this.logger = logger;
  }

  async config() {
    try {
      // Redis
      this.logger.info("📦 [redis] Connecting...");
      initRedis();
      this.logger.info("📦 [redis] Connection initialized successfully");

      // Security
      this.app.use(helmet());
      this.app.use(applyRequestContext);

      // Cors
      const corsOrigins = config.CORS_ORIGINS;
      this.app.use(cors({ origin: corsOrigins, credentials: true }));

      // Body parsers with rawBody support
      this.app.use(cookieParser());
      this.app.use(express.urlencoded({ extended: true }));
      this.app.use(
        express.json({
          verify: (
            req: express.Request,
            _res: express.Response,
            buf: Buffer,
          ) => {
            req.rawBody = buf;
          },
        }),
      );

      // NoSQL injection & XSS sanitization
      this.app.use(noSqlInjectionSanitizer);
      this.app.use(xssSanitizer);

      // Session
      this.app.use(
        expressSession({
          store: new RedisStore({ client: getRedis(), prefix: "sess:" }),
          secret: config.COOKIE_SECRET_KEY,
          saveUninitialized: false,
          resave: false,
        }),
      );

      // Static files
      if (config.STORAGE_PROVIDER === StorageProvider.LOCAL) {
        this.app.use(
          `/${config.LOCAL_STORAGE_DIR}`,
          express.static(
            path.join(__dirname, `../${config.LOCAL_STORAGE_DIR}`),
          ),
        );
      }

      // MongoDB
      this.logger.info("📦 [mongodb] Connecting...");
      await connectToMongoDB();
      this.logger.info("📦 [mongodb] Connection initialized successfully");

      // Passport
      this.app.use(passport.initialize());
      this.app.use(passport.session());
      passport.use(passportJWTStrategy);
      passport.use(passportGoogleStrategy);
      passport.use("local", passportLocalStrategy);
      passport.serializeUser((user, done) => {
        done(null, user);
      });
      passport.deserializeUser((user, done) => {
        done(null, user as Express.User);
      });

      // Request logger
      this.app.use(logSuccessRequest);
      this.app.use(logFailedRequest);

      // Health endpoint (exempt from API rate limiting)
      this.app.use("/api/health", healthRouter);

      // API routers with rate limiting
      const apiRoutes: Array<{ prefix: string; router: express.Router }> = [
        {
          prefix: "auth",
          router: authRouter,
        },
        {
          prefix: "payments",
          router: paymentRouter,
        },
        {
          prefix: "upload",
          router: uploadRouter,
        },
        {
          prefix: "users",
          router: userRouter,
        },
      ];

      // Apply rate limiting middleware to each API route
      for (const route of apiRoutes) {
        this.app.use(`/api/${route.prefix}`, apiLimiter, route.router);
      }

      // Swagger
      setupSwagger(this.app);

      // Bull board
      this.app.set("views", path.join(__dirname, "../views"));
      this.app.set("view engine", "ejs");

      const serverAdapter = new ExpressAdapter();
      serverAdapter.setBasePath("/admin/queues");

      createBullBoard({
        queues: [new BullMQAdapter(sendEmailQueue)],
        serverAdapter,
      });

      this.app.get("/admin/queues/login", (_req, res) => {
        res.render("admin-queues-login");
      });

      this.app.post("/admin/queues/login", (req, res, next) => {
        passport.authenticate(
          "local",
          (err: Error | null, user: unknown, _info: unknown) => {
            if (err) {
              return next(err);
            }

            if (!user) {
              return res.redirect("/admin/queues/login");
            }

            req.login(user, (err) => {
              if (err) {
                return next(err);
              }

              req.session.save((err) => {
                if (err) {
                  return next(err);
                }

                res.redirect("/admin/queues");
              });
            });
          },
        )(req, res, next);
      });

      this.app.use(
        "/admin/queues",
        (req, res, next) => {
          if (req.isAuthenticated()) {
            return next();
          }
          res.redirect("/admin/queues/login");
        },
        serverAdapter.getRouter(),
      );

      this.logger.info(
        "🌐 [server] Routers and Bull-board initialized successfully",
      );

      // Error handler mounted at the end of all routes
      this.app.use(handleResponseError);

      // Server listen
      const host = config.APP_HOST;
      const port = config.APP_PORT;
      this.server = http.createServer(this.app);
      this.server.listen(port);

      this.logger.info(`⚡️ [server] Server is listening at ${host}:${port}`);
      this.logger.info(
        "🎉 [server] All initialization steps completed successfully",
      );

      this.setupGracefulShutdown();
    } catch (error) {
      this.logger.error(`❌ [server] Server initialization failed\n${error}`);
      process.exit(1);
    }
  }

  private setupGracefulShutdown() {
    const shutdown = async (signal: string) => {
      this.logger.info(
        `\n🛑 [server] ${signal} received. Shutting down gracefully...`,
      );
      if (this.server) {
        this.server.close(async () => {
          this.logger.info("🛑 [server] HTTP server closed.");

          try {
            await sendEmailQueue.close();
            this.logger.info("🛑 [bullmq] Queue connections closed.");
          } catch {
            // ignore
          }

          await mongoose.disconnect();
          this.logger.info("🛑 [mongodb] Connection closed.");

          await getRedis().quit();
          this.logger.info("🛑 [redis] Connection closed.");

          process.exit(0);
        });
      } else {
        process.exit(0);
      }

      setTimeout(() => {
        this.logger.error(
          "🛑 [server] Forcefully shutting down after 10s timeout.",
        );
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    process.on("uncaughtException", (error) => {
      this.logger.error(
        `❌ [server] Uncaught Exception: ${error.message}\n${error.stack}`,
      );
      shutdown("uncaughtException");
    });

    process.on("unhandledRejection", (reason) => {
      this.logger.error(`❌ [server] Unhandled Rejection: ${reason}`);
      shutdown("unhandledRejection");
    });
  }
}

let serverApp: ServerApp | undefined;

export const startServer = async (): Promise<void> => {
  serverApp = new ServerApp();
  await serverApp.config();
};
