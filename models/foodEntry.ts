import mongoose, { Schema, Model } from 'mongoose';
import { FoodEntry, MealEntry} from '@/types/food';

const MealSchema = new Schema<MealEntry>({
    source: {
        type: String,
        enum: ["mess", "mess_regular", "mess_chicken", "outside", "none"],
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
        required: true
    },
    breakfast: MealSchema,
    lunch: MealSchema,
    dinner: MealSchema,
    totalCost: {
      type: Number,
      default: 0
    },
    userId: {
        type: String,
        required: true
    }
}, { timestamps: true })

FoodEntrySchema.index({ date: 1, userId: 1 }, { unique: true });

const FoodEntryModel: Model<FoodEntry> = mongoose.models.FoodEntry || mongoose.model<FoodEntry>("FoodEntry", FoodEntrySchema); 

export default FoodEntryModel;