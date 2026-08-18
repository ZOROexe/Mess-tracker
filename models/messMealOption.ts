import mongoose, { Model, Schema } from "mongoose";

export type MealOptionMeal = "breakfast" | "lunch" | "dinner";

export interface IMessMealOption {
  _id?: mongoose.Types.ObjectId;
  userId: string;
  messId: mongoose.Types.ObjectId;
  meal: MealOptionMeal;
  name: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const MessMealOptionSchema = new Schema<IMessMealOption>({
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
  meal: {
    type: String,
    enum: ["breakfast", "lunch", "dinner"],
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: (value: string) => value.trim().length > 0,
      message: "Meal option name cannot be empty",
    },
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
}, { timestamps: true });

MessMealOptionSchema.index(
  { userId: 1, messId: 1, meal: 1, isActive: 1 },
  { name: "userId_1_messId_1_meal_1_isActive_1" }
);

MessMealOptionSchema.index(
  { userId: 1, messId: 1, meal: 1, name: 1 },
  { unique: true, name: "userId_1_messId_1_meal_1_name_1" }
);

const MessMealOptionModel: Model<IMessMealOption> =
  mongoose.models.MessMealOption || mongoose.model<IMessMealOption>("MessMealOption", MessMealOptionSchema);

export default MessMealOptionModel;
