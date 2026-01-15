import mongoose, { Model, Schema } from "mongoose";

interface MealPrice {
    breakfast: number;
    lunch: number;
    dinner: number;
    effectiveFrom: string;
}

const MessPricingSchema = new Schema<MealPrice>({
    breakfast: { type: Number, required: true },
    lunch: { type: Number, required: true },
    dinner: { type: Number, required: true },
    effectiveFrom: { type: String, required: true }
}, { timestamps: true });

const MessPriceModel: Model<MealPrice> = mongoose.models.MessPricing || mongoose.model("MessPricing", MessPricingSchema);

export default MessPriceModel;