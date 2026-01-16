"use client";

import { useEffect, useState } from "react";
import { MealState } from "@/types/food";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FetchDailyFood, saveFoodEntry } from "@/lib/api";

type MealSource = "none" | "mess" | "outside";

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
    meal: "breakfast" | "lunch" | "dinner",
    data: Partial<MealState>
  ) {
    setMeals((prev) => ({
      ...prev,
      [meal]: { ...prev[meal], ...data }
    }));
  }

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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4 text-black">
        <h2 className="text-lg font-semibold">
          Food Entry – {date}
        </h2>
        {isLoading && (
          <p className="text-sm text-gray-500">Loading...</p>
        )}

        {error && (
          <p className="text-sm text-red-600">{error.message}</p>
        )}
        {saveError && (
          <p className="text-sm text-red-600">{saveError.message}</p>
        )}

        {(["breakfast", "lunch", "dinner"] as const).map((meal) => (
          <div key={meal} className="space-y-2">
            <label className="capitalize font-medium">{meal}</label>

            <select
              className="w-full border rounded p-2"
              value={meals[meal].source}
              onChange={(e) =>
                updateMeal(meal, { source: e.target.value as MealSource })
              }
            >
              <option value="none">Not Taken</option>
              <option value="mess">Mess</option>
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
          </div>
        ))}

        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}