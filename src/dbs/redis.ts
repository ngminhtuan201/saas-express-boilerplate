import IORedis from "ioredis";
import { config } from "../libs/env";
import { logger } from "../libs/logger";

let redis: IORedis | null = null;

export const initRedis = (): IORedis => {
  if (redis) {
    return redis;
  }

  redis = new IORedis({
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
    username: config.REDIS_USERNAME,
    password: config.REDIS_PASSWORD,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });

  redis.on("connect", () => {
    logger.info("📦 [redis] Connected successfully");
  });

  redis.on("error", (error) => {
    logger.error(`❌ [redis] Connection failed\n${error}`);
  });

  return redis;
};

export const getRedis = (): IORedis => {
  if (!redis) {
    return initRedis();
  }
  return redis;
};
