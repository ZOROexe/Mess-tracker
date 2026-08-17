"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessPricingSkeleton } from "@/app/components/Skeletons";
import { fetchMesses, getMessPrice, saveMessPirce } from "@/lib/api";

export default function MessPricingPage() {
    const [messId, setMessId] = useState("");

    const [form, setForm] = useState({
        breakfast: "",
        lunch_regular: "",
        lunch_chicken: "",
        dinner_regular: "",
        dinner_chicken: "",
        effectiveFrom: ""
    });
    const queryClient = useQueryClient();

    const { data: messes = [], isLoading: areMessesLoading, error: messesError } = useQuery({
        queryKey: ["messes"],
        queryFn: () => fetchMesses(),
        staleTime: 60_000,
    });

    const { data, isLoading: isPricingLoading, isFetching, error } = useQuery({
        queryKey: ['mess-price', messId],
        queryFn: () => getMessPrice(messId),
        enabled: Boolean(messId),
        staleTime: 1000000,
    })

    const { mutate, isSuccess, isPending, error: saveError } = useMutation({
        mutationFn: saveMessPirce,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['mess-price', messId]
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
            messId,
            breakfast: Number(form.breakfast),
            lunch_regular: Number(form.lunch_regular),
            lunch_chicken: Number(form.lunch_chicken),
            dinner_regular: Number(form.dinner_regular),
            dinner_chicken: Number(form.dinner_chicken),
            effectiveFrom: form.effectiveFrom
        };
        mutate(payload);
        setForm({
            breakfast: "",
            lunch_regular: "",
            lunch_chicken: "",
            dinner_regular: "",
            dinner_chicken: "",
            effectiveFrom: ""
        });
    }

    if (areMessesLoading) {
        return (
            <div className="max-w-md mx-auto p-6 space-y-6">
            <div className="h-6 w-40 bg-white/20 rounded skeleton-shimmer" />
            <MessPricingSkeleton />
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold tracking-tight text-white">
                    Mess Pricing
                    </h1>
                    <p className="text-sm text-gray-400">
                    Configure daily mess rates
                    </p>
                </div>
                <Link
                    href="/settings/messes"
                    className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 transition"
                >
                    Messes
                </Link>
            </div>
            <div className="space-y-1">
                <label htmlFor="mess" className="text-sm font-medium text-gray-200">Mess</label>
                <select
                    id="mess"
                    value={messId}
                    onChange={(event) => setMessId(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                    <option value="" className="text-black">Select a mess</option>
                    {messes.map((mess) => (
                        <option key={mess._id} value={mess._id} className="text-black">{mess.name}</option>
                    ))}
                </select>
                {messes.length === 0 && <p className="text-sm text-gray-400">Create a mess before configuring pricing.</p>}
                {messesError && <p className="text-sm text-red-400">{messesError.message}</p>}
            </div>
            {messId && isFetching && <MessPricingSkeleton />}
            {data && (
                <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 p-5 space-y-2">
                    <p className="text-sm font-medium text-gray-200">
                    Current Pricing
                    </p>

                    <div className="text-sm text-gray-300 space-y-1">
                    <p>Breakfast: ₹{data.breakfast}</p>
                    <p>Lunch Regular: ₹{data.lunch_regular}</p>
                    <p>Lunch Chicken: ₹{data.lunch_chicken}</p>
                    <p>Dinner Regular: ₹{data.dinner_regular}</p>
                    <p>Dinner Chicken: ₹{data.dinner_chicken}</p>
                    </div>

                    <p className="text-xs text-gray-400 pt-2">
                    Effective from {data.effectiveFrom}
                    </p>
                </div>
            )}
            {messId && <form onSubmit={handleSubmit} className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-5">
                <Input
                label="Breakfast Price"
                name="breakfast"
                value={form.breakfast}
                onChange={handleChange}
                />

                <Input
                label="Lunch Regular Price"
                name="lunch_regular"
                value={form.lunch_regular}
                onChange={handleChange}
                />

                <Input
                label="Lunch Chicken Price"
                name="lunch_chicken"
                value={form.lunch_chicken}
                onChange={handleChange}
                />

                <Input
                label="Dinner Regular Price"
                name="dinner_regular"
                value={form.dinner_regular}
                onChange={handleChange}
                />

                <Input
                label="Dinner Chicken Price"
                name="dinner_chicken"
                value={form.dinner_chicken}
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
                {isPricingLoading || isPending ? "Saving..." : "Save Pricing"}
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
            }
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
