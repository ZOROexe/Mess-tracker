"use client";

import { useState } from "react";
import { MealSource, MealState } from "@/types/food";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchMesses, fetchMessMealOptions, FetchDailyFood, MessMealOption, saveFoodEntry } from "@/lib/api";
import { DayEntryModalSkeleton } from "./Skeletons";

const mealNames = ["breakfast", "lunch", "dinner"] as const;
type MealName = typeof mealNames[number];
type Meals = Record<MealName, MealState>;

const emptyMeals: Meals = {
  breakfast: { source: "none" },
  lunch: { source: "none" },
  dinner: { source: "none" },
};

function isMessSource(source: MealSource) {
  return source === "mess" || source === "mess_regular" || source === "mess_chicken";
}

function isLegacyMessSource(source: MealSource) {
  return source === "mess_regular" || source === "mess_chicken";
}

function sameId(left?: string, right?: string) {
  return Boolean(left && right && String(left) === String(right));
}

interface Props {
  date: string;
  onClose: () => void;
  onSave: () => void;
  month: string | null;
}

export default function DayEntryModal({ date, onClose, onSave, month }: Props) {
  // Keep server data as the initial display value until the user makes an edit.
  // This avoids resetting in-progress edits when React Query refetches.
  const [editedMeals, setEditedMeals] = useState<Meals | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["day-entry", date],
    queryFn: () => FetchDailyFood(date),
    enabled: !!date,
    staleTime: 60_000,
  });

  const { data: messes = [], isLoading: areMessesLoading, error: messesError } = useQuery({
    queryKey: ["messes"],
    queryFn: () => fetchMesses(),
    staleTime: 60_000,
  });

  const messIds = messes.map((mess) => mess._id);
  const { data: mealOptions = [], isLoading: areOptionsLoading, error: optionsError } = useQuery({
    queryKey: ["mess-meal-options", ...messIds],
    queryFn: async () => {
      const options = await Promise.all(messIds.map((messId) => fetchMessMealOptions(messId)));
      return options.flat().filter((option) => option.isActive);
    },
    enabled: messIds.length > 0,
    staleTime: 60_000,
  });

  const initialMeals: Meals = data
    ? { breakfast: data.breakfast, lunch: data.lunch, dinner: data.dinner }
    : emptyMeals;
  const meals = editedMeals ?? initialMeals;

  const { mutate, isPending, error: saveError } = useMutation({
    mutationFn: saveFoodEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["month-entry", month] });
      queryClient.invalidateQueries({ queryKey: ["day-entry", date] });
      onSave();
    },
    onError: (err) => console.error("Save failed:", err),
  });

  function updateMeal(meal: MealName, update: Partial<MealState>) {
    setEditedMeals((previous) => {
      const current = previous ?? initialMeals;
      return { ...current, [meal]: { ...current[meal], ...update } };
    });
  }

  function updateMealSource(meal: MealName, source: MealSource) {
    if (!isMessSource(source)) {
      updateMeal(meal, { source, messId: undefined, mealOptionId: undefined, mealOptionName: undefined });
      return;
    }

    const eligibleMesses = messes.filter((mess) => mess.mealSchedule[meal]);
    const messId = eligibleMesses.length === 1 ? eligibleMesses[0]._id : undefined;
    updateMeal(meal, {
      source,
      messId,
      mealOptionId: undefined,
      mealOptionName: undefined,
    });
  }

  function optionsFor(meal: MealName, messId?: string): MessMealOption[] {
    return mealOptions.filter((option) => option.meal === meal && sameId(option.messId, messId));
  }

  const hasIncompleteMessMeal = mealNames.some((meal) => {
    const entry = meals[meal];
    if (!isMessSource(entry.source) || !entry.messId) return isMessSource(entry.source);
    if (entry.source !== "mess") return false;
    return !entry.mealOptionId || !optionsFor(meal, entry.messId).some((option) => sameId(option._id, entry.mealOptionId));
  });
  const isBusy = isLoading || areMessesLoading || areOptionsLoading;

  function handleSave() {
    mutate({ date, breakfast: meals.breakfast, lunch: meals.lunch, dinner: meals.dinner });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-[scaleIn_0.15s_ease-out]">
      {isBusy ? <DayEntryModalSkeleton /> : (
        <div className="w-full max-w-md space-y-5 rounded-2xl bg-white p-6 text-black">
          <h2 className="text-lg font-semibold">Food Entry – {date}</h2>
          {error && <p className="text-sm text-red-600">{error.message}</p>}
          {messesError && <p className="text-sm text-red-600">{messesError.message}</p>}
          {optionsError && <p className="text-sm text-red-600">{optionsError.message}</p>}
          {saveError && <p className="text-sm text-red-600">{saveError.message}</p>}

          {mealNames.map((meal) => {
            const entry = meals[meal];
            const eligibleMesses = messes.filter((mess) => mess.mealSchedule[meal] || sameId(mess._id, entry.messId));
            const availableOptions = optionsFor(meal, entry.messId);

            return (
              <div key={meal} className="space-y-3">
                <label className="capitalize font-medium">{meal}</label>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={entry.source}
                  onChange={(event) => updateMealSource(meal, event.target.value as MealSource)}
                >
                  <option value="none">Not Taken</option>
                  <option value="mess">Mess</option>
                  {isLegacyMessSource(entry.source) && (
                    <option value={entry.source}>Legacy mess entry</option>
                  )}
                  <option value="outside">Outside</option>
                </select>

                {entry.source === "outside" && (
                  <input
                    type="number"
                    min="0"
                    placeholder="Enter cost"
                    className="w-full rounded border p-2"
                    value={entry.cost ?? ""}
                    onChange={(event) => updateMeal(meal, { cost: event.target.value === "" ? undefined : Number(event.target.value) })}
                  />
                )}

                {isMessSource(entry.source) && (
                  <>
                    {eligibleMesses.length === 0 ? (
                      <p className="text-sm text-amber-700">No mess is configured for this meal.</p>
                    ) : (
                      <select
                        aria-label={`${meal} mess`}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={entry.messId ?? ""}
                        onChange={(event) => updateMeal(meal, {
                          messId: event.target.value || undefined,
                          mealOptionId: undefined,
                          mealOptionName: undefined,
                        })}
                      >
                        <option value="">Select a mess</option>
                        {eligibleMesses.map((mess) => <option key={mess._id} value={mess._id}>{mess.name}</option>)}
                      </select>
                    )}

                    {entry.source === "mess" && entry.messId && (
                      availableOptions.length === 0 ? (
                        <p className="text-sm text-amber-700">No active {meal} options are configured for this mess.</p>
                      ) : (
                        <select
                          aria-label={`${meal} meal option`}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={entry.mealOptionId ? String(entry.mealOptionId) : ""}
                          onChange={(event) => {
                            const option = availableOptions.find((item) => sameId(item._id, event.target.value));
                            updateMeal(meal, {
                              mealOptionId: option?._id,
                              mealOptionName: option?.name,
                            });
                          }}
                        >
                          <option value="">Select a meal option</option>
                          {availableOptions.map((option) => <option key={option._id} value={option._id}>{option.name}</option>)}
                        </select>
                      )
                    )}

                    {entry.source === "mess" && entry.mealOptionName && (
                      <p className="text-xs text-gray-500">Selected: {entry.mealOptionName}</p>
                    )}
                  </>
                )}
              </div>
            );
          })}

          <div className="flex justify-end gap-3 pt-4">
            <button onClick={onClose} disabled={isBusy || isPending} className="rounded border px-4 py-2 disabled:opacity-50">Cancel</button>
            <button onClick={handleSave} disabled={isBusy || isPending || hasIncompleteMessMeal} className="rounded-xl bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 disabled:opacity-50">
              {isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
