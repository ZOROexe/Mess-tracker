import { getActiveMessPricing } from "./getActivePricing";
import { MealEntry } from "@/types/food";

  
export async function normalizeMeal(
  mealType: "breakfast" | "lunch" | "dinner",
  meal: MealEntry,
  date: string
): Promise<MealEntry> {

  const pricing = await getActiveMessPricing(date)

  if (meal.source === "mess") {
    return {
      source: "mess",
      cost: pricing[mealType]
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