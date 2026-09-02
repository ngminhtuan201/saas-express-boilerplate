import * as storageService from "../../modules/storages/storage.service";
import { UploadFile } from "../storages/adapters/interface";

export const uploadFile = async (file: UploadFile) => {
  return await storageService.uploadFile(file);
};
