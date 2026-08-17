import { Types } from "mongoose";
import FoodEntryModel from "@/models/foodEntry";
import MessPaymentModel from "@/models/messPayment";
import { CalculatedMessBill, MessBillStatus } from "@/types/billing";

interface CalculateMessBillParams {
  userId: string;
  messId: string;
  startDate: string;
  endDate: string;
}

const MESS_SOURCES = ["mess", "mess_regular", "mess_chicken"];

function isDateOnly(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/**
 * Calculates a bill without creating or updating a MessBill document.
 * Payments count only when explicitly allocated to this exact billing period.
 */
export async function calculateMessBill({
  userId,
  messId,
  startDate,
  endDate,
}: CalculateMessBillParams): Promise<CalculatedMessBill> {
  if (!Types.ObjectId.isValid(messId)) throw new Error("Invalid mess ID");
  if (!isDateOnly(startDate) || !isDateOnly(endDate) || startDate > endDate) {
    throw new Error("Billing period must use valid YYYY-MM-DD dates");
  }

  const messObjectId = new Types.ObjectId(messId);
  const foodTotals = await FoodEntryModel.aggregate<{ calculatedAmount: number }>([
    { $match: { userId, date: { $gte: startDate, $lte: endDate } } },
    {
      $project: {
        calculatedAmount: {
          $sum: [
            { $cond: [{ $and: [{ $in: ["$breakfast.source", MESS_SOURCES] }, { $eq: ["$breakfast.messId", messObjectId] }] }, "$breakfast.cost", 0] },
            { $cond: [{ $and: [{ $in: ["$lunch.source", MESS_SOURCES] }, { $eq: ["$lunch.messId", messObjectId] }] }, "$lunch.cost", 0] },
            { $cond: [{ $and: [{ $in: ["$dinner.source", MESS_SOURCES] }, { $eq: ["$dinner.messId", messObjectId] }] }, "$dinner.cost", 0] },
          ],
        },
      },
    },
    { $group: { _id: null, calculatedAmount: { $sum: "$calculatedAmount" } } },
  ]);

  const paymentTotals = await MessPaymentModel.aggregate<{ paidAmount: number }>([
    { $match: { userId, messId: messObjectId, billingPeriodStart: startDate, billingPeriodEnd: endDate } },
    { $group: { _id: null, paidAmount: { $sum: "$amount" } } },
  ]);

  const calculatedAmount = foodTotals[0]?.calculatedAmount ?? 0;
  const paidAmount = paymentTotals[0]?.paidAmount ?? 0;
  const balance = calculatedAmount - paidAmount;
  const status: MessBillStatus = paidAmount >= calculatedAmount
    ? "paid"
    : paidAmount > 0
      ? "partially_paid"
      : "unpaid";

  return { periodStart: startDate, periodEnd: endDate, calculatedAmount, paidAmount, balance, status };
}
