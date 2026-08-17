import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import { calculateMonthlyBillingAnalytics } from "@/lib/monthlyBillingAnalytics";
import FoodEntryModel from "@/models/foodEntry";
import { NextRequest } from "next/server";

const MESS_SOURCES = ["mess", "mess_regular", "mess_chicken"];

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const session = await auth();
    if (!session?.user?.email) return Response.json({ message: "Unauthorised" }, { status: 401 });

    const month = req.nextUrl.searchParams.get("month");
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return Response.json({ message: "month must be YYYY-MM" }, { status: 400 });
    }
    const userId = session.user.email;
    const match = { userId, date: { $regex: `^${month}` } };

    const [summaryRows, dailySpend, messSpendRows, billing] = await Promise.all([
      FoodEntryModel.aggregate([
        { $match: match },
        {
          $project: {
            messTotal: {
              $sum: [
                { $cond: [{ $in: ["$breakfast.source", MESS_SOURCES] }, "$breakfast.cost", 0] },
                { $cond: [{ $in: ["$lunch.source", MESS_SOURCES] }, "$lunch.cost", 0] },
                { $cond: [{ $in: ["$dinner.source", MESS_SOURCES] }, "$dinner.cost", 0] },
              ],
            },
            outsideTotal: {
              $sum: [
                { $cond: [{ $eq: ["$breakfast.source", "outside"] }, "$breakfast.cost", 0] },
                { $cond: [{ $eq: ["$lunch.source", "outside"] }, "$lunch.cost", 0] },
                { $cond: [{ $eq: ["$dinner.source", "outside"] }, "$dinner.cost", 0] },
              ],
            },
          },
        },
        { $project: { messTotal: 1, outsideTotal: 1, grandTotal: { $add: ["$messTotal", "$outsideTotal"] } } },
        { $group: { _id: null, messTotal: { $sum: "$messTotal" }, outsideTotal: { $sum: "$outsideTotal" }, grandTotal: { $sum: "$grandTotal" } } },
      ]),
      FoodEntryModel.aggregate([
        { $match: match },
        {
          $project: {
            date: 1,
            total: {
              $sum: [
                { $cond: [{ $in: ["$breakfast.source", MESS_SOURCES] }, "$breakfast.cost", 0] },
                { $cond: [{ $in: ["$lunch.source", MESS_SOURCES] }, "$lunch.cost", 0] },
                { $cond: [{ $in: ["$dinner.source", MESS_SOURCES] }, "$dinner.cost", 0] },
                { $cond: [{ $eq: ["$breakfast.source", "outside"] }, "$breakfast.cost", 0] },
                { $cond: [{ $eq: ["$lunch.source", "outside"] }, "$lunch.cost", 0] },
                { $cond: [{ $eq: ["$dinner.source", "outside"] }, "$dinner.cost", 0] },
              ],
            },
          },
        },
        { $sort: { date: 1 } },
      ]),
      FoodEntryModel.aggregate([
        { $match: match },
        { $project: { meals: ["$breakfast", "$lunch", "$dinner"] } },
        { $unwind: "$meals" },
        { $match: { "meals.source": { $in: MESS_SOURCES }, "meals.messId": { $exists: true, $ne: null } } },
        { $group: { _id: "$meals.messId", amount: { $sum: "$meals.cost" } } },
        {
          $lookup: {
            from: "messes",
            let: { messId: "$_id" },
            pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$_id", "$$messId"] }, { $eq: ["$userId", userId] }] } } }],
            as: "mess",
          },
        },
        { $unwind: "$mess" },
        { $project: { _id: 0, messId: { $toString: "$_id" }, messName: "$mess.name", amount: 1 } },
        { $sort: { amount: -1, messName: 1 } },
      ]),
      calculateMonthlyBillingAnalytics(userId, month),
    ]);

    return Response.json({
      summary: summaryRows[0] ?? { messTotal: 0, outsideTotal: 0, grandTotal: 0 },
      dailySpend,
      spendingByMess: messSpendRows,
      billing,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return Response.json({ message: "Failed to fetch analytics" }, { status: 500 });
  }
}
