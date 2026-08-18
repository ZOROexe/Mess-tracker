import { getActiveMessPricing } from "./getActivePricing";
import { MealEntry, MealPrice } from "@/types/food";
import MessModel from "@/models/mess";
import MessMealOptionModel from "@/models/messMealOption";
import MessMealOptionPriceModel from "@/models/messMealOptionPrice";

export async function normalizeMeal(
  userId: string,
  mealType: "breakfast" | "lunch" | "dinner",
  meal: MealEntry,
  date: string
): Promise<MealEntry> {
  if (meal.source === "mess") {
    if (!meal.messId) throw new Error(`${mealType} messId is required`);
    const mess = await MessModel.findOne({ _id: meal.messId, userId }).lean();
    if (!mess) throw new Error(`${mealType} mess does not belong to the current user`);

    if (!meal.mealOptionId) {
      throw new Error(`${mealType} mealOptionId is required for mess meals`);
    }

    const option = await MessMealOptionModel.findOne({
      _id: meal.mealOptionId,
      userId,
      messId: meal.messId,
      meal: mealType,
      isActive: true,
    }).lean();

    if (!option) {
      throw new Error(`${mealType} meal option is not available for this mess`);
    }

    const priceRecord = await MessMealOptionPriceModel.findOne({
      userId,
      messId: meal.messId,
      mealOptionId: option._id,
      effectiveFrom: { $lte: date },
    }).sort({ effectiveFrom: -1, createdAt: -1 }).lean();

    if (!priceRecord) {
      throw new Error(`No pricing found for ${option.name} on ${date}`);
    }

    return {
      source: "mess",
      messId: meal.messId,
      mealOptionId: String(option._id),
      mealOptionName: option.name,
      cost: Number(priceRecord.price),
    };
  }

  if (meal.source === "mess_regular") {
    if (!meal.messId) throw new Error(`${mealType} messId is required`);
    const mess = await MessModel.findOne({ _id: meal.messId, userId }).lean();
    if (!mess) throw new Error(`${mealType} mess does not belong to the current user`);
    const pricing = await getActiveMessPricing(userId, meal.messId, date);
    const priceKey = mealType === "breakfast" ? "breakfast" : `${mealType}_regular` as keyof MealPrice;
    return {
      source: meal.source,
      messId: meal.messId,
      cost: Number(pricing[priceKey]),
    };
  }

  if (meal.source === "mess_chicken") {
    if (mealType === "breakfast") throw new Error("Breakfast does not support chicken pricing");
    if (!meal.messId) throw new Error(`${mealType} messId is required`);
    const mess = await MessModel.findOne({ _id: meal.messId, userId }).lean();
    if (!mess) throw new Error(`${mealType} mess does not belong to the current user`);
    const pricing = await getActiveMessPricing(userId, meal.messId, date);
    const priceKey = `${mealType}_chicken` as keyof MealPrice;
    return {
      source: "mess_chicken",
      messId: meal.messId,
      cost: Number(pricing[priceKey]),
    };
  }

  if (meal.source === "outside") {
    return {
      source: "outside",
      cost: meal.cost ?? 0
    };
  }

  return {
    source: "none",
    cost: 0
  };
}

export function isEmpty(breakfast: MealEntry, lunch: MealEntry, dinner: MealEntry) {
  if(breakfast.source === "none" && lunch.source === 'none' && dinner.source === 'none') return true
}
