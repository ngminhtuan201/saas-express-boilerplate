import { StorageProvider } from "../../enums/storage.enum";
import { config } from "../../libs/env";
import { IStorageAdapter } from "./adapters/interface";

import { CloudinaryStorageAdapter } from "./adapters/cloudinary.adapter";
import { LocalStorageAdapter } from "./adapters/local.adapter";
import { R2StorageAdapter } from "./adapters/r2.adapter";

export class StorageFactory {
  static getAdapter(): IStorageAdapter {
    const storageProvider = config.STORAGE_PROVIDER;

    switch (storageProvider) {
      case StorageProvider.LOCAL:
        return new LocalStorageAdapter();
      case StorageProvider.R2:
        return new R2StorageAdapter();
      case StorageProvider.CLOUDINARY:
        return new CloudinaryStorageAdapter();
      default:
        return new LocalStorageAdapter();
    }
  }
}
