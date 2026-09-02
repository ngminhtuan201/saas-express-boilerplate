import express from "express";
import { uploader } from "../../libs/upload";
import { uploadLimiter } from "../../middlewares/rate-limit";
import { requireAuth } from "../../middlewares/require-auth";
import { uploadFile } from "./upload.controller";

export const uploadRouter = express.Router();

/**
 * @openapi
 * /api/upload:
 *   post:
 *     tags:
 *       - Upload
 *     summary: Upload a file
 *     description: Uploads a file (image, document, PDF) to the configured storage backend (Local, Cloudflare R2, Cloudinary).
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The file to upload (JPEG, PNG, WebP, GIF, SVG, PDF, DOC, DOCX, TXT, CSV max 10MB)
 *     responses:
 *       200:
 *         description: File uploaded successfully
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
 *                     key:
 *                       type: string
 *                       example: "1725280000000-avatar.png"
 *                     url:
 *                       type: string
 *                       example: "http://localhost:8000/storages/1725280000000-avatar.png"
 *       400:
 *         description: File missing, unsupported format, or invalid file extension
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
 *       413:
 *         description: File size exceeds the allowed limit
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardErrorResponse'
 */
uploadRouter.post(
  "/",
  requireAuth(),
  uploadLimiter,
  uploader.single("file"),
  uploadFile,
);
