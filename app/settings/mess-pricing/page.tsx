"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessPricingSkeleton } from "@/app/components/Skeletons";
import { getMessPrice ,saveMessPirce} from "@/lib/api";
import { MealPrice } from "@/types/food";

export default function MessPricingPage() {

    const [form, setForm] = useState({
        breakfast: "",
        lunch: "",
        dinner: "",
        effectiveFrom: ""
    });
    const queryClient = useQueryClient();

    const { data, isLoading, isFetching, error } = useQuery({
        queryKey: ['mess-price'],
        queryFn: getMessPrice,
        initialData: () => {
            return queryClient.getQueryData(["mess-price"])
        },
        staleTime: 1000000,
    })

    const { mutate, isSuccess, isPending, error: saveError } = useMutation({
        mutationFn: saveMessPirce,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['mess-price']
            })
        },
        onError: (err) => {
            console.error("Save failed:", err);
        },
    })

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
        const payload = {
            breakfast: Number(form.breakfast),
            lunch: Number(form.lunch),
            dinner: Number(form.dinner),
            effectiveFrom: form.effectiveFrom
        };
        mutate(payload);
        setForm({
            breakfast: "",
            lunch: "",
            dinner: "",
            effectiveFrom: ""
        });
    }

    if (isFetching) {
        return (
            <div className="max-w-md mx-auto p-6 space-y-6">
                <h1 className="text-2xl font-semibold">
                    Mess Pricing Settings
                </h1>
                <MessPricingSkeleton/>
            </div>
        )
    }

    return (
        <div className="max-w-md mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-semibold">
            Mess Pricing Settings
        </h1>
        {data && (
            <div className="rounded-lg border p-4 bg-gray-50 space-y-1 text-black">
                <p className="font-medium">Current Pricing</p>
                <p>Breakfast: ₹{data.breakfast}</p>
                <p>Lunch: ₹{data.lunch}</p>
                <p>Dinner: ₹{data.dinner}</p>
                <p className="text-sm text-gray-500">
                    Effective from: {data.effectiveFrom}
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
            disabled={isPending}
            className="w-full bg-black text-white py-2 rounded"
            >
            {isLoading ? "Saving..." : "Save Pricing"}
            </button>

            {isSuccess && (
            <p className="text-green-600 text-sm">
                Pricing saved successfully
            </p>
            )}

            {error && (
                <p className="text-red-600 text-sm">{error.message}</p>
            )}
            {saveError && (
                <p className="text-red-600 text-sm">{saveError.message}</p>
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