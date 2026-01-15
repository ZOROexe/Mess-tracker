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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
    
    useEffect(() => {
      async function setEntry() {
        setError(null);
        setLoading(true);

        try {
          const res = await fetch(`/api/food-entry?date=${date}`);
          console.log(res)

          if (!res.ok) {
            throw new Error("Failed to fetch food entry");
          }

          const data = await res.json();

          if (data) {
            console.log(data)
            setMeals({
              breakfast: data.breakfast,
              lunch: data.lunch,
              dinner: data.dinner
            });
          }
        } catch (error) {
          setError("Could not load food entry");
          console.error(error);
        } finally {
          setLoading(false);
        }
      }
      setEntry();
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
      setLoading(true);
      setError(null);
      try {
          const res = await fetch("/api/food-entry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date,
            breakfast: meals.breakfast,
            lunch: meals.lunch,
            dinner: meals.dinner
          })
          });
        if (!res.ok) {
          console.log(res);
          throw new Error("Failed to save food entry");
          }
        
        onSave();
      } catch (error) {
        setError("Failed to set prices")
      } finally{
        setLoading(false);
    }
    
  }


  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4 text-black">
        <h2 className="text-lg font-semibold">
          Food Entry – {date}
        </h2>
        {loading && (
          <p className="text-sm text-gray-500">Loading...</p>
        )}

        {error && (
          <p className="text-sm text-red-600">{error}</p>
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
            disabled={loading}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}