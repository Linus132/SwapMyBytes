import mongoose, { Document, Schema, Model } from "mongoose";
import { IUser } from "./User"; 

export interface ILike extends Document {
  likeDate: Date;
  user: IUser["_id"];
}

const LikeSchema:Schema = new Schema<ILike>({
    likeDate: { type: Date, default: Date.now },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: false },
});


const Like: Model<ILike> = mongoose.model<ILike>('Like',LikeSchema);
export default Like;
