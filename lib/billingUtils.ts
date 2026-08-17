import { BillingCycle, BillingConfig } from '@/models/mess';

/**
 * Represents a billing period with start and end dates.
 */
export interface BillingPeriod {
  startDate: Date;
  endDate: Date;
}

/**
 * Calculates the billing period for a given date and billing configuration.
 *
 * This utility handles three billing cycles:
 * - daily: Each calendar day is its own period
 * - weekly: Periods are 7 days starting from a configured weekday
 * - monthly: Periods start on a configured day of the month
 *
 * @param dateStr - Date string in YYYY-MM-DD format or any Date-parseable format
 * @param billingCycle - The billing cycle type ("daily", "weekly", or "monthly")
 * @param billingConfig - Configuration object containing:
 *   - startDay: For weekly billing, the weekday (0=Sunday, 1=Monday, ..., 6=Saturday)
 *   - monthlyStartDay: For monthly billing, the day of month (1-31)
 * @returns A BillingPeriod object with startDate and endDate (exclusive on endDate)
 *
 * @example
 * // Monthly billing starting on the 15th
 * getBillingPeriod("2026-08-17", "monthly", { monthlyStartDay: 15 })
 * // Returns: { startDate: 2026-08-15, endDate: 2026-09-15 }
 *
 * @example
 * // Weekly billing starting on Monday
 * getBillingPeriod("2026-08-17", "weekly", { startDay: 1 })
 * // Returns: { startDate: 2026-08-17, endDate: 2026-08-24 }
 *
 * @example
 * // Daily billing
 * getBillingPeriod("2026-08-17", "daily")
 * // Returns: { startDate: 2026-08-17, endDate: 2026-08-18 }
 */
export function getBillingPeriod(
  dateStr: string,
  billingCycle: BillingCycle,
  billingConfig?: BillingConfig
): BillingPeriod {
  const date = new Date(dateStr);

  switch (billingCycle) {
    case 'daily':
      return getDailyBillingPeriod(date);
    case 'weekly':
      return getWeeklyBillingPeriod(date, billingConfig?.startDay ?? 0);
    case 'monthly':
      return getMonthlyBillingPeriod(date, billingConfig?.monthlyStartDay ?? 1);
    default:
      throw new Error(`Unknown billing cycle: ${billingCycle}`);
  }
}

/**
 * Daily billing: each calendar day is one billing period.
 *
 * @param date - The date to get the billing period for
 * @returns A period from start of day to start of next day
 */
function getDailyBillingPeriod(date: Date): BillingPeriod {
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 1);

  return { startDate, endDate };
}

/**
 * Weekly billing: periods are 7 days starting from a configured weekday.
 *
 * @param date - The date to get the billing period for
 * @param startDay - Weekday (0=Sunday, 1=Monday, ..., 6=Saturday)
 * @returns A period from the current week's start day to 7 days later
 *
 * @example
 * // If startDay is 1 (Monday) and date is Wednesday Aug 19:
 * // Returns: Monday Aug 17 to Monday Aug 24 (exclusive)
 */
function getWeeklyBillingPeriod(date: Date, startDay: number): BillingPeriod {
  // startDay: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  // Validate startDay
  if (startDay < 0 || startDay > 6) {
    throw new Error(`Invalid week start day: ${startDay}. Must be 0-6.`);
  }

  const currentDay = date.getDay();
  const daysToSubtract = (currentDay - startDay + 7) % 7;

  const startDate = new Date(date);
  startDate.setDate(startDate.getDate() - daysToSubtract);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 7);

  return { startDate, endDate };
}

