import mongoose, { Schema, Model } from 'mongoose';
import { FoodEntry, MealEntry} from '@/types/food';

const MealSchema = new Schema<MealEntry>({
    source: {
        type: String,
        enum: ["mess", "outside", "none"],
        default: "none"
    },
    cost: {
        type: Number,
        default: 0
    },
}, { _id: false })

const FoodEntrySchema = new Schema<FoodEntry>({
    date: {
        type: String,
        required: true,
        unique: true
    },
    breakfast: MealSchema,
    lunch: MealSchema,
    dinner: MealSchema,
    totalCost: {
      type: Number,
      default: 0
    }
}, { timestamps: true })

const FoodEntryModel: Model<FoodEntry> = mongoose.models.FoodEntry || mongoose.model<FoodEntry>("FoodEntry", FoodEntrySchema); 

export default FoodEntryModel;