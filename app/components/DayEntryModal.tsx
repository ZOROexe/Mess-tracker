"use client";

import { useEffect, useState } from "react";

type MealSource = "none" | "mess" | "outside";

interface MealState {
  source: MealSource;
  cost?: number;
}

interface Props {
  date: string;
  onClose: () => void;
  onSave: () => void;
}

export default function DayEntryModal({ date, onClose, onSave }: Props) {
  const [meals, setMeals] = useState<Record<string, MealState>>({
    breakfast: { source: "none" },
    lunch: { source: "none" },
    dinner: { source: "none" }
  });
    
    useEffect(() => {
    fetch(`/api/food-entry?date=${date}`)
      .then((res) => res.json())
      .then((data) => {
          if (!data) return;
          console.log(data)

        setMeals({
          breakfast: data.breakfast,
          lunch: data.lunch,
          dinner: data.dinner
        });
      });
  }, [date]);

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
    await fetch("/api/food-entry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        breakfast: meals.breakfast,
        lunch: meals.lunch,
        dinner: meals.dinner
      })
    });

    onSave();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4 text-black">
        <h2 className="text-lg font-semibold">
          Food Entry – {date}
        </h2>

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
                  updateMeal(meal, { cost: Number(e.target.value) })
                }
              />
            )}
          </div>
        ))}

        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-black text-white rounded"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}