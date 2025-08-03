import mongoose, { Document, Schema } from "mongoose";

export interface IInvitation extends Document {
  invitationId: string;
  from: string;
  to: string;
  roomId: string;
  message?: string;
  status: string;
  createdAt: Date;
}

const InvitationSchema = new Schema<IInvitation>({
  invitationId: { type: String, required: true, unique: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  roomId: { type: String, required: true },
  message: { type: String },
  status: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IInvitation>("Invitation", InvitationSchema);
