import connectDB from "@/lib/db";
import MessPriceModel from "@/models/messPricing";
import MessModel from "@/models/mess";
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import mongoose from "mongoose";

async function getOwnedMess(userId: string, messId: string) {
    if (!mongoose.isValidObjectId(messId)) return null;
    return MessModel.findOne({ _id: messId, userId }).lean();
}

export async function GET(req: NextRequest) {
    try {
        await connectDB();

        const session = await auth();
        if (!session?.user?.email) {
            return Response.json(null, { status: 200 });
        }

        const userId = session.user.email;
        const messId = req.nextUrl.searchParams.get("messId");
        if (!messId) {
            return Response.json({ message: "messId is required" }, { status: 400 });
        }
        if (!await getOwnedMess(userId, messId)) {
            return Response.json({ message: "Mess not found" }, { status: 404 });
        }

        const pricing = await MessPriceModel.findOne({ userId, messId })
            .sort({ effectiveFrom: -1, createdAt: -1 })
            .lean();

        return Response.json(pricing || null, { status: 200 });
    } catch (error) {
        console.error(error);
        return Response.json(
            { message: "Failed to fetch mess pricing" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const session = await auth();
        if (!session?.user?.email) {
            return Response.json({message: "Unauthorised"}, {status: 401})
        }
        const userId = session.user.email;
        const body = await req.json();
        const { messId, breakfast, lunch_regular, lunch_chicken, dinner_regular, dinner_chicken, effectiveFrom } = body;

        if (!messId || [breakfast, lunch_regular, lunch_chicken, dinner_regular, dinner_chicken]
            .some((value) => typeof value !== "number" || value < 0) || !effectiveFrom) {
            return Response.json({ message: "All fields are required" }, { status: 400 });
        }
        if (!await getOwnedMess(userId, messId)) {
            return Response.json({ message: "Mess not found" }, { status: 404 });
        }

        const pricing = await MessPriceModel.create({
            breakfast,
            lunch_regular,
            lunch_chicken,
            dinner_regular,
            dinner_chicken,
            effectiveFrom,
            userId,
            messId,
        });
        return Response.json(pricing, { status: 201 });
    } catch (error) {
        console.log("error", error)
        return Response.json(
            { message: "Failed to create mess pricing" },
            { status: 500 }
        );
    }
}
