"use client";

import { useEffect, useState } from "react";

export default function MessPricingPage() {

    interface MealPrice {
        breakfast: number;
        lunch: number;
        dinner: number;
        effectiveFrom: string;
    }

    const [currentPricing, setCurrentPricing] = useState<MealPrice | null>(null);
    const [form, setForm] = useState({
        breakfast: "",
        lunch: "",
        dinner: "",
        effectiveFrom: ""
    });

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    async function fetchData() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/price-entry");
            if (!res.ok) {
                throw new Error("Cannot fetch data!");
            }
            const data = await res.json();
            setCurrentPricing(data);
        } catch (error) {
            setError("Could not load food entry");
            console.error(error);
        } finally {
            setLoading(false);
        }
    }
    
    useEffect(() => {
        fetchData();
    }, [])

    function handleChange(
        e: React.ChangeEvent<HTMLInputElement>
    ) {
        setForm((prev) => ({
        ...prev,
        [e.target.name]: e.target.value
        }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
        const res = await fetch("/api/price-entry", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
            breakfast: Number(form.breakfast),
            lunch: Number(form.lunch),
            dinner: Number(form.dinner),
            effectiveFrom: form.effectiveFrom
            })
        });

        if (!res.ok) {
            throw new Error("Failed to save pricing");
        }

        setSuccess(true);
        setForm({
            breakfast: "",
            lunch: "",
            dinner: "",
            effectiveFrom: ""
        });
        fetchData();
        } catch (err) {
        setError("Something went wrong. Try again.");
        } finally {
        setLoading(false);
        }
    }

    return (
        <div className="max-w-md mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-semibold">
            Mess Pricing Settings
        </h1>
        {currentPricing && (
            <div className="rounded-lg border p-4 bg-gray-50 space-y-1 text-black">
                <p className="font-medium">Current Pricing</p>
                <p>Breakfast: ₹{currentPricing.breakfast}</p>
                <p>Lunch: ₹{currentPricing.lunch}</p>
                <p>Dinner: ₹{currentPricing.dinner}</p>
                <p className="text-sm text-gray-500">
                    Effective from: {currentPricing.effectiveFrom}
                </p>
            </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input
            label="Breakfast Price"
            name="breakfast"
            value={form.breakfast}
            onChange={handleChange}
            />

            <Input
            label="Lunch Price"
            name="lunch"
            value={form.lunch}
            onChange={handleChange}
            />

            <Input
            label="Dinner Price"
            name="dinner"
            value={form.dinner}
            onChange={handleChange}
            />

            <Input
            label="Effective From"
            name="effectiveFrom"
            type="date"
            value={form.effectiveFrom}
            onChange={handleChange}
            />

            <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-2 rounded"
            >
            {loading ? "Saving..." : "Save Pricing"}
            </button>

            {success && (
            <p className="text-green-600 text-sm">
                Pricing saved successfully
            </p>
            )}

            {error && (
            <p className="text-red-600 text-sm">{error}</p>
            )}
        </form>
        </div>
    );
    }

    function Input({
    label,
    ...props
    }: React.InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    }) {
    return (
        <div className="space-y-1">
        <label className="text-sm font-medium">{label}</label>
        <input
            {...props}
            required
            className="w-full border rounded px-3 py-2"
        />
        </div>
    );
}