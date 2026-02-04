import { getActiveMessPricing } from "./getActivePricing";
import { MealEntry, MealPrice } from "@/types/food";

  
export async function normalizeMeal(
  mealType: "breakfast" | "lunch" | "dinner",
  meal: MealEntry,
  date: string
): Promise<MealEntry> {

  const pricing = await getActiveMessPricing(date)

  if (meal.source === "mess" || meal.source === "mess_regular") {
    const priceKey = mealType === "breakfast" ? "breakfast" : `${mealType}_regular` as keyof MealPrice;
    return {
      source: "mess_regular",
      cost: Number(pricing[priceKey])
    };
  }

  if (meal.source === "mess_chicken") {
    const priceKey = `${mealType}_chicken` as keyof MealPrice;
    return {
      source: "mess_chicken",
      cost: Number(pricing[priceKey])
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