/**
 * Monthly billing: periods start on a configured day of the month.
 *
 * BILLING PERIOD RULE:
 * - Each billing period starts on the configured day (or the last day of the month if the configured day doesn't exist)
 * - The period ends on the day before the start of the next period
 * - This creates variable-length periods when the configured day is near month-end
 *
 * EXAMPLES:
 * - startDay = 15:
 *   - Aug 15 → Sep 14 (30 days)
 *   - Sep 15 → Oct 14 (30 days)
 *
 * - startDay = 31:
 *   - Jan 31 → Feb 27 (28 days; Feb is treated as starting on day 28)
 *   - Feb 28 → Mar 30 (31 days; Mar is treated as starting on day 31)
 *   - Mar 31 → Apr 29 (30 days; Apr is treated as starting on day 30)
 *
 * @param date - The date to get the billing period for
 * @param monthlyStartDay - Day of month to start billing (1-31)
 * @returns A billing period spanning approximately one month
 */
function getMonthlyBillingPeriod(date: Date, monthlyStartDay: number): BillingPeriod {
  // Validate monthlyStartDay
  if (monthlyStartDay < 1 || monthlyStartDay > 31) {
    throw new Error(`Invalid monthly start day: ${monthlyStartDay}. Must be 1-31.`);
  }

  const year = date.getFullYear();
  const month = date.getMonth(); // 0-11
  const day = date.getDate();

  /**
   * Gets the effective billing start day for a given year and month.
   * If the configured start day doesn't exist in that month, uses the last day.
   */
  function getEffectiveStartDayForMonth(y: number, m: number): number {
    const lastDayOfMonth = new Date(y, m + 1, 0).getDate();
    return Math.min(monthlyStartDay, lastDayOfMonth);
  }

  const thisMonthEffectiveDay = getEffectiveStartDayForMonth(year, month);

  let periodStart: Date;

  if (day >= thisMonthEffectiveDay) {
    // Current date is on or after this month's billing start day
    periodStart = new Date(year, month, thisMonthEffectiveDay);
  } else {
    // Current date is before this month's billing start day
    // So we're in the previous month's billing period
    const prevMonthEffectiveDay = getEffectiveStartDayForMonth(year, month - 1);
    periodStart = new Date(year, month - 1, prevMonthEffectiveDay);
  }

  // Calculate period end: one day before the start of the next period
  const nextMonthEffectiveDay = getEffectiveStartDayForMonth(
    periodStart.getFullYear(),
    periodStart.getMonth() + 1
  );
  const nextMonthStart = new Date(
    periodStart.getFullYear(),
    periodStart.getMonth() + 1,
    nextMonthEffectiveDay
  );

  const periodEnd = new Date(nextMonthStart);
  periodEnd.setDate(periodEnd.getDate() - 1);

  periodStart.setHours(0, 0, 0, 0);
  periodEnd.setHours(0, 0, 0, 0);
  periodEnd.setDate(periodEnd.getDate() + 1); // Make it exclusive (start of next day)

  return { startDate: periodStart, endDate: periodEnd };
}

/**
 * Checks if a date falls within a billing period.
 *
 * @param date - Date to check
 * @param period - Billing period (endDate is exclusive)
 * @returns true if date is within the period
 */
export function isDateInBillingPeriod(date: Date, period: BillingPeriod): boolean {
  return date >= period.startDate && date < period.endDate;
}

/**
 * Gets all billing periods between two dates.
 *
 * @param startDateStr - Start date (YYYY-MM-DD format)
 * @param endDateStr - End date (YYYY-MM-DD format)
 * @param billingCycle - The billing cycle type
 * @param billingConfig - Configuration for the billing cycle
 * @returns Array of billing periods
 */
export function getBillingPeriodsBetween(
  startDateStr: string,
  endDateStr: string,
  billingCycle: BillingCycle,
  billingConfig?: BillingConfig
): BillingPeriod[] {
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);
  const periods: BillingPeriod[] = [];

  let currentDate = new Date(startDate);

  while (currentDate < endDate) {
    const period = getBillingPeriod(currentDate.toISOString(), billingCycle, billingConfig);
    periods.push(period);

    // Move to the end of this period
    currentDate = new Date(period.endDate);
  }

  return periods;
}
