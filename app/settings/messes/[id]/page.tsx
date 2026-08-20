"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import MessForm from "@/app/components/MessForm";
import {
  deactivateMess,
  fetchMess,
  fetchMessMealOptions,
  createMessMealOption,
  deactivateMessMealOption,
  updateMessMealOption,
  fetchMealOptionPricing,
  addMealOptionPrice,
  updateMess,
} from "@/lib/api";
import { MessInput } from "@/types/mess";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";

type MealType = "breakfast" | "lunch" | "dinner";

export default function ManageMessPage() {
  const params = useParams<{ id: string }>();
  const messId = params.id;
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: mess, isFetching, error } = useQuery({
    queryKey: ["mess", messId],
    queryFn: () => fetchMess(messId),
    enabled: !!messId,
    staleTime: 5 * 60 * 1000,
  });

  const [optionForm, setOptionForm] = useState({
    meal: "dinner" as MealType,
    name: "",
  });
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [pricingOptionId, setPricingOptionId] = useState<string | null>(null);
  const [priceForm, setPriceForm] = useState({ price: "", effectiveFrom: "" });

  const { data: mealOptions = [], isLoading: areMealOptionsLoading } = useQuery({
    queryKey: ["mess-options", messId],
    queryFn: () => fetchMessMealOptions(messId),
    enabled: !!messId,
    staleTime: 60_000,
  });

  const pricingQuery = useQuery({
    queryKey: ["meal-option-prices", pricingOptionId],
    queryFn: () =>
      pricingOptionId ? fetchMealOptionPricing(pricingOptionId) : Promise.resolve([]),
    enabled: !!pricingOptionId,
    staleTime: 60_000,
  });

  const updateMutation = useMutation({
    mutationFn: (values: Partial<MessInput>) => updateMess(messId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messes"] });
      queryClient.invalidateQueries({ queryKey: ["mess", messId] });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: () => deactivateMess(messId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messes"] });
      router.push("/settings/messes");
    },
  });

  const createOptionMutation = useMutation({
    mutationFn: createMessMealOption,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mess-options", messId] });
      setOptionForm({ meal: "dinner", name: "" });
    },
  });

  const deactivateOptionMutation = useMutation({
    mutationFn: (optionId: string) => deactivateMessMealOption(optionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mess-options", messId] });
      queryClient.invalidateQueries({ queryKey: ["meal-option-prices", pricingOptionId] });
    },
  });

  const editOptionMutation = useMutation({
    mutationFn: ({ optionId, name }: { optionId: string; name: string }) =>
      updateMessMealOption(optionId, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mess-options", messId] });
      setEditingOptionId(null);
      setEditingName("");
    },
  });

  const addPriceMutation = useMutation({
    mutationFn: ({
      optionId,
      price,
      effectiveFrom,
    }: {
      optionId: string;
      price: number;
      effectiveFrom: string;
    }) => addMealOptionPrice(optionId, { price, effectiveFrom }),
    onSuccess: () => {
      setPriceForm({ price: "", effectiveFrom: "" });
      if (pricingOptionId) {
        queryClient.invalidateQueries({
          queryKey: ["meal-option-prices", pricingOptionId],
        });
      }
    },
  });

  const currentOptionMessage =
    createOptionMutation.error instanceof Error
      ? createOptionMutation.error.message
      : null;

  if (isFetching) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !mess) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/settings/messes">
            <IconButton size="sm" variant="ghost" label="Back to messes">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </IconButton>
          </Link>
          <h1 className="text-xl font-bold text-[#F5F7F8]">Manage Mess</h1>
        </div>
        <p className="text-xs text-[#F87171] p-3 rounded-lg bg-[#F87171]/10 border border-[#F87171]/20">
          {error instanceof Error ? error.message : "Mess not found"}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/settings/messes">
          <IconButton size="sm" variant="ghost" label="Back to messes">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </IconButton>
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F5F7F8]">
            {mess.name}
          </h1>
          <p className="text-xs sm:text-sm text-[#9AA3AD] mt-0.5">
            Configure meal schedules, dynamic meal options, and pricing history
          </p>
        </div>
      </div>

      {/* SECTION 1: General & Billing Schedule */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#9AA3AD]">
            General & Billing
          </h2>
        </div>
        <MessForm
          initialValues={{
            name: mess.name,
            mealSchedule: mess.mealSchedule,
            billingCycle: mess.billingCycle,
            billingConfig: mess.billingConfig,
          }}
          submitLabel="Save General Changes"
          onSubmit={(values) => updateMutation.mutate(values)}
          isPending={updateMutation.isPending}
          error={
            updateMutation.error instanceof Error
              ? updateMutation.error.message
              : null
          }
          successMessage={
            updateMutation.isSuccess ? "Mess configuration updated successfully" : null
          }
        />
      </section>

      {/* SECTION 2: Dynamic Meal Options & Pricing */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#9AA3AD]">
            Meal Options & Pricing
          </h2>
          <p className="text-xs text-[#68717C] mt-0.5">
            Dynamic meal choices (e.g. Regular, Chicken, Fish, Biryani) and their effective rates.
          </p>
        </div>

        <div className="rounded-xl bg-[#12161A] border border-white/[0.08] p-5 sm:p-6 space-y-6">
          {areMealOptionsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <div className="space-y-6">
              {(["breakfast", "lunch", "dinner"] as const).map((meal) => {
                const options = mealOptions.filter(
                  (option) => option.meal === meal && option.isActive
                );

                return (
                  <div key={meal} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#2DD4BF]">
                        {meal}
                      </span>
                      <span className="text-[11px] text-[#68717C]">
                        {options.length} {options.length === 1 ? "option" : "options"}
                      </span>
                    </div>

                    {options.length === 0 ? (
                      <p className="text-xs text-[#68717C] py-1">
                        No active options configured for {meal}.
                      </p>
                    ) : (
                      <div className="space-y-2.5">
                        {options.map((option) => {
                          const isEditing = editingOptionId === option._id;
                          const isPricingOpen = pricingOptionId === option._id;

                          return (
                            <div
                              key={option._id}
                              className="rounded-lg border border-white/[0.06] bg-[#171C21] p-3.5 space-y-3"
                            >
                              {isEditing ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    value={editingName}
                                    onChange={(event) =>
                                      setEditingName(event.target.value)
                                    }
                                    className="flex-1 rounded-lg border border-white/10 bg-[#12161A] px-3 py-1.5 text-xs text-[#F5F7F8] focus:border-[#2DD4BF] focus:outline-none"
                                    placeholder="Option name"
                                  />
                                  <Button
                                    size="sm"
                                    variant="primary"
                                    onClick={() => {
                                      const trimmed = editingName.trim();
                                      if (!trimmed) return;
                                      editOptionMutation.mutate({
                                        optionId: option._id,
                                        name: trimmed,
                                      });
                                    }}
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setEditingOptionId(null);
                                      setEditingName("");
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between gap-3">
                                  <span className="text-xs font-medium text-[#F5F7F8]">
                                    {option.name}
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        setEditingOptionId(option._id);
                                        setEditingName(option.name);
                                      }}
                                    >
                                      Edit
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant={isPricingOpen ? "secondary" : "subtle"}
                                      onClick={() =>
                                        setPricingOptionId(
                                          isPricingOpen ? null : option._id
                                        )
                                      }
                                    >
                                      Pricing
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => {
                                        if (
                                          window.confirm(
                                            `Deactivate "${option.name}"? Existing historical records will remain intact.`
                                          )
                                        ) {
                                          deactivateOptionMutation.mutate(option._id);
                                        }
                                      }}
                                    >
                                      Deactivate
                                    </Button>
                                  </div>
                                </div>
                              )}

                              {/* Pricing Timeline & Add Rate Subpanel */}
                              {isPricingOpen && (
                                <div className="rounded-lg border border-white/[0.06] bg-[#0E1216] p-3.5 space-y-3.5 animate-scaleIn">
                                  <div className="flex items-center justify-between text-xs pb-2 border-b border-white/[0.04]">
                                    <span className="text-[#9AA3AD] font-medium">
                                      Effective Pricing History
                                    </span>
                                    <span className="text-[#2DD4BF] font-semibold tabular-nums">
                                      {pricingQuery.data && pricingQuery.data.length > 0
                                        ? `Current: ₹${pricingQuery.data[
                                          pricingQuery.data.length - 1
                                        ].price
                                        }`
                                        : "No pricing set"}
                                    </span>
                                  </div>

                                  <div className="space-y-1.5 text-xs">
                                    {pricingQuery.isLoading ? (
                                      <Skeleton className="h-6 w-full" />
                                    ) : pricingQuery.data &&
                                      pricingQuery.data.length > 0 ? (
                                      pricingQuery.data
                                        .slice()
                                        .sort((a, b) =>
                                          a.effectiveFrom.localeCompare(
                                            b.effectiveFrom
                                          )
                                        )
                                        .map((record) => (
                                          <div
                                            key={record._id}
                                            className="flex items-center justify-between py-1 px-2 rounded bg-white/[0.02] text-[#9AA3AD]"
                                          >
                                            <span>Effective: {record.effectiveFrom}</span>
                                            <span className="font-semibold text-[#F5F7F8] tabular-nums">
                                              ₹{record.price}
                                            </span>
                                          </div>
                                        ))
                                    ) : (
                                      <p className="text-[#68717C]">
                                        No historical price records yet.
                                      </p>
                                    )}
                                  </div>

                                  {/* Add Price Form */}
                                  <div className="pt-2 border-t border-white/[0.04] space-y-2">
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9AA3AD]">
                                      + Add Effective Price
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-[1fr,1fr,auto] gap-2 items-end">
                                      <Input
                                        type="number"
                                        min="0"
                                        step="1"
                                        placeholder="Price (₹)"
                                        value={priceForm.price}
                                        onChange={(event) =>
                                          setPriceForm((prev) => ({
                                            ...prev,
                                            price: event.target.value,
                                          }))
                                        }
                                        leftElement={<span className="text-xs">₹</span>}
                                      />
                                      <Input
                                        type="date"
                                        value={priceForm.effectiveFrom}
                                        onChange={(event) =>
                                          setPriceForm((prev) => ({
                                            ...prev,
                                            effectiveFrom: event.target.value,
                                          }))
                                        }
                                      />
                                      <Button
                                        size="md"
                                        variant="primary"
                                        onClick={() => {
                                          const numeric = Number(priceForm.price);
                                          if (
                                            !priceForm.effectiveFrom ||
                                            !Number.isFinite(numeric) ||
                                            numeric < 0
                                          )
                                            return;
                                          addPriceMutation.mutate({
                                            optionId: option._id,
                                            price: numeric,
                                            effectiveFrom: priceForm.effectiveFrom,
                                          });
                                        }}
                                        disabled={
                                          addPriceMutation.isPending ||
                                          !priceForm.price ||
                                          !priceForm.effectiveFrom
                                        }
                                        isLoading={addPriceMutation.isPending}
                                      >
                                        Add
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Add Meal Option Subform */}
              <div className="rounded-xl border border-dashed border-white/[0.12] bg-[#171C21]/60 p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#F5F7F8]">
                  + Add New Meal Option
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-[140px,1fr] gap-2.5">
                  <Select
                    value={optionForm.meal}
                    onChange={(event) =>
                      setOptionForm((prev) => ({
                        ...prev,
                        meal: event.target.value as MealType,
                      }))
                    }
                  >
                    <option value="breakfast" className="text-black">Breakfast</option>
                    <option value="lunch" className="text-black">Lunch</option>
                    <option value="dinner" className="text-black">Dinner</option>
                  </Select>
                  <Input
                    value={optionForm.name}
                    onChange={(event) =>
                      setOptionForm((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                    placeholder="e.g. Biryani, Fish, Veg Special"
                  />
                </div>
                <Button
                  variant="subtle"
                  size="sm"
                  className="w-full font-medium"
                  onClick={() => {
                    const trimmed = optionForm.name.trim();
                    if (!trimmed) return;
                    createOptionMutation.mutate({
                      messId: messId,
                      meal: optionForm.meal,
                      name: trimmed,
                    });
                  }}
                  disabled={
                    createOptionMutation.isPending || !optionForm.name.trim()
                  }
                  isLoading={createOptionMutation.isPending}
                >
                  Create Option
                </Button>
                {currentOptionMessage && (
                  <p className="text-xs text-[#F87171]">{currentOptionMessage}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 3: Danger Zone */}
      <section className="rounded-xl border border-[#F87171]/20 bg-[#F87171]/5 p-5 space-y-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#F87171]">
            Danger Zone
          </h2>
          <p className="text-xs text-[#9AA3AD] mt-0.5">
            Deactivating this mess removes it from active selectors while preserving all historical food entries, rates, and payments.
          </p>
        </div>
        <div className="pt-1">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (
                window.confirm(
                  `Deactivate "${mess.name}"? Historical entries and bills will be preserved.`
                )
              ) {
                deactivateMutation.mutate();
              }
            }}
            isLoading={deactivateMutation.isPending}
          >
            Deactivate Mess
          </Button>
        </div>
        {deactivateMutation.error instanceof Error && (
          <p className="text-xs text-[#F87171]">
            {deactivateMutation.error.message}
          </p>
        )}
      </section>
    </div>
  );
}
