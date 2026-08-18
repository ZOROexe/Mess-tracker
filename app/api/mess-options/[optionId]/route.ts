import connectDB from "@/lib/db";
import { auth } from "@/lib/auth";
import MessMealOptionModel from "@/models/messMealOption";
import MessModel from "@/models/mess";
import mongoose from "mongoose";
import { isDuplicateKeyError } from "@/lib/messValidation";

async function getOwnedOption(userId: string, optionId: string) {
  if (!mongoose.isValidObjectId(optionId)) return null;
  return MessMealOptionModel.findOne({ _id: optionId, userId }).lean();
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
    const option = await getOwnedOption(userId, optionId);

    if (!option) {
      return Response.json({ message: "Meal option not found" }, { status: 404 });
    }

    return Response.json(option, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch meal option", error);
    return Response.json({ message: "Failed to fetch meal option" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ optionId: string }> }) {
  try {
    await connectDB();
    const session = await auth();
    if (!session?.user?.email) {
      return Response.json({ message: "Unauthorised" }, { status: 401 });
    }

    const userId = session.user.email;
    const { optionId } = await params;
    const option = await getOwnedOption(userId, optionId);

    if (!option) {
      return Response.json({ message: "Meal option not found" }, { status: 404 });
    }

    const body = await req.json();
    const update: Record<string, unknown> = {};

    if (typeof body?.name === "string") {
      const name = body.name.trim();
      if (!name) {
        return Response.json({ message: "Option name cannot be empty" }, { status: 400 });
      }
      update.name = name;
    }

    if (typeof body?.isActive === "boolean") {
      update.isActive = body.isActive;
    }

    if (Object.keys(update).length === 0) {
      return Response.json({ message: "No valid fields to update" }, { status: 400 });
    }

    const updated = await MessMealOptionModel.findOneAndUpdate(
      { _id: optionId, userId },
      { $set: update },
      { new: true, runValidators: true }
    ).lean();

    return Response.json(updated, { status: 200 });
  } catch (error: unknown) {
    if (isDuplicateKeyError(error)) {
      return Response.json({ message: "An option with this name already exists for this mess and meal" }, { status: 409 });
    }

    console.error("Failed to update meal option", error);
    return Response.json({ message: "Failed to update meal option" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ optionId: string }> }) {
  try {
    await connectDB();
    const session = await auth();
    if (!session?.user?.email) {
      return Response.json({ message: "Unauthorised" }, { status: 401 });
    }

    const userId = session.user.email;
    const { optionId } = await params;
    const option = await getOwnedOption(userId, optionId);

    if (!option) {
      return Response.json({ message: "Meal option not found" }, { status: 404 });
    }

    const mess = await MessModel.findOne({ _id: option.messId, userId }).lean();
    if (!mess) {
      return Response.json({ message: "Mess not found" }, { status: 404 });
    }

    const updated = await MessMealOptionModel.findOneAndUpdate(
      { _id: optionId, userId },
      { $set: { isActive: false } },
      { new: true, runValidators: true }
    ).lean();

    return Response.json(updated, { status: 200 });
  } catch (error) {
    console.error("Failed to deactivate meal option", error);
    return Response.json({ message: "Failed to deactivate meal option" }, { status: 500 });
  }
}
