import { Request, Response } from "express";
import { catchAsync, handleSuccess } from "../../libs";
import { UserModel } from "../../models";

export const getUsers = catchAsync(async (_req: Request, res: Response) => {
  const users = await UserModel.find().lean().exec();
  return handleSuccess(res, { users });
});
