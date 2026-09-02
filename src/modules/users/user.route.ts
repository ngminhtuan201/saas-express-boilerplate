import { Router } from "express";
import { UserRole } from "../../enums/user.enum";
import { requireAuth } from "../../middlewares/require-auth";
import { requireRoles } from "../../middlewares/require-roles";
import { getUsers } from "./user.controller";

export const userRouter = Router();

/**
 * @openapi
 * /api/users:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get all users (Admin only)
 *     description: Retrieves the list of all registered users with sanitized profiles. Requires ADMIN role.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
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
 *                     users:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/SafeUser'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardErrorResponse'
 *       403:
 *         description: Forbidden - Admin privileges required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardErrorResponse'
 */
userRouter.get("/", requireAuth(), requireRoles([UserRole.ADMIN]), getUsers);
