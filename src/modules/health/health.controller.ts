import { Request, Response } from "express";
import mongoose from "mongoose";
import { getRedis } from "../../dbs/redis";

export const getHealth = async (_req: Request, res: Response) => {
  try {
    const isMongoConnected = mongoose.connection.readyState === 1;
    let isRedisConnected = false;
    try {
      await getRedis().ping();
      isRedisConnected = true;
    } catch {
      // redis error
    }

    if (!isMongoConnected || !isRedisConnected) {
      return res.status(503).json({
        success: false,
        message: "Service Unavailable",
        data: {
          mongo: isMongoConnected ? "OK" : "ERROR",
          redis: isRedisConnected ? "OK" : "ERROR",
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Server is healthy",
      data: {
        mongo: "OK",
        redis: "OK",
      },
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
