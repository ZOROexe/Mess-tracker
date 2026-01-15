import { getActiveMessPricing } from "./getActivePricing";
  
export async function normalizeMeal(
  mealType: "breakfast" | "lunch" | "dinner",
  meal: { source: "mess" | "outside" | "none"; cost?: number }, 
  date: string
) {

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