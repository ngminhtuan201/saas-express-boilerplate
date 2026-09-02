import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { config } from "../../../libs/env";
import { logger } from "../../../libs/logger";
import { sanitizeFileName } from "../../../libs/upload";
import { IStorageAdapter, UploadFile, UploadFileResult } from "./interface";

export class CloudinaryStorageAdapter implements IStorageAdapter {
  private readonly _folder: string;

  constructor() {
    cloudinary.config({
      cloud_name: config.CLOUDINARY_CLOUD_NAME,
      api_key: config.CLOUDINARY_API_KEY,
      api_secret: config.CLOUDINARY_API_SECRET,
    });
    this._folder = config.CLOUDINARY_FOLDER;

    logger.info("📦 [storage] Cloudinary storage adapter initialized");
  }

  async uploadFile(file: UploadFile): Promise<UploadFileResult> {
    const sanitized = sanitizeFileName(file.file.originalname);
    const publicId = `${this._folder}/${Date.now()}-${sanitized}`;

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: "auto", public_id: publicId },
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error("Cloudinary upload failed"));
          resolve(result);
        },
      );

      stream.end(file.file.buffer);
    });

    return {
      key: result.public_id,
      url: result.secure_url,
    };
  }

  async deleteFile(key: string): Promise<void> {
    await cloudinary.uploader.destroy(key);
  }
}
