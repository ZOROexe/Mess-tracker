export const MESS_PRICES = {
  breakfast: 50,
  lunch: 60,
  dinner: 50
} as const;

export type MealType = keyof typeof MESS_PRICES;