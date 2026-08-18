import connectDB from "@/lib/db";
import { auth } from "@/lib/auth";
import MessModel from "@/models/mess";
import MessMealOptionModel, { MealOptionMeal } from "@/models/messMealOption";
import mongoose from "mongoose";
import { isDuplicateKeyError } from "@/lib/messValidation";

const VALID_MEALS: MealOptionMeal[] = ["breakfast", "lunch", "dinner"];

function getActiveFilter(value: string | null) {
  if (value === null) return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function normalizeMeal(value: unknown): MealOptionMeal | null {
  return typeof value === "string" && VALID_MEALS.includes(value as MealOptionMeal)
    ? (value as MealOptionMeal)
    : null;
}

export async function GET(req: Request) {
  try {
    await connectDB();
    const session = await auth();
    if (!session?.user?.email) {
      return Response.json([], { status: 200 });
    }

    const userId = session.user.email;
    const url = new URL(req.url);
    const messId = url.searchParams.get("messId");
    const meal = normalizeMeal(url.searchParams.get("meal"));
    const isActive = getActiveFilter(url.searchParams.get("isActive"));

    if (!messId || !mongoose.isValidObjectId(messId)) {
      return Response.json({ message: "messId is required and must be valid" }, { status: 400 });
    }

    const mess = await MessModel.findOne({ _id: messId, userId }).lean();
    if (!mess) {
      return Response.json({ message: "Mess not found" }, { status: 404 });
    }

    const filter: Record<string, unknown> = { userId, messId };
    if (meal) filter.meal = meal;
    if (typeof isActive === "boolean") filter.isActive = isActive;

    const options = await MessMealOptionModel.find(filter)
      .sort({ meal: 1, name: 1 })
      .lean();

    return Response.json(options, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch mess options", error);
    return Response.json({ message: "Failed to fetch mess options" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const session = await auth();
    if (!session?.user?.email) {
      return Response.json({ message: "Unauthorised" }, { status: 401 });
    }

    const userId = session.user.email;
    const body = await req.json();
    const messId = body?.messId;
    const meal = normalizeMeal(body?.meal);
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const isActive = body?.isActive ?? true;

    if (!messId || !mongoose.isValidObjectId(String(messId))) {
      return Response.json({ message: "messId is required and must be valid" }, { status: 400 });
    }

    if (!meal) {
      return Response.json({ message: "meal must be breakfast, lunch, or dinner" }, { status: 400 });
    }

    if (!name) {
      return Response.json({ message: "Option name is required" }, { status: 400 });
    }

    if (typeof isActive !== "boolean") {
      return Response.json({ message: "isActive must be a boolean" }, { status: 400 });
    }

    const mess = await MessModel.findOne({ _id: messId, userId }).lean();
    if (!mess) {
      return Response.json({ message: "Mess not found" }, { status: 404 });
    }

    const option = await MessMealOptionModel.create({
      userId,
      messId,
      meal,
      name,
      isActive,
    });

    return Response.json(option, { status: 201 });
  } catch (error: unknown) {
    if (isDuplicateKeyError(error)) {
      return Response.json({ message: "An option with this name already exists for this mess and meal" }, { status: 409 });
    }

    console.error("Failed to create mess option", error);
    return Response.json({ message: "Failed to create mess option" }, { status: 500 });
  }
}
