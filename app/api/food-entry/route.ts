import { normalizeMeal } from "@/lib/costCalculate";
import connectDB from "@/lib/db";
import FoodEntryModel from "@/models/foodEntry";
import { FoodEntry } from "@/types/food";
import { NextRequest } from "next/server";
import { isEmpty } from "@/lib/costCalculate";
import { auth } from "@/lib/auth";
import { isValidFoodEntryPayload } from "@/lib/foodEntryValidation";

function serializeMeal(meal: FoodEntry["breakfast"]) {
    return {
        ...meal,
        messId: meal.messId ? String(meal.messId) : undefined,
        mealOptionId: meal.mealOptionId ? String(meal.mealOptionId) : undefined,
    };
}

function serializeEntry(entry: FoodEntry) {
    return {
        ...entry,
        _id: undefined,
        breakfast: serializeMeal(entry.breakfast),
        lunch: serializeMeal(entry.lunch),
        dinner: serializeMeal(entry.dinner),
    };
}

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const session = await auth();
        if (!session?.user?.email) {
            return Response.json({message: "Unauthorised"}, {status: 401})
        }
        const userId = session.user.email
        const body: unknown = await req.json();
        if (!isValidFoodEntryPayload(body)) {
            return Response.json({ message: "Invalid food entry payload" }, { status: 400 });
        }
        
        const breakfast = await normalizeMeal(userId, "breakfast", body.breakfast, body.date);
        const lunch = await normalizeMeal(userId, "lunch", body.lunch, body.date);
        const dinner = await normalizeMeal(userId, "dinner", body.dinner, body.date);

        if (isEmpty(breakfast, lunch, dinner)) {
            const del = await FoodEntryModel.deleteOne({ date: body.date });
            console.log(del);
            return Response.json({Deleted: true})
        }

        const totalCost = breakfast.cost + lunch.cost + dinner.cost;

        const entry = await FoodEntryModel.findOneAndUpdate(
            { date: body.date, userId },
            {
                $set: {
                    breakfast,
                    lunch,
                    dinner,
                    totalCost,
                    userId
                }
            },
            {
                upsert: true,
                new: true,
                runValidators: true
            }
        );

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
        const session = await auth();
        const userId =session?.user?.email
        const date = req.nextUrl.searchParams.get("date");
        if (date) {
            if (!userId) {
                return Response.json(null, {status: 200});
            }
            const entry = await FoodEntryModel.findOne({userId,  date }).lean();
            return Response.json(entry ? serializeEntry(entry) : null);
        }

        const month = req.nextUrl.searchParams.get("month");
        if (!month) {
            return Response.json({message: "Month is required"}, {status: 400})
        }

        if (!userId) {
            return Response.json(
                {
                summary: {
                    messTotal: 0,
                    outsideTotal: 0,
                    grandTotal: 0
                },
                entries: []
                },
                { status: 200 }
            );
        }

        const summary = await FoodEntryModel.aggregate([
        {
            $match: {
                date: { $regex: `^${month}` },
                userId: userId
            }
        },
        {
            $project: {
                messCost: {
                    $sum: [
                        {
                            $cond: [
                                { $in: ["$breakfast.source", ["mess", "mess_regular", "mess_chicken"]] },
                                "$breakfast.cost",
                                0
                            ]
                        },
                        {
                            $cond: [
                                { $in: ["$lunch.source", ["mess", "mess_regular", "mess_chicken"]] },
                                "$lunch.cost",
                                0
                            ]
                        },
                        {
                            $cond: [
                                { $in: ["$dinner.source", ["mess", "mess_regular", "mess_chicken"]] },
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
                }
            }
        },
        {
            $group: {
                _id: null,
                messTotal: { $sum: "$messCost" },
                outsideTotal: { $sum: "$outsideCost" },
                totalCost: { $sum: { $add: ["$messCost", "$outsideCost"] } }
            }
        },
        {
            $project: {
                _id: 0,
                messTotal: 1,
                outsideTotal: 1,
                grandTotal: "$totalCost"
            }
        }
        ]);

        const basicEntries = await FoodEntryModel.find(
        {userId,  date: { $regex: `^${month}` } },
        { _id: 0, date: 1, totalCost: 1, breakfast: 1, lunch: 1, dinner: 1 }
        ).sort({ date: 1 });

        const entries = basicEntries.map((e) => {
        const meals = [e.breakfast, e.lunch, e.dinner];

        return {
            date: e.date,
            totalCost: e.totalCost,
            hasMess: meals.some((m) => ["mess", "mess_regular", "mess_chicken"].includes(m.source)),
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
