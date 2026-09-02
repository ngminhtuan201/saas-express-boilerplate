import { Request, Response } from "express";
import { catchAsync } from "../../libs/request";
import { handleSuccessResponse } from "../../libs/response";
import { sanitizeUser } from "./user.helper";
import { User, UserModel } from "../../models/User";

export const getUsers = catchAsync(async (_req: Request, res: Response) => {
  const users = await UserModel.find().lean().exec();
  const sanitizedUsers = (users as User[]).map(sanitizeUser);
  return handleSuccessResponse(res, { users: sanitizedUsers });
});
