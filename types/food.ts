export type MealSource = "mess" | "outside" | "none";

export interface MealEntry {
    source: MealSource;
    cost: number;
}

export interface FoodEntry {
  date: string;
  breakfast: MealEntry;
  lunch: MealEntry;
  dinner: MealEntry;
  totalCost: number;
}