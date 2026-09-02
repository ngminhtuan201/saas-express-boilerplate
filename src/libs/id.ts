import mongoose from "mongoose";
import { nanoid } from "nanoid";
import { v4 } from "uuid";

export const objectId = (id?: string): mongoose.Types.ObjectId =>
  new mongoose.Types.ObjectId(id);

export const isValidObjectId = (id: string): boolean =>
  mongoose.Types.ObjectId.isValid(id);

export const documentId = (): string => nanoid();

export const uuidv4 = (): string => v4();
