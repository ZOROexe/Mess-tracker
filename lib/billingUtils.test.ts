// Simple test file for billing utilities
// Run with: node lib/billingUtils.test.js (after compilation)

function getLastDayOfMonth(y: number, m: number): number {
  return new Date(y, m + 1, 0).getDate();
}

function getPeriodStartDateForMonth(y: number, m: number, startDay: number): Date {
  const lastDay = getLastDayOfMonth(y, m);
  const actualDay = Math.min(startDay, lastDay);
  return new Date(y, m, actualDay);
}

function getMonthlyBillingPeriod(dateStr: string, monthlyStartDay: number) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  function getEffectiveStartDayForMonth(y: number, m: number): number {
    const lastDayOfMonth = new Date(y, m + 1, 0).getDate();
    return Math.min(monthlyStartDay, lastDayOfMonth);
  }

  const thisMonthEffectiveDay = getEffectiveStartDayForMonth(year, month);

  let periodStart: Date;

  if (day >= thisMonthEffectiveDay) {
    periodStart = new Date(year, month, thisMonthEffectiveDay);
  } else {
    const prevMonthEffectiveDay = getEffectiveStartDayForMonth(year, month - 1);
    periodStart = new Date(year, month - 1, prevMonthEffectiveDay);
  }

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

  return {
    startDate: periodStart.toISOString().split('T')[0],
    endDate: periodEnd.toISOString().split('T')[0],
  };
}

function getDailyBillingPeriod(dateStr: string) {
  const date = new Date(dateStr);
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 1);

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
}

function getWeeklyBillingPeriod(dateStr: string, startDay: number) {
  const date = new Date(dateStr);
  const currentDay = date.getDay();
  const daysToSubtract = (currentDay - startDay + 7) % 7;

  const startDate = new Date(date);
  startDate.setDate(startDate.getDate() - daysToSubtract);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 7);

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
}

// Test cases
console.log('=== MONTHLY BILLING TESTS ===');

console.log('\n1. Monthly billing starting on the 15th (Aug 17):');
const test1 = getMonthlyBillingPeriod('2026-08-17', 15);
console.log(`Input: 2026-08-17, startDay: 15`);
console.log(`Expected: 2026-08-15 → 2026-09-14`);
console.log(`Got:      ${test1.startDate} → ${test1.endDate}`);
console.log(`Match: ${test1.startDate === '2026-08-15' && test1.endDate === '2026-09-14'}`);

console.log('\n2. Monthly billing starting on the 15th (Sep 16):');
const test2 = getMonthlyBillingPeriod('2026-09-16', 15);
console.log(`Input: 2026-09-16, startDay: 15`);
console.log(`Expected: 2026-09-15 → 2026-10-14`);
console.log(`Got:      ${test2.startDate} → ${test2.endDate}`);
console.log(`Match: ${test2.startDate === '2026-09-15' && test2.endDate === '2026-10-14'}`);

console.log('\n3. Monthly billing starting on the 15th (Aug 14):');
const test3 = getMonthlyBillingPeriod('2026-08-14', 15);
console.log(`Input: 2026-08-14, startDay: 15`);
console.log(`Expected: 2026-07-15 → 2026-08-14`);
console.log(`Got:      ${test3.startDate} → ${test3.endDate}`);
console.log(`Match: ${test3.startDate === '2026-07-15' && test3.endDate === '2026-08-14'}`);

console.log('\n4. Monthly billing starting on the 31st (Jan 31):');
const test4 = getMonthlyBillingPeriod('2026-01-31', 31);
console.log(`Input: 2026-01-31, startDay: 31`);
console.log(`Expected: 2026-01-31 → 2026-02-27`);
console.log(`Got:      ${test4.startDate} → ${test4.endDate}`);

console.log('\n5. Monthly billing starting on the 31st (Feb 28, non-leap year):');
const test5 = getMonthlyBillingPeriod('2026-02-28', 31);
console.log(`Input: 2026-02-28, startDay: 31`);
console.log(`Expected: 2026-02-28 → 2026-03-30`);
console.log(`Got:      ${test5.startDate} → ${test5.endDate}`);

console.log('\n=== WEEKLY BILLING TESTS ===');

console.log('\n6. Weekly billing starting on Monday (Aug 17 is Sunday):');
const test6 = getWeeklyBillingPeriod('2026-08-17', 1); // 1 = Monday
console.log(`Input: 2026-08-17 (Sunday), startDay: 1 (Monday)`);
console.log(`Got: ${test6.startDate} → ${test6.endDate}`);

console.log('\n7. Weekly billing starting on Monday (Aug 19 is Wednesday):');
const test7 = getWeeklyBillingPeriod('2026-08-19', 1); // 1 = Monday
console.log(`Input: 2026-08-19 (Wednesday), startDay: 1 (Monday)`);
console.log(`Expected: 2026-08-17 → 2026-08-24`);
console.log(`Got:      ${test7.startDate} → ${test7.endDate}`);

console.log('\n=== DAILY BILLING TESTS ===');

console.log('\n8. Daily billing (Aug 17):');
const test8 = getDailyBillingPeriod('2026-08-17');
console.log(`Input: 2026-08-17`);
console.log(`Expected: 2026-08-17 → 2026-08-18`);
console.log(`Got:      ${test8.startDate} → ${test8.endDate}`);
console.log(`Match: ${test8.startDate === '2026-08-17' && test8.endDate === '2026-08-18'}`);
