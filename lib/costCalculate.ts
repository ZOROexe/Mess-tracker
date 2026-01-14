import { MESS_PRICES } from "@/constants/prices";
import { MealEntry } from "@/types/food";
  
export function normalizeMeal(
  mealType: "breakfast" | "lunch" | "dinner",
  meal: { source: "mess" | "outside" | "none"; cost?: number }
) {
  if (meal.source === "mess") {
    return {
      source: "mess",
      cost: MESS_PRICES[mealType]
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