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
            <div className="h-6 w-40 bg-white/20 rounded skeleton-shimmer" />
            <MessPricingSkeleton />
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto p-6 space-y-6">
            <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight text-white">
                Mess Pricing
                </h1>
                <p className="text-sm text-gray-400">
                Configure daily mess rates
                </p>
            </div>
            {data && (
                <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 p-5 space-y-2">
                    <p className="text-sm font-medium text-gray-200">
                    Current Pricing
                    </p>

                    <div className="text-sm text-gray-300 space-y-1">
                    <p>Breakfast: ₹{data.breakfast}</p>
                    <p>Lunch: ₹{data.lunch}</p>
                    <p>Dinner: ₹{data.dinner}</p>
                    </div>

                    <p className="text-xs text-gray-400 pt-2">
                    Effective from {data.effectiveFrom}
                    </p>
                </div>
            )}
            <form onSubmit={handleSubmit} className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-5">
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
                className="
                        w-full rounded-xl
                        bg-blue-600
                        py-2
                        text-white
                        font-medium
                        hover:bg-blue-700
                        disabled:opacity-60
                        transition
                    "
                >
                {isLoading ? "Saving..." : "Save Pricing"}
                </button>

                {isSuccess && (
                    <p className="text-sm text-green-400">
                        Pricing updated successfully
                    </p>
                    )}

                    {error && (
                    <p className="text-sm text-red-400">{error.message}</p>
                    )}

                    {saveError && (
                    <p className="text-sm text-red-400">{saveError.message}</p>
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
            <label className="text-xs uppercase tracking-wide text-gray-400">
                {label}
            </label>
            <input
                {...props}
                required
                className="
                w-full rounded-xl
                bg-white/10
                border border-white/10
                px-3 py-2
                text-white
                placeholder-gray-500
                focus:outline-none
                focus:ring-2
                focus:ring-blue-500/50
                transition
                "
            />
        </div>
    );
}