import mongoose, { Model, Schema } from "mongoose";

interface MealPrice {
    breakfast: number;
    lunch: number;
    dinner: number;
    effectiveFrom: string;
    userId: string;
}

const MessPricingSchema = new Schema<MealPrice>({
    breakfast: { type: Number, required: true },
    lunch: { type: Number, required: true },
    dinner: { type: Number, required: true },
    effectiveFrom: { type: String, required: true },
    userId: {
        type: String,
        required: true,
        index: true
    }
}, { timestamps: true });

MessPricingSchema.index(
  { userId: 1, effectiveFrom: 1 },
  { unique: true }
);

const MessPriceModel: Model<MealPrice> = mongoose.models.MessPricing || mongoose.model("MessPricing", MessPricingSchema);

export default MessPriceModel;