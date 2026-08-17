export type BillingCycle = "daily" | "weekly" | "monthly";

export interface BillingConfig {
  startDay?: number;
  monthlyStartDay?: number;
}

export interface MealSchedule {
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
}

export interface Mess {
  _id: string;
  userId: string;
  name: string;
  mealSchedule: MealSchedule;
  billingCycle: BillingCycle;
  billingConfig?: BillingConfig;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MessInput {
  name: string;
  mealSchedule: MealSchedule;
  billingCycle: BillingCycle;
  billingConfig?: BillingConfig;
}
