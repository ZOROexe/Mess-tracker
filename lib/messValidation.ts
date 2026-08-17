import { BillingCycle, BillingConfig, MealSchedule } from "@/models/mess";

const VALID_BILLING_CYCLES: BillingCycle[] = ["daily", "weekly", "monthly"];

export interface MessInput {
  name: string;
  mealSchedule: MealSchedule;
  billingCycle: BillingCycle;
  billingConfig?: BillingConfig;
}

export function validateMealSchedule(schedule?: MealSchedule): string | null {
  if (!schedule) {
    return "Meal schedule is required";
  }

  const { breakfast, lunch, dinner } = schedule;
  if (!breakfast && !lunch && !dinner) {
    return "At least one meal must be enabled";
  }

  return null;
}

export function validateBillingConfig(
  billingCycle: BillingCycle,
  billingConfig?: BillingConfig
): string | null {
  if (billingCycle === "weekly") {
    const startDay = billingConfig?.startDay ?? 0;
    if (startDay < 0 || startDay > 6) {
      return "Weekly billing start day must be between 0 (Sunday) and 6 (Saturday)";
    }
  }

  if (billingCycle === "monthly") {
    const monthlyStartDay = billingConfig?.monthlyStartDay ?? 1;
    if (monthlyStartDay < 1 || monthlyStartDay > 31) {
      return "Monthly billing start day must be between 1 and 31";
    }
  }

  return null;
}

export function validateMessInput(input: Partial<MessInput>): string | null {
  if (input.name !== undefined && !input.name.trim()) {
    return "Mess name is required";
  }

  if (input.mealSchedule) {
    const mealError = validateMealSchedule(input.mealSchedule);
    if (mealError) return mealError;
  }

  if (input.billingCycle !== undefined) {
    if (!VALID_BILLING_CYCLES.includes(input.billingCycle)) {
      return "Valid billing cycle is required";
    }
  }

  const cycle = input.billingCycle;
  if (cycle) {
    const billingError = validateBillingConfig(cycle, input.billingConfig);
    if (billingError) return billingError;
  }

  return null;
}

export function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: number }).code === 11000
  );
}
