export type MealSource = "mess" | "mess_regular" | "mess_chicken" | "outside" | "none";

export interface MealEntry {
    source: MealSource;
    cost: number;
    // Optional while existing entries are being migrated to per-meal messes.
    messId?: string;
    mealOptionId?: string;
    mealOptionName?: string;
}

export interface FoodEntry {
  date: string;
  breakfast: MealEntry;
  lunch: MealEntry;
  dinner: MealEntry;
  userId: string;
  totalCost: number;
}

export interface MealState {
  source: MealSource;
  cost?: number;
  messId?: string;
  mealOptionId?: string;
  mealOptionName?: string;
}

export interface MealPrice {
    messId?: string;
    breakfast: number;
    lunch_regular: number;
    lunch_chicken: number;
    dinner_regular: number;
    dinner_chicken: number;
    effectiveFrom: string;
}
