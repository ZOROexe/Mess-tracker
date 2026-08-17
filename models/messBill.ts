import mongoose, { Model, Schema } from "mongoose";
import { MessBillStatus } from "@/types/billing";

export interface IMessBill {
  _id?: mongoose.Types.ObjectId;
  userId: string;
  messId: mongoose.Types.ObjectId;
  periodStart: string;
  periodEnd: string;
  calculatedAmount: number;
  paidAmount: number;
  status: MessBillStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

const MessBillSchema = new Schema<IMessBill>({
  userId: { type: String, required: true, index: true },
  messId: { type: Schema.Types.ObjectId, ref: "Mess", required: true, index: true },
  periodStart: { type: String, required: true },
  periodEnd: { type: String, required: true },
  calculatedAmount: { type: Number, required: true, min: 0 },
  paidAmount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ["unpaid", "partially_paid", "paid"], required: true },
}, { timestamps: true });

MessBillSchema.index({ userId: 1, messId: 1, periodStart: 1, periodEnd: 1 }, { unique: true });

const MessBillModel: Model<IMessBill> = mongoose.models.MessBill
  || mongoose.model<IMessBill>("MessBill", MessBillSchema);

export default MessBillModel;
