import mongoose, { Document, Schema, Model } from "mongoose";
import { ILike } from "./Like";

export interface IFile extends Document {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  size: number;
  hash: string;
  thumbnail: string;
  uploadDate?: Date;
  likes: ILike['_id'][];
}

const FileSchema: Schema = new Schema<IFile>({
  fieldname: { type: String, required: true },
  originalname: { type: String, required: true },
  encoding: { type: String, required: true },
  mimetype: { type: String, required: true },
  destination: { type: String, required: true },
  filename: { type: String, required: true },
  path: { type: String, required: true },
  size: { type: Number, required: true },
  hash: { type: String, required: true },
  thumbnail: { type: String, required: false },
  uploadDate: {
    type: Date,
    default: Date.now,
    index: { expireAfterSeconds: 60 * 60 * 24 * 7 }
  },
  likes: [{ type: Schema.Types.ObjectId, ref: 'Like' }]
});


const File: Model<IFile> = mongoose.model<IFile>('File', FileSchema);
export default File;
