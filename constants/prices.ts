export const MESS_PRICES = {
  breakfast: 50,
  lunch_regular: 50,
  lunch_chicken: 60,
  dinner_regular: 50,
  dinner_chicken: 60
} as const;

export type MealType = keyof typeof MESS_PRICES;