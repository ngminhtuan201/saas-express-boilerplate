import Joi from "joi";

export type UpdateProfileDto = {
  fullName?: string;
};

export const updateProfileSchema = Joi.object<UpdateProfileDto>({
  fullName: Joi.string().optional(),
});
