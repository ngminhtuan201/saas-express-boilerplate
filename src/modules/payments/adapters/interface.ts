import { PaymentProvider } from "../../../enums/payment.enum";
import { CreatePaymentDto } from "../dto/create-payment.dto";

export interface PaymentSession {
  provider: PaymentProvider;
  providerRefId: string;
  checkoutUrl?: string;
  /**
   * Raw payment response from provider.
   */
  raw?: unknown;
}

export interface IPaymentAdapter {
  createPaymentSession(
    transactionId: string,
    dto: CreatePaymentDto,
  ): Promise<PaymentSession>;

  handleWebhook(
    payload: unknown,
    headers: Record<string, string | string[] | undefined>,
  ): Promise<{ received: boolean }>;
}
