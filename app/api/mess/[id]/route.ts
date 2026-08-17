import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import {
  isDuplicateKeyError,
  validateBillingConfig,
  validateMealSchedule,
  validateMessInput,
} from "@/lib/messValidation";
import MessModel, { BillingCycle, BillingConfig, IMess } from "@/models/mess";
import { NextRequest } from "next/server";
import { Types } from "mongoose";

interface UpdateMessRequest {
  name?: string;
  mealSchedule?: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
  };
  billingCycle?: BillingCycle;
  billingConfig?: BillingConfig;
  isActive?: boolean;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const session = await auth();
    if (!session?.user?.email) {
      return Response.json({ message: "Unauthorised" }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.email;

    if (!Types.ObjectId.isValid(id)) {
      return Response.json({ message: "Invalid mess ID" }, { status: 400 });
    }

    const mess = await MessModel.findOne({ _id: id, userId });
    if (!mess) {
      return Response.json({ message: "Mess not found" }, { status: 404 });
    }

    return Response.json({ mess }, { status: 200 });
  } catch (error) {
    console.error("Error fetching mess:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const session = await auth();
    if (!session?.user?.email) {
      return Response.json({ message: "Unauthorised" }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.email;
    const body: UpdateMessRequest = await req.json();

    if (!Types.ObjectId.isValid(id)) {
      return Response.json({ message: "Invalid mess ID" }, { status: 400 });
    }

    const existingMess = await MessModel.findOne({ _id: id, userId });
    if (!existingMess) {
      return Response.json({ message: "Mess not found" }, { status: 404 });
    }

    const validationError = validateMessInput(body);
    if (validationError) {
      return Response.json({ message: validationError }, { status: 400 });
    }

    const effectiveBillingCycle = body.billingCycle ?? existingMess.billingCycle;
    const effectiveBillingConfig =
      body.billingConfig ?? existingMess.billingConfig;

    const billingError = validateBillingConfig(
      effectiveBillingCycle,
      effectiveBillingConfig
    );
    if (billingError) {
      return Response.json({ message: billingError }, { status: 400 });
    }

    if (body.mealSchedule) {
      const mealError = validateMealSchedule(body.mealSchedule);
      if (mealError) {
        return Response.json({ message: mealError }, { status: 400 });
      }
    }

    const updateData: Partial<IMess> = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.mealSchedule) updateData.mealSchedule = body.mealSchedule;
    if (body.billingCycle) updateData.billingCycle = body.billingCycle;
    if (body.billingConfig) updateData.billingConfig = body.billingConfig;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const updatedMess = await MessModel.findOneAndUpdate(
      { _id: id, userId },
      updateData,
      { new: true, runValidators: true }
    );

    return Response.json({ mess: updatedMess }, { status: 200 });
  } catch (error: unknown) {
    console.error("Error updating mess:", error);

    if (isDuplicateKeyError(error)) {
      return Response.json(
        { message: "A mess with this name already exists" },
        { status: 400 }
      );
    }

    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const session = await auth();
    if (!session?.user?.email) {
      return Response.json({ message: "Unauthorised" }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.email;
    const hardDelete = req.nextUrl.searchParams.get("hard") === "true";

    if (!Types.ObjectId.isValid(id)) {
      return Response.json({ message: "Invalid mess ID" }, { status: 400 });
    }

    if (hardDelete) {
      const deletedMess = await MessModel.findOneAndDelete({ _id: id, userId });
      if (!deletedMess) {
        return Response.json({ message: "Mess not found" }, { status: 404 });
      }

      return Response.json({ message: "Mess deleted permanently" }, { status: 200 });
    }

    const deactivatedMess = await MessModel.findOneAndUpdate(
      { _id: id, userId, isActive: true },
      { isActive: false },
      { new: true }
    );

    if (!deactivatedMess) {
      const existingMess = await MessModel.findOne({ _id: id, userId });
      if (!existingMess) {
        return Response.json({ message: "Mess not found" }, { status: 404 });
      }

      return Response.json(
        { message: "Mess is already deactivated", mess: existingMess },
        { status: 200 }
      );
    }

    return Response.json(
      { message: "Mess deactivated successfully", mess: deactivatedMess },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting mess:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
