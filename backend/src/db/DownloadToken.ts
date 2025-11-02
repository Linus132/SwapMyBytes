import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IDownloadToken extends Document {
  fileId: string;
  token: string;
  used: boolean;
  expiresAt: number;
}

const DownloadTokenSchema: Schema<IDownloadToken> = new Schema<IDownloadToken>({
  fileId: {type: String, required: true},
  token: { type: String, required: true, unique: true },
  used: { type: Boolean, default: false }, 
  expiresAt: { type: Number}
});

const DownloadToken: Model<IDownloadToken> = mongoose.model<IDownloadToken>('DownloadToken', DownloadTokenSchema);

export default DownloadToken;
