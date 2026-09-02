import express from "express";
import passport from "passport";
import { authLimiter } from "../../middlewares/rate-limit";
import { requireAuth } from "../../middlewares/require-auth";
import { validateRequest } from "../../middlewares/validate-request";
import {
  getMe,
  handleGoogleCallback,
  logout,
  manualLogin,
  manualRegister,
  refreshToken,
  updateProfile,
  verifyEmail,
} from "./auth.controller";
import { manualLoginSchema } from "./dto/manual-login.dto";
import { manualRegisterSchema } from "./dto/manual-register.dto";
import { updateProfileSchema } from "./dto/update-profile.dto";

export const authRouter = express.Router();

/**
 * @openapi
 * /api/auth/login/google:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Initiate Google OAuth2 login
 *     description: Redirects the client to Google OAuth2 consent screen.
 *     responses:
 *       302:
 *         description: Redirect to Google consent screen
 */
authRouter.get(
  "/login/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

/**
 * @openapi
 * /api/auth/google/callback:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Google OAuth2 Callback
 *     description: Handles the callback from Google OAuth2 and sets authentication cookies.
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccessResponse'
 */
authRouter.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  handleGoogleCallback,
);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Login with Email and Password
 *     description: Authenticates user credentials and returns access/refresh tokens.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "User@123456"
 *     responses:
 *       200:
 *         description: Login successful
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
 *                     user:
 *                       $ref: '#/components/schemas/SafeUser'
 *                     accessToken:
 *                       $ref: '#/components/schemas/AuthToken'
 *                     refreshToken:
 *                       $ref: '#/components/schemas/AuthToken'
 *       400:
 *         description: Validation error or invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardErrorResponse'
 */
authRouter.post(
  "/login",
  authLimiter,
  validateRequest({ body: manualLoginSchema }),
  manualLogin,
);

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Register a new user account
 *     description: Creates a new user record and dispatches an email verification job.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - fullName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: newuser@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "StrongPass@123"
 *               fullName:
 *                 type: string
 *                 example: "Jane Doe"
 *     responses:
 *       200:
 *         description: Registration successful, verification email sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "User registered successfully, please check your email for verification"
 *       400:
 *         description: Validation error or email already in use
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardErrorResponse'
 */
authRouter.post(
  "/register",
  authLimiter,
  validateRequest({ body: manualRegisterSchema }),
  manualRegister,
);

/**
 * @openapi
 * /api/auth/verify:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Verify email address
 *     description: Verifies user email via the token sent to user email.
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Email verification token
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccessResponse'
 *       400:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardErrorResponse'
 */
authRouter.get("/verify", authLimiter, verifyEmail);

/**
 * @openapi
 * /api/auth/refresh-token:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Refresh Access Token
 *     description: Generates a new Access Token using a valid Refresh Token from cookie or request body.
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: "eyJhbGciOiJIUzI1NiIsIn..."
 *     responses:
 *       200:
 *         description: Token refreshed successfully
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
 *                     accessToken:
 *                       $ref: '#/components/schemas/AuthToken'
 *                     refreshToken:
 *                       $ref: '#/components/schemas/AuthToken'
 *       401:
 *         description: Refresh token invalid or revoked
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardErrorResponse'
 */
authRouter.post("/refresh-token", authLimiter, refreshToken);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Get Current Authenticated User Profile
 *     description: Returns the sanitized user profile for the bearer token owner.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved
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
 *                     user:
 *                       $ref: '#/components/schemas/SafeUser'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardErrorResponse'
 */
authRouter.get("/me", requireAuth(), getMe);

/**
 * @openapi
 * /api/auth/me:
 *   put:
 *     tags:
 *       - Auth
 *     summary: Update Current User Profile
 *     description: Updates editable profile fields for the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: "Jane Smith"
 *               avatarUrl:
 *                 type: string
 *                 example: "https://example.com/new-avatar.png"
 *     responses:
 *       200:
 *         description: Profile updated successfully
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
 *                     user:
 *                       $ref: '#/components/schemas/SafeUser'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardErrorResponse'
 */
authRouter.put(
  "/me",
  requireAuth(),
  validateRequest({ body: updateProfileSchema }),
  updateProfile,
);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Logout user
 *     description: Clears authentication session cookie and revokes session record in MongoDB.
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccessResponse'
 */
authRouter.post("/logout", logout);
