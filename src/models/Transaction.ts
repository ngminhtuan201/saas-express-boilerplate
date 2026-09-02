import mongoose from "mongoose";
import {
  Currency,
  PaymentMethod,
  PaymentProvider,
  TransactionStatus,
  TransactionType,
} from "../enums/payment.enum";
import { BaseModel } from "./Base";

export interface Transaction extends BaseModel {
  userId: string;
  type: TransactionType;
  description?: string;
  amount: number;
  currency: Currency;
  status: TransactionStatus;
  provider?: PaymentProvider;
  providerRefId?: string;
  metadata?: Record<string, unknown>;
  paymentMethod?: PaymentMethod;
}

const transactionSchema = new mongoose.Schema<Transaction>(
  {
    id: {
      type: String,
      unique: true,
    },
    userId: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: TransactionType,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      enum: Currency,
      required: true,
    },
    status: {
      type: String,
      enum: TransactionStatus,
      required: true,
    },
    provider: {
      type: String,
      enum: PaymentProvider,
    },
    providerRefId: {
      type: String,
      unique: true,
      sparse: true,
    },
    metadata: {
      type: Map,
      of: Object,
    },
    paymentMethod: {
      type: String,
      enum: PaymentMethod,
    },
  },
  { timestamps: true },
);

export const TransactionModel = mongoose.model<Transaction>(
  "Transaction",
  transactionSchema,
);
