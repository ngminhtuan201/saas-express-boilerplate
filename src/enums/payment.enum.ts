export enum PaymentProvider {
  STRIPE = "stripe",
}

export enum PaymentMethod {
  CREDIT_CARD = "credit_card",
}

export enum TransactionStatus {
  PENDING = "pending",
  SUCCESS = "success",
  FAILED = "failed",
  CANCELED = "canceled",
}

export enum TransactionType {
  PURCHASE = "purchase",
}

export enum Currency {
  USD = "usd",
}
