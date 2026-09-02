import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { config } from "../../../libs/env";
import { logger } from "../../../libs/logger";
import { sanitizeFileName } from "../../../libs/upload";
import { IStorageAdapter, UploadFile, UploadFileResult } from "./interface";

export class R2StorageAdapter implements IStorageAdapter {
  private readonly _client: S3Client;
  private readonly _bucket: string;

  constructor() {
    this._client = new S3Client({
      region: "auto",
      endpoint: `https://${config.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.R2_ACCESS_KEY_ID || "",
        secretAccessKey: config.R2_SECRET_ACCESS_KEY || "",
      },
    });
    this._bucket = config.R2_BUCKET || "";

    logger.info("📦 [storage] Cloudflare R2 storage adapter initialized");
  }

  async uploadFile(file: UploadFile): Promise<UploadFileResult> {
    const sanitized = sanitizeFileName(file.file.originalname);
    const key = `${Date.now()}-${sanitized}`;

    await this._client.send(
      new PutObjectCommand({
        Bucket: this._bucket,
        Key: key,
        Body: file.file.buffer,
        ContentType: file.file.mimetype,
      }),
    );

    return {
      key,
      url: config.R2_PUBLIC_BASE_URL
        ? `${config.R2_PUBLIC_BASE_URL}/${key}`
        : `https://${this._bucket}.${config.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`,
    };
  }

  async deleteFile(key: string): Promise<void> {
    await this._client.send(
      new DeleteObjectCommand({
        Bucket: this._bucket,
        Key: key,
      }),
    );
  }
}
