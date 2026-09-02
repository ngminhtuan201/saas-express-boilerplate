import Joi from "joi";
import { Currency } from "../../../enums/payment.enum";

export type CreatePaymentDto = {
  amount: number;
  currency: Currency;
};

export const createPaymentSchema = Joi.object<CreatePaymentDto>({
  amount: Joi.number().min(0).required(),
  currency: Joi.string()
    .valid(...Object.values(Currency))
    .required(),
});
