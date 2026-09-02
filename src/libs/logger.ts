import { createLogger, format, transports } from "winston";
import { getRequestContext } from "./request";

const enumerateErrorFormat = format((info) => {
  if (info instanceof Error) {
    Object.assign(info, {
      message: info.stack,
    });
  }
  return info;
});

const contextFormat = format((info) => {
  const context = getRequestContext();
  if (context) {
    info.requestId = context.requestId;
  }
  return info;
});

const isDev = process.env.NODE_ENV === "development";
const isTest = process.env.NODE_ENV === "test";

export const logger = createLogger({
  level: isDev ? "debug" : "info",
  silent: isTest,
  format: format.combine(
    enumerateErrorFormat(),
    contextFormat(),
    format.timestamp(),
    isDev ? format.colorize() : format.uncolorize(),
    format.splat(),
    isDev
      ? format.printf(
          ({ level, message, timestamp, requestId }) =>
            `${timestamp} ${level}: ${requestId ? `[${requestId}] ` : ""}${message}`,
        )
      : format.json(),
  ),
  transports: [
    new transports.Console({
      stderrLevels: ["error"],
    }),
  ],
});
