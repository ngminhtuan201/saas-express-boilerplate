// Modules
import { connectToMongoDB } from "../dbs/mongodb";
import { initRedis } from "../dbs/redis";
import { logger } from "../libs/logger";

import "./modules/send-email/send-email.processor";

const startWorker = async () => {
  try {
    logger.info("👷 [worker] Starting worker...");

    // MongoDB
    logger.info("📦 [mongodb] Connecting...");
    await connectToMongoDB();
    logger.info("📦 [mongodb] Connection initialized successfully");

    // Redis
    logger.info("📦 [redis] Connecting...");
    initRedis();

    logger.info("🚀 [worker] Worker started successfully");
  } catch (error) {
    logger.error(`❌ [worker] Worker initialization failed\n${error}`);
    process.exit(1);
  }
};

startWorker();
