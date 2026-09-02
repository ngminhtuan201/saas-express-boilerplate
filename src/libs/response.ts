import { Response } from "express";
import httpStatus from "http-status";

export const handleSuccessResponse = (
  res: Response,
  data: unknown,
  statusCode: number = httpStatus.OK,
  message?: string,
) => {
  return res.status(statusCode).json({ success: true, data, message });
};
