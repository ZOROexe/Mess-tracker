import { MealState, MealPrice } from "@/types/food";
import { CalculatedMessBill, MessPaymentInput } from "@/types/billing";
import { MonthlyAnalytics } from "@/types/analytics";
import { Mess, MessInput } from "@/types/mess";

async function parseErrorResponse(res: Response, fallback: string) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || fallback);
}

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
            const data = await res.json();
            throw new Error(`Failed to fetch monthly data: ${data.message}`);
        }
        return res.json();
    } catch (error) {
        throw new Error(`Error Fetching Monthly Data${error}`);
    }
}

export async function fetchMonthlyAnalytics(month: string): Promise<MonthlyAnalytics> {
    const res = await fetch(`/api/analytics?month=${encodeURIComponent(month)}`);
    if (!res.ok) {
        await parseErrorResponse(res, "Failed to fetch analytics");
    }
    return res.json();
}

export async function FetchDailyFood(date: string) {
    try {
        const res = await fetch(`/api/food-entry?date=${date}`);
        if (!res.ok) {
            const data = await res.json();
            throw new Error(`Failed to fetch daily data: ${data.message}`);
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

export async function getMessPrice(messId: string) {
    try {
        const res = await fetch(`/api/price-entry?messId=${encodeURIComponent(messId)}`);
        if (!res.ok) {
            throw new Error("Failed to fetch daily data");
        }
        return res.json();
    } catch (error) {
        throw new Error(`Error Fetching Mess Prices ${error}`);
    }
}

export async function saveMessPirce(payload: MealPrice & { messId: string }) {
    try {
        const res = await fetch("/api/price-entry", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const data = await res.json();
            console.log("payload:",payload)
            throw new Error(`Failed to Save daily data: ${data?.message}`);
        }
        return res.json();
    } catch (error) {
        throw new Error(`Error Saving Mess Prices ${error}`);
    }
}

export async function fetchMesses(includeInactive = false): Promise<Mess[]> {
    const params = includeInactive ? "?includeInactive=true" : "";
    const res = await fetch(`/api/mess${params}`);
    if (!res.ok) {
        await parseErrorResponse(res, "Failed to fetch messes");
    }
    const data = await res.json();
    return data.messes;
}

export async function fetchMess(id: string): Promise<Mess> {
    const res = await fetch(`/api/mess/${id}`);
    if (!res.ok) {
        await parseErrorResponse(res, "Failed to fetch mess");
    }
    const data = await res.json();
    return data.mess;
}

export async function createMess(payload: MessInput): Promise<Mess> {
    const res = await fetch("/api/mess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        await parseErrorResponse(res, "Failed to create mess");
    }
    const data = await res.json();
    return data.mess;
}

export async function updateMess(id: string, payload: Partial<MessInput>): Promise<Mess> {
    const res = await fetch(`/api/mess/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        await parseErrorResponse(res, "Failed to update mess");
    }
    const data = await res.json();
    return data.mess;
}

export async function deactivateMess(id: string): Promise<void> {
    const res = await fetch(`/api/mess/${id}`, { method: "DELETE" });
    if (!res.ok) {
        await parseErrorResponse(res, "Failed to deactivate mess");
    }
}

export async function fetchMessBill(messId: string, date: string): Promise<CalculatedMessBill> {
    const res = await fetch(`/api/mess/${messId}/bill?date=${encodeURIComponent(date)}`);
    if (!res.ok) {
        await parseErrorResponse(res, "Failed to calculate mess bill");
    }
    const data = await res.json();
    return data.bill;
}

export async function fetchMessPayments(messId: string) {
    const res = await fetch(`/api/mess/${messId}/payments`);
    if (!res.ok) {
        await parseErrorResponse(res, "Failed to fetch mess payments");
    }
    const data = await res.json();
    return data.payments;
}

export async function createMessPayment(messId: string, payload: MessPaymentInput) {
    const res = await fetch(`/api/mess/${messId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        await parseErrorResponse(res, "Failed to add payment");
    }
    const data = await res.json();
    return data.payment;
}

export type MessMealOption = {
    _id: string;
    userId: string;
    messId: string;
    meal: "breakfast" | "lunch" | "dinner";
    name: string;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
};

export async function fetchMessMealOptions(messId: string): Promise<MessMealOption[]> {
    const res = await fetch(`/api/mess-options?messId=${encodeURIComponent(messId)}`);
    if (!res.ok) {
        await parseErrorResponse(res, "Failed to fetch meal options");
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
}

export async function createMessMealOption(payload: { messId: string; meal: "breakfast" | "lunch" | "dinner"; name: string; isActive?: boolean; }): Promise<MessMealOption> {
    const res = await fetch("/api/mess-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        await parseErrorResponse(res, "Failed to create meal option");
    }
    return res.json();
}

export async function updateMessMealOption(optionId: string, payload: { name?: string; isActive?: boolean }): Promise<MessMealOption> {
    const res = await fetch(`/api/mess-options/${optionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        await parseErrorResponse(res, "Failed to update meal option");
    }
    return res.json();
}

export async function deactivateMessMealOption(optionId: string): Promise<MessMealOption> {
    const res = await fetch(`/api/mess-options/${optionId}`, {
        method: "DELETE",
    });
    if (!res.ok) {
        await parseErrorResponse(res, "Failed to deactivate meal option");
    }
    return res.json();
}

export async function fetchMealOption(optionId: string): Promise<MessMealOption> {
    const res = await fetch(`/api/mess-options/${optionId}`);
    if (!res.ok) {
        await parseErrorResponse(res, "Failed to fetch meal option");
    }
    return res.json();
}

export async function fetchMealOptionPricing(optionId: string): Promise<Array<{ _id: string; price: number; effectiveFrom: string }>> {
    const res = await fetch(`/api/mess-options/${optionId}/pricing`);
    if (!res.ok) {
        await parseErrorResponse(res, "Failed to fetch meal option pricing");
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
}

export async function addMealOptionPrice(optionId: string, payload: { price: number; effectiveFrom: string }) {
    const res = await fetch(`/api/mess-options/${optionId}/pricing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        await parseErrorResponse(res, "Failed to add meal option price");
    }
    return res.json();
}
