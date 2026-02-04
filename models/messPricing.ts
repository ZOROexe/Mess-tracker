import mongoose, { Model, Schema } from "mongoose";

interface MealPrice {
    breakfast: number;
    lunch_regular: number;
    lunch_chicken: number;
    dinner_regular: number;
    dinner_chicken: number;
    effectiveFrom: string;
    userId: string;
}

const MessPricingSchema = new Schema<MealPrice>({
    breakfast: { type: Number, required: true },
    lunch_regular: { type: Number, default: 50 },
    lunch_chicken: { type: Number, default: 60 },
    dinner_regular: { type: Number, default: 50 },
    dinner_chicken: { type: Number, default: 60 },
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