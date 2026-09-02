import { Queue } from "bullmq";
import { config } from "../../../libs/env";
import { ISendEmailJob } from "./send-email.job";

export const SEND_EMAIL_QUEUE_NAME = "send-email-queue";

export const sendEmailQueue = new Queue(SEND_EMAIL_QUEUE_NAME, {
  connection: {
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
    username: config.REDIS_USERNAME,
    password: config.REDIS_PASSWORD,
  },
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

export const addSendEmailJob = (job: ISendEmailJob) => {
  sendEmailQueue.add(job.type, job);
};
