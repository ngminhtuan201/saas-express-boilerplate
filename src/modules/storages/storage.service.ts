import { IStorageAdapter, UploadFile } from "./adapters/interface";
import { StorageFactory } from "./storage.helper";

const storageAdapter: IStorageAdapter = StorageFactory.getAdapter();

export const uploadFile = async (file: UploadFile) => {
  return storageAdapter.uploadFile(file);
};
