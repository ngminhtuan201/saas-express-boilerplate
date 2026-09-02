import fs from "fs/promises";
import path from "path";
import { config } from "../../../libs/env";
import { logger } from "../../../libs/logger";
import { sanitizeFileName } from "../../../libs/upload";
import { IStorageAdapter, UploadFile, UploadFileResult } from "./interface";

export class LocalStorageAdapter implements IStorageAdapter {
  private readonly _rootDir = config.LOCAL_STORAGE_DIR;

  constructor() {
    logger.info("📦 [storage] Local storage adapter initialized");
  }

  async uploadFile(file: UploadFile): Promise<UploadFileResult> {
    const sanitized = sanitizeFileName(file.file.originalname);
    const key = `${Date.now()}-${sanitized}`;
    const filePath = path.join(this._rootDir, key);

    await fs.writeFile(filePath, file.file.buffer);

    return {
      key,
      url: `/${this._rootDir}/${key}`,
    };
  }

  async deleteFile(key: string): Promise<void> {
    await fs.unlink(path.join(this._rootDir, key));
  }
}
