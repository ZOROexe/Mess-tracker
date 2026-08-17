import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import MessModel from "@/models/mess";
import MessPaymentModel from "@/models/messPayment";
import { MessPaymentInput } from "@/types/billing";
import { NextRequest } from "next/server";
import { Types } from "mongoose";

function isDateOnly(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

async function getOwnedMess(id: string, userId: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  return MessModel.findOne({ _id: id, userId }).lean();
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const session = await auth();
    if (!session?.user?.email) return Response.json({ message: "Unauthorised" }, { status: 401 });

    const { id } = await params;
    const userId = session.user.email;
    if (!await getOwnedMess(id, userId)) return Response.json({ message: "Mess not found" }, { status: 404 });

    const payments = await MessPaymentModel.find({ userId, messId: id }).sort({ paymentDate: -1, createdAt: -1 });
    return Response.json({ payments }, { status: 200 });
  } catch (error) {
    console.error("Error fetching mess payments:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const session = await auth();
    if (!session?.user?.email) return Response.json({ message: "Unauthorised" }, { status: 401 });

    const { id } = await params;
    const userId = session.user.email;
    if (!await getOwnedMess(id, userId)) return Response.json({ message: "Mess not found" }, { status: 404 });

    const body = await req.json() as MessPaymentInput;
    const hasPeriodStart = body.billingPeriodStart !== undefined;
    const hasPeriodEnd = body.billingPeriodEnd !== undefined;
    if (
      typeof body.amount !== "number" || !Number.isFinite(body.amount) || body.amount <= 0
      || !isDateOnly(body.paymentDate)
      || hasPeriodStart !== hasPeriodEnd
      || (hasPeriodStart && (!isDateOnly(body.billingPeriodStart) || !isDateOnly(body.billingPeriodEnd) || body.billingPeriodStart > body.billingPeriodEnd))
      || (body.notes !== undefined && (typeof body.notes !== "string" || body.notes.length > 1000))
    ) {
      return Response.json({ message: "Invalid payment details" }, { status: 400 });
    }

    const payment = await MessPaymentModel.create({
      userId,
      messId: id,
      amount: body.amount,
      paymentDate: body.paymentDate,
      billingPeriodStart: body.billingPeriodStart,
      billingPeriodEnd: body.billingPeriodEnd,
      notes: body.notes?.trim(),
    });
    return Response.json({ payment }, { status: 201 });
  } catch (error) {
    console.error("Error creating mess payment:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
