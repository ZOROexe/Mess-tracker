import { BillingCycle, BillingConfig, MealSchedule, Mess } from "@/types/mess";

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function ordinal(n: number): string {
  const suffixes = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

export function formatMealSchedule(schedule: MealSchedule): string {
  const meals: string[] = [];
  if (schedule.breakfast) meals.push("Breakfast");
  if (schedule.lunch) meals.push("Lunch");
  if (schedule.dinner) meals.push("Dinner");
  return meals.length > 0 ? meals.join(" · ") : "No meals";
}

export function formatBillingCycle(cycle: BillingCycle): string {
  switch (cycle) {
    case "daily":
      return "Daily billing";
    case "weekly":
      return "Weekly billing";
    case "monthly":
      return "Monthly billing";
  }
}

export function formatBillingDetails(
  cycle: BillingCycle,
  config?: BillingConfig
): string | null {
  if (cycle === "weekly") {
    const day = config?.startDay ?? 0;
    return `Starts ${WEEKDAYS[day]}`;
  }

  if (cycle === "monthly") {
    const day = config?.monthlyStartDay ?? 1;
    const prevDay = day === 1 ? "last day of the month" : ordinal(day - 1);
    return `${ordinal(day)} → ${prevDay}`;
  }

  return null;
}

export function getMonthlyBillingExplanation(day: number): string {
  if (day === 1) {
    return "Each billing period runs from the 1st through the last day of the month.";
  }

  return `Each billing period runs from the ${ordinal(day)} through the ${ordinal(day - 1)} of the following month.`;
}

export function getWeekdayOptions() {
  return WEEKDAYS.map((label, value) => ({ label, value }));
}

export { WEEKDAYS };
