import mongoose, { Model, Schema } from "mongoose";

export interface IMessMealOptionPrice {
  _id?: mongoose.Types.ObjectId;
  userId: string;
  messId: mongoose.Types.ObjectId;
  mealOptionId: mongoose.Types.ObjectId;
  price: number;
  effectiveFrom: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const MessMealOptionPriceSchema = new Schema<IMessMealOptionPrice>({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  messId: {
    type: Schema.Types.ObjectId,
    ref: "Mess",
    required: true,
    index: true,
  },
  mealOptionId: {
    type: Schema.Types.ObjectId,
    ref: "MessMealOption",
    required: true,
    index: true,
  },
  price: {
    type: Number,
    required: true,
    min: [0, "Price must be greater than or equal to 0"],
  },
  effectiveFrom: {
    type: String,
    required: true,
    validate: {
      validator: (value: string) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
        const date = new Date(`${value}T00:00:00.000Z`);
        return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
      },
      message: "effectiveFrom must be a valid YYYY-MM-DD date",
    },
  },
}, { timestamps: true });

MessMealOptionPriceSchema.index(
  { userId: 1, messId: 1, mealOptionId: 1, effectiveFrom: 1 },
  { unique: true, name: "userId_1_messId_1_mealOptionId_1_effectiveFrom_1" }
);

MessMealOptionPriceSchema.index(
  { userId: 1, messId: 1, mealOptionId: 1, effectiveFrom: -1 },
  { name: "userId_1_messId_1_mealOptionId_1_effectiveFrom_-1" }
);

const MessMealOptionPriceModel: Model<IMessMealOptionPrice> =
  mongoose.models.MessMealOptionPrice || mongoose.model<IMessMealOptionPrice>("MessMealOptionPrice", MessMealOptionPriceSchema);

export default MessMealOptionPriceModel;
