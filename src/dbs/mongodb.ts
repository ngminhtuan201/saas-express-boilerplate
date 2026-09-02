import mongoose from "mongoose";
import { config } from "../libs/env";
import { logger } from "../libs/logger";

export const connectToMongoDB = async (): Promise<void> => {
  try {
    await mongoose.connect(config.MONGODB_URI, {
      connectTimeoutMS: 5000,
    });
  } catch (error) {
    logger.error(`❌ Connect to mongodb failed\n${error}`);
    process.exit(1);
  }
};
