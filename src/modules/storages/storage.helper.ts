import { config } from "../../config";
import { StorageProvider } from "../../enums";
import { LocalStorageAdapter, R2StorageAdapter } from "./adapters";
import { IStorageAdapter } from "./adapters/interface";

export class StorageFactory {
  static getAdapter(): IStorageAdapter {
    const storageProvider = config.STORAGE_PROVIDER;

    switch (storageProvider) {
      case StorageProvider.LOCAL:
        return new LocalStorageAdapter();
      case StorageProvider.R2:
        return new R2StorageAdapter();
      default:
        return new LocalStorageAdapter();
    }
  }
}
