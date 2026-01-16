import { MealState } from "@/types/food";

interface Payload {
    date: string,
    breakfast: MealState,
    lunch: MealState,
    dinner: MealState
}
export async function FetchMonthlyFood(month: string) {
    try {
        const res = await fetch(`/api/food-entry?month=${month}`);
        if (!res.ok) {
            throw new Error("Failed to fetch monthly data");
        }
        return res.json();
    } catch (error) {
        throw new Error(`Error Fetching Monthly Data${error}`);
    }
}

export async function FetchDailyFood(date: string) {
    try {
        const res = await fetch(`/api/food-entry?date=${date}`);
        if (!res.ok) {
            throw new Error("Failed to fetch daily data");
        }
        return res.json();
    } catch (error) {
        throw new Error(`Error Fetching Daily Data${error}`);
    }
}

export async function saveFoodEntry(payload: Payload) {
    try {
        const res = await fetch("/api/food-entry", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("Failed to save entry");
        return res.json();
    } catch (error) {
        throw new Error(`Error Posting Daily Data${error}`);
    }
}