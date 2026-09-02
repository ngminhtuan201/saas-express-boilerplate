import Joi from "joi";

export type ManualLoginDto = {
  email: string;
  password: string;
};

export const manualLoginSchema = Joi.object<ManualLoginDto>({
  email: Joi.string().email().required().trim().lowercase(),
  password: Joi.string().required(),
});
