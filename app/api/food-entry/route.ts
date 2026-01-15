import { normalizeMeal } from "@/lib/costCalculate";
import connectDB from "@/lib/db";
import FoodEntryModel from "@/models/foodEntry";
import { FoodEntry } from "@/types/food";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
    try {
        await connectDB();

        const body = (await req.json()) as Omit<FoodEntry, 'totalCost'>;

        const breakfast = await normalizeMeal("breakfast", body.breakfast, body.date);
        const lunch = await normalizeMeal("lunch", body.lunch, body.date);
        const dinner = await normalizeMeal("dinner", body.dinner, body.date);
        const totalCost = breakfast.cost + lunch.cost + dinner.cost;

        const entry = await FoodEntryModel.findOneAndUpdate({ date: body.date }, { breakfast, lunch, dinner, totalCost }, { upsert: true, new: true });

        return Response.json(entry, {status: 200})
    } catch (error) {
        console.error(error);
        return Response.json(
            { message: "Failed to save food entry" },
            { status: 500 }
        );
    }

}

export async function GET(req: NextRequest) {
    try {
        await connectDB();

        const date = req.nextUrl.searchParams.get("date");
        if (date) {
            const entry = await FoodEntryModel.findOne({ date });
            return Response.json(entry || null);
        }

        const month = req.nextUrl.searchParams.get("month");
        if (!month) {
            return Response.json({message: "Month is required"}, {status: 400})
        }

        const summary = await FoodEntryModel.aggregate([
        {
            $match: {
            date: { $regex: `^${month}` }
            }
        },
        {
            $project: {
            messCost: {
                $sum: [
                {
                    $cond: [
                    { $eq: ["$breakfast.source", "mess"] },
                    "$breakfast.cost",
                    0
                    ]
                },
                {
                    $cond: [
                    { $eq: ["$lunch.source", "mess"] },
                    "$lunch.cost",
                    0
                    ]
                },
                {
                    $cond: [
                    { $eq: ["$dinner.source", "mess"] },
                    "$dinner.cost",
                    0
                    ]
                }
                ]
            },
            outsideCost: {
                $sum: [
                {
                    $cond: [
                    { $eq: ["$breakfast.source", "outside"] },
                    "$breakfast.cost",
                    0
                    ]
                },
                {
                    $cond: [
                    { $eq: ["$lunch.source", "outside"] },
                    "$lunch.cost",
                    0
                    ]
                },
                {
                    $cond: [
                    { $eq: ["$dinner.source", "outside"] },
                    "$dinner.cost",
                    0
                    ]
                }
                ]
            },
            totalCost: 1
            }
        },
        {
            $group: {
            _id: null,
            messTotal: { $sum: "$messCost" },
            outsideTotal: { $sum: "$outsideCost" },
            grandTotal: { $sum: "$totalCost" }
            }
        }
        ]);

        const basicEntries = await FoodEntryModel.find(
        { date: { $regex: `^${month}` } },
        { _id: 0, date: 1, totalCost: 1, breakfast: 1, lunch: 1, dinner: 1 }
        ).sort({ date: 1 });

        const entries = basicEntries.map((e) => {
        const meals = [e.breakfast, e.lunch, e.dinner];

        return {
            date: e.date,
            totalCost: e.totalCost,
            hasMess: meals.some((m) => m.source === "mess"),
            hasOutside: meals.some((m) => m.source === "outside")
        };
        });

        return Response.json(
        {
            summary: summary[0] || {
            messTotal: 0,
            outsideTotal: 0,
            grandTotal: 0
            },
            entries
        },
        { status: 200 }
        );
    } catch (error) {
        console.error(error);
    return Response.json(
        { message: "Failed to fetch food entries" },
        { status: 500 }
        );
    }
}