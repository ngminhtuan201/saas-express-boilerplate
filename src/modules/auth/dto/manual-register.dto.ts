import Joi from "joi";

export type ManualRegisterDto = {
  fullName: string;
  email: string;
  password: string;
};

export const manualRegisterSchema = Joi.object<ManualRegisterDto>({
  fullName: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});
