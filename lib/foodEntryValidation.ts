import { FoodEntry, MealEntry, MealSource } from "@/types/food";

const mealSources: MealSource[] = ["mess", "mess_regular", "mess_chicken", "outside", "none"];

export function isValidDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isValidMeal(value: unknown): value is MealEntry {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const meal = value as Partial<MealEntry>;

  if (!mealSources.includes(meal.source as MealSource)) return false;
  if (meal.cost !== undefined && (!Number.isFinite(meal.cost) || meal.cost < 0)) return false;

  if (["mess", "mess_regular", "mess_chicken"].includes(meal.source as MealSource)) {
    if (typeof meal.messId !== "string" || !meal.messId) return false;
  }

  if (meal.source === "mess" && (typeof meal.mealOptionId !== "string" || !meal.mealOptionId)) {
    return false;
  }

  return true;
}

export function isValidFoodEntryPayload(value: unknown): value is Omit<FoodEntry, "userId" | "totalCost"> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const entry = value as Partial<FoodEntry>;
  return isValidDate(entry.date)
    && isValidMeal(entry.breakfast)
    && isValidMeal(entry.lunch)
    && isValidMeal(entry.dinner);
}
