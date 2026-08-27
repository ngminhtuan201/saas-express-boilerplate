import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { RedisStore } from "connect-redis";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
// import ExpressMongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";
import expressSession from "express-session";
import helmet from "helmet";
import http from "http";
import mongoose from "mongoose";
import passport from "passport";
import path from "path";
import RedisRateLimitStore from "rate-limit-redis";
import winston from "winston";
import { config } from "./config";
import { connectToMongoDB, getRedis, initRedis } from "./dbs";
import { StorageProvider } from "./enums";
import {
  logger,
  morganRequestFailedHandler,
  morganRequestSuccessHandler,
  passportGoogleStrategy,
  passportJWTStrategy,
  passportLocalStrategy,
} from "./libs";
import { handleResponseError } from "./middlewares";
import { contextMiddleware } from "./middlewares/context.middleware";
import { setupSwagger } from "./swagger";

// Worker modules
import { sendEmailQueue } from "./worker/modules/emails/send-email.queue";

// API routes
import { adminRouter } from "./modules/admin/admin.route";
import { authRouter } from "./modules/auth/auth.route";
import { healthRouter } from "./modules/health/health.route";
import { paymentRouter } from "./modules/payments/payment.route";
import { uploadRouter } from "./modules/upload/upload.route";

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
      this.app.use(contextMiddleware);

      // Rate limiting
      const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        standardHeaders: true,
        legacyHeaders: false,
        store: new RedisRateLimitStore({
          sendCommand: (...args: string[]) =>
            getRedis().call(args[0], ...args.slice(1)) as never,
        }),
      });
      this.app.use(limiter);

      // Cors
      const corsOrigins = config.CORS_ORIGINS;
      this.app.use(cors({ origin: corsOrigins, credentials: true }));

      this.app.use(cookieParser());
      this.app.use(
        expressSession({
          store: new RedisStore({ client: getRedis(), prefix: "sess:" }),
          secret: config.COOKIE_SECRET_KEY,
          saveUninitialized: false,
          resave: false,
        }),
      );
      this.app.use(express.urlencoded({ extended: true }));
      this.app.use(
        express.json({
          verify: (req, _res, buf) => {
            req["rawBody"] = buf;
          },
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

      // MongoDB sanitize
      // https://stackoverflow.com/questions/79787302/cannot-set-property-query-of-incomingmessage-which-has-only-a-getter-when-u
      // this.app.use(ExpressMongoSanitize());

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
        done(null, user);
      });

      // Request logger
      this.app.use(morganRequestSuccessHandler);
      this.app.use(morganRequestFailedHandler);

      // API routers
      const apiRoutes: Array<{ prefix: string; router: express.Router }> = [
        {
          prefix: "health",
          router: healthRouter,
        },
        {
          prefix: "auth",
          router: authRouter,
        },
        {
          prefix: "admin",
          router: adminRouter,
        },
        {
          prefix: "payments",
          router: paymentRouter,
        },
        {
          prefix: "upload",
          router: uploadRouter,
        },
      ];

      for (const route of apiRoutes) {
        this.app.use(`/api/${route.prefix}`, route.router);
      }

      // Swagger
      setupSwagger(this.app);

      this.logger.info("🌐 [server] Router initialized successfully");

      // Error handler
      this.app.use(handleResponseError);

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
          (err: Error, user: unknown, _info: unknown) => {
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

      // Server
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
      this.logger.info(`❌ [server] Server initialized failed\n${error}`);
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
