import connectDB from "@/lib/db";
import { auth } from "@/lib/auth";
import MessMealOptionModel from "@/models/messMealOption";
import MessMealOptionPriceModel from "@/models/messMealOptionPrice";
import mongoose from "mongoose";
import { isDuplicateKeyError } from "@/lib/messValidation";

async function getOwnedOption(userId: string, optionId: string) {
  if (!mongoose.isValidObjectId(optionId)) return null;
  return MessMealOptionModel.findOne({ _id: optionId, userId }).lean();
}

function validDate(value: unknown) {
  if (typeof value !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export async function GET(req: Request, { params }: { params: Promise<{ optionId: string }> }) {
  try {
    await connectDB();
    const session = await auth();
    if (!session?.user?.email) {
      return Response.json({ message: "Unauthorised" }, { status: 401 });
    }

    const userId = session.user.email;
    const { optionId } = await params;
    const url = new URL(req.url);
    const currentOnly = url.searchParams.get("current") === "true";
    const dateParam = url.searchParams.get("date");

    const option = await getOwnedOption(userId, optionId);
    if (!option) {
      return Response.json({ message: "Meal option not found" }, { status: 404 });
    }

    const mess = await mongoose.model("Mess").findOne({ _id: option.messId, userId }).lean();
    if (!mess) {
      return Response.json({ message: "Mess not found or does not belong to the current user" }, { status: 404 });
    }

    if (currentOnly) {
      const date = dateParam || new Date().toISOString().slice(0, 10);
      const current = await MessMealOptionPriceModel.findOne({
        userId,
        messId: option.messId,
        mealOptionId: option._id,
        effectiveFrom: { $lte: date },
      }).sort({ effectiveFrom: -1, createdAt: -1 }).lean();

      return Response.json(current || null, { status: 200 });
    }

    const history = await MessMealOptionPriceModel.find({
      userId,
      messId: option.messId,
      mealOptionId: option._id,
    }).sort({ effectiveFrom: 1, createdAt: 1 }).lean();

    return Response.json(history, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch meal option pricing", error);
    return Response.json({ message: "Failed to fetch meal option pricing" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ optionId: string }> }) {
  try {
    await connectDB();
    const session = await auth();
    if (!session?.user?.email) {
      return Response.json({ message: "Unauthorised" }, { status: 401 });
    }

    const userId = session.user.email;
    const { optionId } = await params;
    const body = await req.json();
    const price = Number(body?.price);
    const effectiveFrom = body?.effectiveFrom;

    if (!Number.isFinite(price) || price < 0) {
      return Response.json({ message: "Price must be a valid number greater than or equal to 0" }, { status: 400 });
    }

    if (!validDate(effectiveFrom)) {
      return Response.json({ message: "effectiveFrom must be a valid YYYY-MM-DD date" }, { status: 400 });
    }

    const option = await getOwnedOption(userId, optionId);
    if (!option) {
      return Response.json({ message: "Meal option not found" }, { status: 404 });
    }

    const mess = await mongoose.model("Mess").findOne({ _id: option.messId, userId }).lean();
    if (!mess) {
      return Response.json({ message: "Mess not found or does not belong to the current user" }, { status: 404 });
    }

    const record = await MessMealOptionPriceModel.create({
      userId,
      messId: option.messId,
      mealOptionId: option._id,
      price,
      effectiveFrom,
    });

    return Response.json(record, { status: 201 });
  } catch (error: unknown) {
    if (isDuplicateKeyError(error)) {
      return Response.json({ message: "A price for this effective date already exists for this option" }, { status: 409 });
    }

    console.error("Failed to add meal option price", error);
    return Response.json({ message: "Failed to add meal option price" }, { status: 500 });
  }
}
