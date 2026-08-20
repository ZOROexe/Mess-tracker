"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessPricingSkeleton } from "@/app/components/Skeletons";
import { fetchMesses, getMessPrice, saveMessPirce } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

export default function MessPricingPage() {
  const [messId, setMessId] = useState("");

  const [form, setForm] = useState({
    breakfast: "",
    lunch_regular: "",
    lunch_chicken: "",
    dinner_regular: "",
    dinner_chicken: "",
    effectiveFrom: "",
  });
  const queryClient = useQueryClient();

  const {
    data: messes = [],
    isLoading: areMessesLoading,
    error: messesError,
  } = useQuery({
    queryKey: ["messes"],
    queryFn: () => fetchMesses(),
    staleTime: 60_000,
  });

  const {
    data,
    isLoading: isPricingLoading,
    isFetching,
    error,
  } = useQuery({
    queryKey: ["mess-price", messId],
    queryFn: () => getMessPrice(messId),
    enabled: Boolean(messId),
    staleTime: 1000000,
  });

  const {
    mutate,
    isSuccess,
    isPending,
    error: saveError,
  } = useMutation({
    mutationFn: saveMessPirce,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["mess-price", messId],
      });
      setForm({
        breakfast: "",
        lunch_regular: "",
        lunch_chicken: "",
        dinner_regular: "",
        dinner_chicken: "",
        effectiveFrom: "",
      });
    },
    onError: (err) => {
      console.error("Save failed:", err);
    },
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      messId,
      breakfast: Number(form.breakfast),
      lunch_regular: Number(form.lunch_regular),
      lunch_chicken: Number(form.lunch_chicken),
      dinner_regular: Number(form.dinner_regular),
      dinner_chicken: Number(form.dinner_chicken),
      effectiveFrom: form.effectiveFrom,
    };
    mutate(payload);
  }

  if (areMessesLoading) {
    return <MessPricingSkeleton />;
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F5F7F8]">
            Fixed Mess Pricing
          </h1>
          <p className="text-xs sm:text-sm text-[#9AA3AD] mt-0.5">
            Configure standard meal rates with effective dates
          </p>
        </div>
        <Link href="/settings/messes">
          <Button variant="subtle" size="sm">
            Manage Messes
          </Button>
        </Link>
      </div>

      {/* Mess Selector */}
      <div className="space-y-1.5">
        <Select
          label="Select Mess"
          id="mess"
          value={messId}
          onChange={(event) => setMessId(event.target.value)}
        >
          <option value="" className="text-black">
            Choose a mess to configure
          </option>
          {messes.map((mess) => (
            <option key={mess._id} value={mess._id} className="text-black">
              {mess.name}
            </option>
          ))}
        </Select>
        {messes.length === 0 && (
          <p className="text-xs text-[#9AA3AD]">
            Create a mess before configuring pricing.
          </p>
        )}
        {messesError && (
          <p className="text-xs text-[#F87171]">{messesError.message}</p>
        )}
      </div>

      {messId && isFetching && <MessPricingSkeleton />}

      {/* Current Pricing Card */}
      {data && (
        <Card variant="elevated" className="space-y-2">
          <CardHeader>
            <CardTitle>Current Rates</CardTitle>
            <p className="text-xs text-[#68717C]">
              Effective since {data.effectiveFrom}
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs text-[#9AA3AD]">
              <div className="p-2 rounded bg-white/[0.02]">
                <p className="text-[10px] uppercase tracking-wider text-[#68717C]">Breakfast</p>
                <p className="text-sm font-semibold text-[#F5F7F8] tabular-nums">₹{data.breakfast}</p>
              </div>
              <div className="p-2 rounded bg-white/[0.02]">
                <p className="text-[10px] uppercase tracking-wider text-[#68717C]">Lunch (Reg)</p>
                <p className="text-sm font-semibold text-[#F5F7F8] tabular-nums">₹{data.lunch_regular}</p>
              </div>
              <div className="p-2 rounded bg-white/[0.02]">
                <p className="text-[10px] uppercase tracking-wider text-[#68717C]">Lunch (Chk)</p>
                <p className="text-sm font-semibold text-[#F5F7F8] tabular-nums">₹{data.lunch_chicken}</p>
              </div>
              <div className="p-2 rounded bg-white/[0.02]">
                <p className="text-[10px] uppercase tracking-wider text-[#68717C]">Dinner (Reg)</p>
                <p className="text-sm font-semibold text-[#F5F7F8] tabular-nums">₹{data.dinner_regular}</p>
              </div>
              <div className="p-2 rounded bg-white/[0.02]">
                <p className="text-[10px] uppercase tracking-wider text-[#68717C]">Dinner (Chk)</p>
                <p className="text-sm font-semibold text-[#F5F7F8] tabular-nums">₹{data.dinner_chicken}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pricing Form */}
      {messId && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl bg-[#12161A] border border-white/[0.08] p-5 sm:p-6 space-y-4"
        >
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#9AA3AD]">
            Update Rates
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Breakfast Price"
              name="breakfast"
              type="number"
              min="0"
              required
              value={form.breakfast}
              onChange={handleChange}
              leftElement={<span className="text-xs">₹</span>}
            />
            <Input
              label="Lunch Regular Price"
              name="lunch_regular"
              type="number"
              min="0"
              required
              value={form.lunch_regular}
              onChange={handleChange}
              leftElement={<span className="text-xs">₹</span>}
            />
            <Input
              label="Lunch Chicken Price"
              name="lunch_chicken"
              type="number"
              min="0"
              required
              value={form.lunch_chicken}
              onChange={handleChange}
              leftElement={<span className="text-xs">₹</span>}
            />
            <Input
              label="Dinner Regular Price"
              name="dinner_regular"
              type="number"
              min="0"
              required
              value={form.dinner_regular}
              onChange={handleChange}
              leftElement={<span className="text-xs">₹</span>}
            />
            <Input
              label="Dinner Chicken Price"
              name="dinner_chicken"
              type="number"
              min="0"
              required
              value={form.dinner_chicken}
              onChange={handleChange}
              leftElement={<span className="text-xs">₹</span>}
            />
            <Input
              label="Effective From"
              name="effectiveFrom"
              type="date"
              required
              value={form.effectiveFrom}
              onChange={handleChange}
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full font-semibold"
              disabled={isPending || isPricingLoading}
              isLoading={isPending}
            >
              {isPending ? "Saving..." : "Save Pricing Rates"}
            </Button>
          </div>

          {isSuccess && (
            <p className="text-xs text-[#2DD4BF] bg-[#2DD4BF]/10 p-3 rounded-lg border border-[#2DD4BF]/20">
              Pricing updated successfully
            </p>
          )}
          {error && (
            <p className="text-xs text-[#F87171] bg-[#F87171]/10 p-3 rounded-lg border border-[#F87171]/20">
              {error.message}
            </p>
          )}
          {saveError && (
            <p className="text-xs text-[#F87171] bg-[#F87171]/10 p-3 rounded-lg border border-[#F87171]/20">
              {saveError.message}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
