import { auth } from "@/lib/auth";
import { getBillingPeriod } from "@/lib/billingUtils";
import { calculateMessBill } from "@/lib/calculateMessBill";
import connectDB from "@/lib/db";
import MessModel from "@/models/mess";
import { NextRequest } from "next/server";
import { Types } from "mongoose";

function isDateOnly(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const session = await auth();
    if (!session?.user?.email) return Response.json({ message: "Unauthorised" }, { status: 401 });

    const { id } = await params;
    const userId = session.user.email;
    if (!Types.ObjectId.isValid(id)) return Response.json({ message: "Invalid mess ID" }, { status: 400 });
    const mess = await MessModel.findOne({ _id: id, userId }).lean();
    if (!mess) return Response.json({ message: "Mess not found" }, { status: 404 });

    const date = req.nextUrl.searchParams.get("date") ?? formatLocalDate(new Date());
    if (!isDateOnly(date)) return Response.json({ message: "date must be YYYY-MM-DD" }, { status: 400 });
    const period = getBillingPeriod(date, mess.billingCycle, mess.billingConfig);
    const inclusiveEnd = new Date(period.endDate);
    inclusiveEnd.setDate(inclusiveEnd.getDate() - 1);
    const bill = await calculateMessBill({
      userId,
      messId: id,
      startDate: formatLocalDate(period.startDate),
      endDate: formatLocalDate(inclusiveEnd),
    });

    return Response.json({ bill }, { status: 200 });
  } catch (error) {
    console.error("Error calculating mess bill:", error);
    return Response.json({ message: "Failed to calculate mess bill" }, { status: 500 });
  }
}
