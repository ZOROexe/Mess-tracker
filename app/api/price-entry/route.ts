import connectDB from "@/lib/db";
import MessPriceModel from "@/models/messPricing";
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
    try {
        await connectDB();

        const session = await auth();
        if (!session?.user?.email) {
            return Response.json(null, { status: 200 });
        }

        const userId = session.user.email;

        const pricing = await MessPriceModel.findOne({ userId }).sort({ effectiveFrom: -1, createdAt: -1 }).lean();

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
        const { breakfast, lunch, dinner, effectiveFrom } = body;

        if (!breakfast || !lunch || !dinner || !effectiveFrom) {
            return Response.json({ message: "All fields are required" }, { status: 400 });
        }

        const pricing = await MessPriceModel.create({
            breakfast,
            lunch,
            dinner,
            effectiveFrom,
            userId
        });
        return Response.json(pricing, { status: 201 });
    } catch (error) {
        return Response.json(
            { message: "Failed to create mess pricing" },
            { status: 500 }
        );
    }
}