import mongoose, { Document, Model, ObjectId } from 'mongoose';
import bcrypt from 'bcrypt';
import { IFile } from './File';
const { Schema, model } = mongoose;


export interface IUser extends Document {
  _id: ObjectId;
  username: string;
  email: string;
  password: string;
  files: IFile['_id'][];
  fileUploaded: boolean;
  isGoogleUser: boolean;
}

const userSchema = new Schema<IUser>({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true, minlength: 5, lowercase: true },
  password: { type: String, required: true },
  files: [{ type: Schema.Types.ObjectId, ref: 'File', required: false }],
  fileUploaded: {type: Boolean, default: false},
  isGoogleUser: { type: Boolean, default: false },
});

userSchema.pre('save', async function (this: IUser) {
	if (this.isModified('password')) {
		const salt = await bcrypt.genSalt(10);
		const hash = await bcrypt.hash(this.password, salt);
		this.password = hash;
	}
});

const User: Model<IUser> = model<IUser>('User', userSchema);

export default User;

