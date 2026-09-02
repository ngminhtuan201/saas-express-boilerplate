import multer from "multer";
import path from "path";
import { config } from "./env";
import { errors } from "./errors";

export const ALLOWED_MIME_TYPES = [
  // Images
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/csv",
];

export const ALLOWED_FILE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".svg",
  ".pdf",
  ".doc",
  ".docx",
  ".txt",
  ".csv",
];

/**
 * Sanitize filename to prevent directory traversal or dangerous characters
 */
export const sanitizeFileName = (originalName: string): string => {
  const ext = path.extname(originalName).toLowerCase();
  const baseName = path
    .basename(originalName, ext)
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .substring(0, 100);

  return `${baseName || "file"}${ext}`;
};

export const uploader = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.UPLOAD_SIZE_LIMIT,
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (
      !ALLOWED_MIME_TYPES.includes(file.mimetype) ||
      !ALLOWED_FILE_EXTENSIONS.includes(ext)
    ) {
      return cb(
        errors.Custom(
          400,
          "INVALID_FILE_TYPE",
          `File type '${file.mimetype}' is not supported. Allowed types: ${ALLOWED_FILE_EXTENSIONS.join(", ")}`,
        ) as unknown as null,
        false,
      );
    }

    cb(null, true);
  },
});
