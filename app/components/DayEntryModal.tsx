"use client";

import { useEffect, useState } from "react";
import { MealState } from "@/types/food";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FetchDailyFood, saveFoodEntry } from "@/lib/api";
import { fetchMesses } from "@/lib/api";
import { DayEntryModalSkeleton } from "./Skeletons";
import { MealSource } from "@/types/food";

const mealNames = ["breakfast", "lunch", "dinner"] as const;
type MealName = typeof mealNames[number];

function isMessSource(source: MealSource) {
  return source === "mess" || source === "mess_regular" || source === "mess_chicken";
}

interface Props {
  date: string;
  onClose: () => void;
  onSave: () => void;
  month: string | null;
}

export default function DayEntryModal({ date, onClose, onSave, month }: Props) {
  const [meals, setMeals] = useState<Record<string, MealState>>({
    breakfast: { source: "none" },
    lunch: { source: "none" },
    dinner: { source: "none" }
  });
  const queryClient = useQueryClient();

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['day-entry', date],
    queryFn: () => FetchDailyFood(date!),
    enabled: !!date,
    staleTime: 60_000 //1 min
  })

  const { data: messes = [], isLoading: areMessesLoading, error: messesError } = useQuery({
    queryKey: ["messes"],
    queryFn: () => fetchMesses(),
    staleTime: 60_000,
  });

  const { mutate, isPending, isError, error: saveError } = useMutation({
      mutationFn: saveFoodEntry,
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["month-entry", month],
        });
        queryClient.invalidateQueries({
          queryKey: ["day-entry", date],
        })
      },
    onError: (err) => {
        console.error("Save failed:", err);
      }
    })

  useEffect(() => {
    if (!data) return;

    setMeals({
      breakfast: data.breakfast,
      lunch: data.lunch,
      dinner: data.dinner
    });
  }, [data]);

  function updateMeal(
    meal: MealName,
    data: Partial<MealState>
  ) {
    setMeals((prev) => ({
      ...prev,
      [meal]: { ...prev[meal], ...data }
    }));
  }

  function updateMealSource(meal: MealName, source: MealSource) {
    if (!isMessSource(source)) {
      updateMeal(meal, { source, messId: undefined });
      return;
    }

    const eligibleMesses = messes.filter((mess) => mess.mealSchedule[meal]);
    updateMeal(meal, {
      source,
      // Auto-select only when the schedule unambiguously identifies one mess.
      messId: eligibleMesses.length === 1 ? eligibleMesses[0]._id : meals[meal].messId,
    });
  }

  const hasUnassignedMessMeal = mealNames.some((meal) => (
    isMessSource(meals[meal].source) && !meals[meal].messId
  ));

  async function handleSave() {
    const payload = {
      date,
      breakfast: meals.breakfast,
      lunch: meals.lunch,
      dinner: meals.dinner
    }
    mutate(payload);
    onSave();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-[scaleIn_0.15s_ease-out]">
      {isLoading || areMessesLoading ? <DayEntryModalSkeleton /> :
        <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-5 text-black
                  ">
        <h2 className="text-lg font-semibold">
          Food Entry – {date}
        </h2>
        {isLoading && (
          <p className="text-sm text-gray-500">Loading...</p>
        )}

        {error && (
          <p className="text-sm text-red-600">{error.message}</p>
        )}
        {messesError && (
          <p className="text-sm text-red-600">{messesError.message}</p>
        )}
        {saveError && (
          <p className="text-sm text-red-600">{saveError.message}</p>
        )}

        {mealNames.map((meal) => (
          <div key={meal} className="space-y-4">
            <label className="capitalize font-medium">{meal}</label>

            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={meals[meal].source}
              onChange={(e) =>
                updateMealSource(meal, e.target.value as MealSource)
              }
            >
              <option value="none">Not Taken</option>
              {meal === "breakfast" ? (
                <option value="mess_regular">Mess</option>
              ) : (
                <>
                  <option value="mess_regular">Mess Regular</option>
                  <option value="mess_chicken">Mess Chicken</option>
                </>
              )}
              <option value="outside">Outside</option>
            </select>

            {meals[meal].source === "outside" && (
              <input
                type="number"
                placeholder="Enter cost"
                className="w-full border rounded p-2"
                value={meals[meal].cost ?? ''}
                onChange={(e) =>
                  updateMeal(meal, { cost: e.target.value === "" ? undefined : Number(e.target.value) })
                }
              />
            )}

            {isMessSource(meals[meal].source) && (() => {
              const eligibleMesses = messes.filter((mess) => mess.mealSchedule[meal]);
              const requiresSelection = eligibleMesses.length !== 1;

              if (eligibleMesses.length === 0) {
                return <p className="text-sm text-amber-700">No mess configured for this meal.</p>;
              }

              if (!requiresSelection) {
                return (
                  <div className="space-y-2">
                    <p className="text-sm text-green-700">✓ {eligibleMesses[0].name}</p>
                    {messes.length > 1 && (
                      <details className="text-sm text-gray-600">
                        <summary className="cursor-pointer">Use a different mess</summary>
                        <select
                          className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={meals[meal].messId ?? eligibleMesses[0]._id}
                          onChange={(event) => updateMeal(meal, { messId: event.target.value })}
                        >
                          {messes.map((mess) => (
                            <option key={mess._id} value={mess._id}>{mess.name}</option>
                          ))}
                        </select>
                      </details>
                    )}
                  </div>
                );
              }

              return (
                <div className="space-y-1">
                  <label className="text-sm font-medium">Mess</label>
                  <select
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={meals[meal].messId ?? ""}
                    onChange={(event) => updateMeal(meal, { messId: event.target.value || undefined })}
                  >
                    <option value="">Select a mess</option>
                    {eligibleMesses.map((mess) => (
                      <option key={mess._id} value={mess._id}>{mess.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500">Multiple messes provide this meal. Choose the one you used.</p>
                </div>
              );
            })()}
          </div>
        ))}

        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={onClose}
            disabled={isLoading || areMessesLoading}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={isLoading || areMessesLoading || hasUnassignedMessMeal}
            className="rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition"
          >
            {isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
      }
    </div>
  );
}
