import { Request, Response } from "express";
import { PaymentProvider } from "../../enums/payment.enum";
import { errors } from "../../libs/errors";
import { catchAsync, getCurrentUser } from "../../libs/request";
import { handleSuccessResponse } from "../../libs/response";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import * as paymentService from "./payment.service";

export const checkout = catchAsync(async (req: Request, res: Response) => {
  const user = getCurrentUser(req);
  if (!user) {
    throw errors.Unauthorized;
  }

  const provider = req.params.provider as PaymentProvider;
  const session = await paymentService.createPaymentSession(
    user.id,
    provider,
    req.body as CreatePaymentDto,
  );

  return handleSuccessResponse(res, { session });
});

export const handleWebhook = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.handleWebhook(
    req.params.provider as PaymentProvider,
    req.rawBody || req.body,
    req.headers,
  );

  return handleSuccessResponse(res, result);
});
