import connectDB from "@/lib/db";
import MessPriceModel from "@/models/messPricing";
import { NextRequest } from "next/server";

export async function GET() {
    try {
        await connectDB();

        const pricing = await MessPriceModel.findOne().sort({ effectiveFrom: -1, createdAt: -1 }).lean();
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

        const body = await req.json();
        const { breakfast, lunch, dinner, effectiveFrom } = body;

        if (!breakfast || !lunch || !dinner || !effectiveFrom) {
            return Response.json({ message: "All fields are required" }, { status: 400 });
        }

        const pricing = await MessPriceModel.create({
            breakfast,
            lunch,
            dinner,
            effectiveFrom
        });
        return Response.json(pricing, { status: 201 });
    } catch (error) {
        return Response.json(
            { message: "Failed to create mess pricing" },
            { status: 500 }
        );
    }
}