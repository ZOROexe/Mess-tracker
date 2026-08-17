import { getBillingPeriodsBetween } from "@/lib/billingUtils";
import { calculateMessBill } from "@/lib/calculateMessBill";
import MessModel from "@/models/mess";

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Bill periods are attributed to the calendar month in which they start. */
export async function calculateMonthlyBillingAnalytics(userId: string, month: string) {
  const startDate = `${month}-01`;
  const end = new Date(`${startDate}T00:00:00`);
  end.setMonth(end.getMonth() + 1);
  const endDate = formatLocalDate(end);
  const messes = await MessModel.find({ userId }).lean();

  const billResults = await Promise.all(messes.flatMap((mess) => {
    const periods = getBillingPeriodsBetween(startDate, endDate, mess.billingCycle, mess.billingConfig)
      .filter((period) => formatLocalDate(period.startDate).startsWith(month));
    return periods.map((period) => {
      const inclusiveEnd = new Date(period.endDate);
      inclusiveEnd.setDate(inclusiveEnd.getDate() - 1);
      return calculateMessBill({
        userId,
        messId: String(mess._id),
        startDate: formatLocalDate(period.startDate),
        endDate: formatLocalDate(inclusiveEnd),
      });
    });
  }));

  const totalBilled = billResults.reduce((sum, bill) => sum + bill.calculatedAmount, 0);
  const totalPaid = billResults.reduce((sum, bill) => sum + bill.paidAmount, 0);
  return { totalBilled, totalPaid, outstanding: totalBilled - totalPaid };
}
