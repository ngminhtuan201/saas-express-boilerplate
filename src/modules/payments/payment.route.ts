import express from "express";
import { requireAuth } from "../../middlewares/require-auth";
import { validateRequest } from "../../middlewares/validate-request";
import { createPaymentSchema } from "./dto/create-payment.dto";
import { checkout, handleWebhook } from "./payment.controller";

export const paymentRouter = express.Router();

/**
 * @openapi
 * /api/payments/checkout/{provider}:
 *   post:
 *     tags:
 *       - Payments
 *     summary: Create a Checkout / Payment Session
 *     description: Initializes a payment session with the specified payment provider (e.g. stripe).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *           enum: [stripe]
 *         description: Payment provider name
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - currency
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 1
 *                 example: 2000
 *                 description: Payment amount in smallest currency unit or standard unit
 *               currency:
 *                 type: string
 *                 enum: [USD, VND, EUR]
 *                 example: USD
 *     responses:
 *       200:
 *         description: Payment session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     session:
 *                       type: object
 *                       properties:
 *                         clientSecret:
 *                           type: string
 *                           example: "pi_3MtwBwLkdIwHu7ix28a3tqPa_secret_..."
 *                         transactionId:
 *                           type: string
 *                           example: "pi_3MtwBwLkdIwHu7ix28a3tqPa"
 *       400:
 *         description: Validation failed or provider error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardErrorResponse'
 */
paymentRouter.post(
  "/checkout/:provider",
  requireAuth(),
  validateRequest({ body: createPaymentSchema }),
  checkout,
);

/**
 * @openapi
 * /api/payments/webhook/{provider}:
 *   post:
 *     tags:
 *       - Payments
 *     summary: Payment Webhook Handler
 *     description: Receives and cryptographically verifies webhook notifications from payment gateways (e.g. Stripe signature check).
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *           enum: [stripe]
 *         description: Payment provider name
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     received:
 *                       type: boolean
 *                       example: true
 *       400:
 *         description: Invalid webhook signature or payload
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardErrorResponse'
 */
paymentRouter.post("/webhook/:provider", handleWebhook);
