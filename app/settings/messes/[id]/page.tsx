"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import MessForm from "@/app/components/MessForm";
import PageHeader from "@/app/components/Header";
import { MessFormSkeleton } from "@/app/components/Skeletons";
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
    mutationFn: ({ optionId, price, effectiveFrom }: { optionId: string; price: number; effectiveFrom: string }) =>
      addMealOptionPrice(optionId, { price, effectiveFrom }),
    onSuccess: () => {
      setPriceForm({ price: "", effectiveFrom: "" });
      if (pricingOptionId) {
        queryClient.invalidateQueries({ queryKey: ["meal-option-prices", pricingOptionId] });
      }
    },
  });

  const currentOptionMessage =
    createOptionMutation.error instanceof Error ? createOptionMutation.error.message : null;

  if (isFetching) {
    return <MessFormSkeleton />;
  }

  if (error || !mess) {
    return (
      <div className="max-w-md mx-auto p-6 space-y-4">
        <PageHeader
          title="Manage Mess"
          actions={[{ label: "Back", href: "/settings/messes" }]}
        />
        <p className="text-sm text-red-400">
          {error instanceof Error ? error.message : "Mess not found"}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <PageHeader
        title={mess.name}
        subtitle="Update meal schedule and billing"
        actions={[{ label: "Back", href: "/settings/messes" }]}
      />

      <MessForm
        initialValues={{
          name: mess.name,
          mealSchedule: mess.mealSchedule,
          billingCycle: mess.billingCycle,
          billingConfig: mess.billingConfig,
        }}
        submitLabel="Save Changes"
        onSubmit={(values) => updateMutation.mutate(values)}
        isPending={updateMutation.isPending}
        error={updateMutation.error instanceof Error ? updateMutation.error.message : null}
        successMessage={updateMutation.isSuccess ? "Mess updated successfully" : null}
      />

      <div className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-5">
        <div className="space-y-1">
          <h3 className="text-lg font-medium text-white">Meal Options</h3>
          <p className="text-xs text-gray-400">
            Manage reusable options for this mess without changing historical entries.
          </p>
        </div>

        {areMealOptionsLoading ? (
          <div className="space-y-3">
            <div className="h-10 bg-white/10 rounded-xl skeleton-shimmer" />
            <div className="h-10 bg-white/10 rounded-xl skeleton-shimmer" />
            <div className="h-10 bg-white/10 rounded-xl skeleton-shimmer" />
          </div>
        ) : (
          <div className="space-y-4">
            {(["breakfast", "lunch", "dinner"] as const).map((meal) => {
              const options = mealOptions.filter(
                (option) => option.meal === meal && option.isActive
              );

              return (
                <div key={meal} className="space-y-2">
                  <p className="text-sm font-medium uppercase tracking-wide text-gray-300">
                    {meal}
                  </p>

                  {options.length === 0 ? (
                    <p className="text-xs text-gray-400">No active options</p>
                  ) : (
                    <div className="space-y-2">
                      {options.map((option) => {
                        const isEditing = editingOptionId === option._id;
                        const isPricingOpen = pricingOptionId === option._id;

                        return (
                          <div
                            key={option._id}
                            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 space-y-2"
                          >
                            {isEditing ? (
                              <div className="flex gap-2">
                                <input
                                  value={editingName}
                                  onChange={(event) => setEditingName(event.target.value)}
                                  className="flex-1 rounded-lg border border-white/10 bg-white/10 px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const trimmed = editingName.trim();
                                    if (!trimmed) return;
                                    editOptionMutation.mutate({
                                      optionId: option._id,
                                      name: trimmed,
                                    });
                                  }}
                                  className="rounded-lg bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700 transition"
                                >
                                  Save
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-sm text-gray-200">{option.name}</span>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingOptionId(option._id);
                                      setEditingName(option.name);
                                    }}
                                    className="rounded-lg border border-white/10 px-2 py-1 text-xs text-gray-200 hover:bg-white/5 transition"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setPricingOptionId(isPricingOpen ? null : option._id)}
                                    className="rounded-lg border border-white/10 px-2 py-1 text-xs text-gray-200 hover:bg-white/5 transition"
                                  >
                                    Pricing
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (
                                        window.confirm(
                                          `Deactivate "${option.name}"? This will keep historical entries intact.`
                                        )
                                      ) {
                                        deactivateOptionMutation.mutate(option._id);
                                      }
                                    }}
                                    className="rounded-lg border border-red-500/30 px-2 py-1 text-xs text-red-300 hover:bg-red-500/10 transition"
                                  >
                                    Deactivate
                                  </button>
                                </div>
                              </div>
                            )}

                            {isPricingOpen && (
                              <div className="rounded-lg border border-white/10 bg-black/10 p-2 space-y-3">
                                <div className="flex items-center justify-between text-xs text-gray-300">
                                  <span>Current price</span>
                                  <span>
                                    {pricingQuery.data && pricingQuery.data.length > 0
                                      ? `₹${pricingQuery.data[pricingQuery.data.length - 1].price}`
                                      : "No pricing"}
                                  </span>
                                </div>

                                <div className="space-y-2 text-xs text-gray-300">
                                  {pricingQuery.isLoading ? (
                                    <div className="h-6 bg-white/10 rounded skeleton-shimmer" />
                                  ) : pricingQuery.data && pricingQuery.data.length > 0 ? (
                                    pricingQuery.data
                                      .slice()
                                      .sort((a, b) =>
                                        a.effectiveFrom.localeCompare(b.effectiveFrom)
                                      )
                                      .map((record) => (
                                        <div
                                          key={record._id}
                                          className="flex justify-between gap-2 border-b border-white/5 pb-1 last:border-b-0 last:pb-0"
                                        >
                                          <span>{record.effectiveFrom}</span>
                                          <span>₹{record.price}</span>
                                        </div>
                                      ))
                                  ) : (
                                    <p className="text-gray-400">No pricing history yet.</p>
                                  )}
                                </div>

                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr,140px]">
                                  <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={priceForm.price}
                                    onChange={(event) =>
                                      setPriceForm((prev) => ({
                                        ...prev,
                                        price: event.target.value,
                                      }))
                                    }
                                    placeholder="Price"
                                    className="rounded-lg border border-white/10 bg-white/10 px-2 py-1 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                  />
                                  <input
                                    type="date"
                                    value={priceForm.effectiveFrom}
                                    onChange={(event) =>
                                      setPriceForm((prev) => ({
                                        ...prev,
                                        effectiveFrom: event.target.value,
                                      }))
                                    }
                                    className="rounded-lg border border-white/10 bg-white/10 px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                  />
                                </div>
                                <button
                                  type="button"
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
                                  className="w-full rounded-lg bg-blue-600 px-3 py-2 text-xs text-white hover:bg-blue-700 transition disabled:opacity-60"
                                  disabled={
                                    addPriceMutation.isPending ||
                                    !priceForm.price ||
                                    !priceForm.effectiveFrom
                                  }
                                >
                                  {addPriceMutation.isPending ? "Saving..." : "+ Add Price"}
                                </button>
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

            <div className="rounded-xl border border-dashed border-white/15 bg-white/5 p-3 space-y-3">
              <p className="text-sm font-medium text-gray-200">Add Meal Option</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[140px,1fr]">
                <select
                  value={optionForm.meal}
                  onChange={(event) =>
                    setOptionForm((prev) => ({
                      ...prev,
                      meal: event.target.value as MealType,
                    }))
                  }
                  className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="breakfast" className="text-black">Breakfast</option>
                  <option value="lunch" className="text-black">Lunch</option>
                  <option value="dinner" className="text-black">Dinner</option>
                </select>
                <input
                  value={optionForm.name}
                  onChange={(event) =>
                    setOptionForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  placeholder="Meal option name"
                  className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const trimmed = optionForm.name.trim();
                  if (!trimmed) return;
                  createOptionMutation.mutate({
                    messId: messId,
                    meal: optionForm.meal,
                    name: trimmed,
                  });
                }}
                disabled={createOptionMutation.isPending || !optionForm.name.trim()}
                className="w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition"
              >
                {createOptionMutation.isPending ? "Adding..." : "Add Option"}
              </button>
              {currentOptionMessage && (
                <p className="text-sm text-red-400">{currentOptionMessage}</p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 space-y-3">
        <p className="text-sm text-gray-300">Deactivate this mess</p>
        <p className="text-xs text-gray-400">
          Historical food entries and payments will be preserved. The mess will no
          longer appear in active lists.
        </p>
        <button
          type="button"
          onClick={() => {
            if (
              window.confirm(
                `Deactivate "${mess.name}"? You can still access it with includeInactive.`
              )
            ) {
              deactivateMutation.mutate();
            }
          }}
          disabled={deactivateMutation.isPending}
          className="rounded-xl border border-red-500/30 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-60 transition"
        >
          {deactivateMutation.isPending ? "Deactivating..." : "Deactivate Mess"}
        </button>
        {deactivateMutation.error instanceof Error && (
          <p className="text-sm text-red-400">{deactivateMutation.error.message}</p>
        )}
      </div>

      <Link
        href="/settings/messes"
        className="block text-center text-sm text-gray-400 hover:text-gray-200 transition"
      >
        Back to messes
      </Link>
    </div>
  );
}
