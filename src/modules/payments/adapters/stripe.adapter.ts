import Stripe from "stripe";
import {
  PaymentProvider,
  TransactionStatus,
} from "../../../enums/payment.enum";
import { config } from "../../../libs/env";
import { errors } from "../../../libs/errors";
import { logger } from "../../../libs/logger";
import { TransactionModel } from "../../../models/Transaction";
import { CreatePaymentDto } from "../dto/create-payment.dto";
import { IPaymentAdapter, PaymentSession } from "./interface";

export class StripePaymentAdapter implements IPaymentAdapter {
  private readonly _stripe: Stripe;

  constructor() {
    this._stripe = new Stripe(config.STRIPE_SECRET_KEY || "");
  }

  async createPaymentSession(
    transactionId: string,
    dto: CreatePaymentDto,
  ): Promise<PaymentSession> {
    const paymentIntent = await this._stripe.paymentIntents.create({
      amount: Math.round(dto.amount * 100), // Stripe expects amount in cents
      currency: dto.currency,
      metadata: {
        transactionId: transactionId,
      },
    });

    return {
      provider: PaymentProvider.STRIPE,
      providerRefId: paymentIntent.id,
      raw: paymentIntent,
    };
  }

  async handleWebhook(
    payload: string | Buffer | unknown,
    headers: Record<string, string | string[] | undefined>,
  ): Promise<{ received: boolean }> {
    const stripeSignature = headers["stripe-signature"] as string;
    if (!stripeSignature || !config.STRIPE_WEBHOOK_SECRET) {
      throw errors.Custom(
        400,
        "INVALID_WEBHOOK_SIGNATURE",
        "Missing Stripe signature or webhook secret",
      );
    }

    let event: Stripe.Event;
    try {
      event = this._stripe.webhooks.constructEvent(
        payload as string | Buffer,
        stripeSignature,
        config.STRIPE_WEBHOOK_SECRET,
      );
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error(
        `❌ [stripe-webhook] Signature verification failed: ${errorMessage}`,
      );
      throw errors.Custom(
        400,
        "INVALID_WEBHOOK_SIGNATURE",
        `Webhook signature verification failed: ${errorMessage}`,
      );
    }

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const transactionId = paymentIntent.metadata?.transactionId;
      if (transactionId) {
        await TransactionModel.findOneAndUpdate(
          { id: transactionId },
          {
            $set: {
              status: TransactionStatus.SUCCESS,
              providerRefId: paymentIntent.id,
            },
          },
          { new: true },
        );
      }
    } else if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const transactionId = paymentIntent.metadata?.transactionId;
      if (transactionId) {
        await TransactionModel.findOneAndUpdate(
          { id: transactionId },
          {
            $set: {
              status: TransactionStatus.FAILED,
              providerRefId: paymentIntent.id,
            },
          },
          { new: true },
        );
      }
    }
    return { received: true };
  }
}
