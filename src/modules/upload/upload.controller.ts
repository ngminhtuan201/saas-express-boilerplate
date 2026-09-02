import { Request, Response } from "express";
import { errors } from "../../libs/errors";
import { catchAsync } from "../../libs/request";
import { handleSuccessResponse } from "../../libs/response";
import * as uploadService from "./upload.service";

export const uploadFile = catchAsync(async (req: Request, res: Response) => {
  const file = req.file;

  if (!file) {
    throw errors.FileMissing;
  }

  const result = await uploadService.uploadFile({ file });
  return handleSuccessResponse(res, { ...result });
});
