import mongoose, { Schema, Model } from 'mongoose';

export type BillingCycle = "daily" | "weekly" | "monthly";

export interface BillingConfig {
  // For weekly: startDay (0-6, where 0 is Sunday)
  startDay?: number;
  
  // For monthly: startDay (1-31)
  monthlyStartDay?: number;
}

export interface MealSchedule {
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
}

export interface IMess {
  _id?: mongoose.Types.ObjectId;
  userId: string;
  name: string;
  mealSchedule: MealSchedule;
  billingCycle: BillingCycle;
  billingConfig?: BillingConfig;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const MealScheduleSchema = new Schema<MealSchedule>({
  breakfast: { type: Boolean, default: false },
  lunch: { type: Boolean, default: false },
  dinner: { type: Boolean, default: false },
}, { _id: false });

const BillingConfigSchema = new Schema<BillingConfig>({
  startDay: { type: Number, default: 0 }, // For weekly (0-6)
  monthlyStartDay: { type: Number, default: 1 }, // For monthly (1-31)
}, { _id: false });

const MessSchema = new Schema<IMess>({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
  },
  mealSchedule: {
    type: MealScheduleSchema,
    required: true,
  },
  billingCycle: {
    type: String,
    enum: ["daily", "weekly", "monthly"],
    required: true,
  },
  billingConfig: {
    type: BillingConfigSchema,
    default: {},
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
}, { timestamps: true });

// Compound index to ensure each user has unique mess names
MessSchema.index({ userId: 1, name: 1 }, { unique: true });

const MessModel: Model<IMess> = mongoose.models.Mess || mongoose.model<IMess>("Mess", MessSchema);

export default MessModel;
