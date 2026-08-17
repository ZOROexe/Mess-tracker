import mongoose, { Model, Schema } from "mongoose";

export interface IMessPayment {
  _id?: mongoose.Types.ObjectId;
  userId: string;
  messId: mongoose.Types.ObjectId;
  amount: number;
  paymentDate: string;
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const MessPaymentSchema = new Schema<IMessPayment>({
  userId: { type: String, required: true, index: true },
  messId: { type: Schema.Types.ObjectId, ref: "Mess", required: true, index: true },
  amount: { type: Number, required: true, min: 0.01 },
  paymentDate: { type: String, required: true },
  billingPeriodStart: { type: String, required: false },
  billingPeriodEnd: { type: String, required: false },
  notes: { type: String, trim: true, maxlength: 1000 },
}, { timestamps: true });

MessPaymentSchema.index({ userId: 1, messId: 1, paymentDate: -1 });
MessPaymentSchema.index({ userId: 1, messId: 1, billingPeriodStart: 1, billingPeriodEnd: 1 });

const MessPaymentModel: Model<IMessPayment> = mongoose.models.MessPayment
  || mongoose.model<IMessPayment>("MessPayment", MessPaymentSchema);

export default MessPaymentModel;
