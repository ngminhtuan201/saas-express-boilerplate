import { Worker } from "bullmq";
import { config } from "../../../libs/env";
import { logger } from "../../../libs/logger";
import {
  sendResetPasswordEmail,
  sendVerifyAccountEmail,
} from "../../../modules/emails/email.service";
import { ISendEmailJob } from "./send-email.job";
import { SEND_EMAIL_QUEUE_NAME } from "./send-email.queue";

const worker = new Worker<ISendEmailJob>(
  SEND_EMAIL_QUEUE_NAME,
  async (job) => {
    const {
      id: jobId,
      data: { type: emailType, receiver, payload },
    } = job;

    try {
      logger.info(`Processing ${job.name}, job ${jobId}`);

      if (emailType === "verify-account") {
        await sendVerifyAccountEmail(receiver, payload?.url ?? payload?.token);
      } else if (emailType === "reset-password") {
        await sendResetPasswordEmail(receiver, payload?.url ?? payload?.token);
      }

      logger.info(`Processed ${job.name}, job ${jobId}`);
    } catch (error) {
      logger.error(
        `Failed to process ${job.name}, job ${jobId}\nError: ${error}`,
      );

      throw error;
    }
  },
  {
    connection: {
      host: config.REDIS_HOST,
      port: config.REDIS_PORT,
      username: config.REDIS_USERNAME,
      password: config.REDIS_PASSWORD,
    },
    // Add logic to prevent connection if not running as worker?
    // Usually fine, but in server app we don't want to process jobs.
    // The processor file should likely only be imported in worker.ts.
  },
);

export const sendEmailProcessor = worker;
