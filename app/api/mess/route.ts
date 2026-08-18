import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import {
  isDuplicateKeyError,
  validateMessInput,
  type MessInput,
} from "@/lib/messValidation";
import MessModel, { BillingConfig } from "@/models/mess";
import { NextRequest } from "next/server";

type CreateMessRequest = MessInput;

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const session = await auth();
    if (!session?.user?.email) {
      return Response.json({ message: "Unauthorised" }, { status: 401 });
    }

    const userId = session.user.email;
    const includeInactive =
      req.nextUrl.searchParams.get("includeInactive") === "true";

    const filter: { userId: string; isActive?: boolean } = { userId };
    if (!includeInactive) {
      filter.isActive = true;
    }

    const messes = await MessModel.find(filter).sort({ createdAt: 1 });

    return Response.json({ messes }, { status: 200 });
  } catch (error) {
    console.error("Error fetching messes:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const session = await auth();
    if (!session?.user?.email) {
      return Response.json({ message: "Unauthorised" }, { status: 401 });
    }

    const userId = session.user.email;
    const body: CreateMessRequest = await req.json();

    const validationError = validateMessInput(body);
    if (validationError) {
      return Response.json({ message: validationError }, { status: 400 });
    }

    const billingConfig: BillingConfig = body.billingConfig ?? {};

    const newMess = new MessModel({
      userId,
      name: body.name.trim(),
      mealSchedule: body.mealSchedule,
      billingCycle: body.billingCycle,
      billingConfig,
      isActive: true,
    });

    await newMess.save();
    return Response.json({ mess: newMess }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating mess:", error);

    if (isDuplicateKeyError(error)) {
      return Response.json(
        { message: "A mess with this name already exists" },
        { status: 400 }
      );
    }

    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
