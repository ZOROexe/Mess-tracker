export type MealSource = "mess" | "mess_regular" | "mess_chicken" | "outside" | "none";

export interface MealEntry {
    source: MealSource;
    cost: number;
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
}

export interface MealPrice {
    breakfast: number;
    lunch_regular: number;
    lunch_chicken: number;
    dinner_regular: number;
    dinner_chicken: number;
    effectiveFrom: string;
}