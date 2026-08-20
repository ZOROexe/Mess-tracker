"use client";

import { useState } from "react";
import { MealSource, MealState } from "@/types/food";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchMesses,
  fetchMessMealOptions,
  FetchDailyFood,
  MessMealOption,
  saveFoodEntry,
} from "@/lib/api";
import { DayEntryModalSkeleton } from "./Skeletons";
import { Dialog, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { MdOutlineFreeBreakfast, MdOutlineLunchDining, MdOutlineDinnerDining} from "react-icons/md";

const mealNames = ["breakfast", "lunch", "dinner"] as const;
type MealName = (typeof mealNames)[number];
type Meals = Record<MealName, MealState>;

const emptyMeals: Meals = {
  breakfast: { source: "none" },
  lunch: { source: "none" },
  dinner: { source: "none" },
};

function isMessSource(source: MealSource) {
  return (
    source === "mess" ||
    source === "mess_regular" ||
    source === "mess_chicken"
  );
}

function isLegacyMessSource(source: MealSource) {
  return source === "mess_regular" || source === "mess_chicken";
}

function sameId(left?: string, right?: string) {
  return Boolean(left && right && String(left) === String(right));
}

const mealIcons: Record<MealName, React.ReactNode> = {
  breakfast: (
    <MdOutlineFreeBreakfast className="text-[#2DD4BF]"/>
  ),
  lunch: (
    <MdOutlineLunchDining className="text-[#2DD4BF]"/>
  ),
  dinner: (
    <MdOutlineDinnerDining className="text-[#2DD4BF]"/>
  ),
};

interface Props {
  date: string;
  onClose: () => void;
  onSave: () => void;
  month: string | null;
}

export default function DayEntryModal({ date, onClose, onSave, month }: Props) {
  const [editedMeals, setEditedMeals] = useState<Meals | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["day-entry", date],
    queryFn: () => FetchDailyFood(date),
    enabled: !!date,
    staleTime: 60_000,
  });

  const {
    data: messes = [],
    isLoading: areMessesLoading,
    error: messesError,
  } = useQuery({
    queryKey: ["messes"],
    queryFn: () => fetchMesses(),
    staleTime: 60_000,
  });

  const messIds = messes.map((mess) => mess._id);
  const {
    data: mealOptions = [],
    isLoading: areOptionsLoading,
    error: optionsError,
  } = useQuery({
    queryKey: ["mess-meal-options", ...messIds],
    queryFn: async () => {
      const options = await Promise.all(
        messIds.map((messId) => fetchMessMealOptions(messId))
      );
      return options.flat().filter((option) => option.isActive);
    },
    enabled: messIds.length > 0,
    staleTime: 60_000,
  });

  const initialMeals: Meals = data
    ? { breakfast: data.breakfast, lunch: data.lunch, dinner: data.dinner }
    : emptyMeals;
  const meals = editedMeals ?? initialMeals;

  const {
    mutate,
    isPending,
    error: saveError,
  } = useMutation({
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
      updateMeal(meal, {
        source,
        messId: undefined,
        mealOptionId: undefined,
        mealOptionName: undefined,
      });
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
    return mealOptions.filter(
      (option) => option.meal === meal && sameId(option.messId, messId)
    );
  }

  const hasIncompleteMessMeal = mealNames.some((meal) => {
    const entry = meals[meal];
    if (!isMessSource(entry.source) || !entry.messId)
      return isMessSource(entry.source);
    if (entry.source !== "mess") return false;
    return (
      !entry.mealOptionId ||
      !optionsFor(meal, entry.messId).some((option) =>
        sameId(option._id, entry.mealOptionId)
      )
    );
  });

  const isBusy = isLoading || areMessesLoading || areOptionsLoading;

  function handleSave() {
    mutate({
      date,
      breakfast: meals.breakfast,
      lunch: meals.lunch,
      dinner: meals.dinner,
    });
  }

  const formattedDate = new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Dialog
      isOpen={true}
      onClose={onClose}
      title={`Food Entry`}
      description={`${formattedDate}`}
      maxWidth="lg"
    >
      {isBusy ? (
        <DayEntryModalSkeleton />
      ) : (
        <div className="space-y-6">
          {error && <p className="text-xs text-[#F87171]">{error.message}</p>}
          {messesError && (
            <p className="text-xs text-[#F87171]">{messesError.message}</p>
          )}
          {optionsError && (
            <p className="text-xs text-[#F87171]">{optionsError.message}</p>
          )}
          {saveError && (
            <p className="text-xs text-[#F87171]">{saveError.message}</p>
          )}

          {mealNames.map((meal, index) => {
            const entry = meals[meal];
            const eligibleMesses = messes.filter(
              (mess) => mess.mealSchedule[meal] || sameId(mess._id, entry.messId)
            );
            const availableOptions = optionsFor(meal, entry.messId);

            return (
              <div key={meal} className="space-y-3.5">
                {/* Meal Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {mealIcons[meal]}
                    <h3 className="text-sm font-semibold capitalize text-[#F5F7F8]">
                      {meal}
                    </h3>
                  </div>
                  {entry.source === "outside" && entry.cost !== undefined && (
                    <span className="text-xs font-semibold text-[#F87171] tabular-nums">
                      ₹{entry.cost}
                    </span>
                  )}
                  {entry.source === "mess" && entry.mealOptionName && (
                    <span className="text-xs text-[#2DD4BF] font-medium truncate max-w-[160px]">
                      {entry.mealOptionName}
                    </span>
                  )}
                </div>

                {/* Segmented Source Selector */}
                <div className="grid grid-cols-3 gap-1 bg-[#12161A] p-1 rounded-lg border border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => updateMealSource(meal, "none")}
                    className={`py-1.5 px-3 rounded-md text-xs font-medium transition-all ${
                      entry.source === "none"
                        ? "bg-[#171C21] text-[#F5F7F8] border border-white/[0.08] shadow-sm"
                        : "text-[#9AA3AD] hover:text-[#F5F7F8]"
                    }`}
                  >
                    Not Taken
                  </button>
                  <button
                    type="button"
                    onClick={() => updateMealSource(meal, "mess")}
                    className={`py-1.5 px-3 rounded-md text-xs font-medium transition-all ${
                      isMessSource(entry.source)
                        ? "bg-[#2DD4BF]/15 text-[#2DD4BF] border border-[#2DD4BF]/30 shadow-sm"
                        : "text-[#9AA3AD] hover:text-[#F5F7F8]"
                    }`}
                  >
                    Mess
                  </button>
                  <button
                    type="button"
                    onClick={() => updateMealSource(meal, "outside")}
                    className={`py-1.5 px-3 rounded-md text-xs font-medium transition-all ${
                      entry.source === "outside"
                        ? "bg-[#F87171]/15 text-[#F87171] border border-[#F87171]/30 shadow-sm"
                        : "text-[#9AA3AD] hover:text-[#F5F7F8]"
                    }`}
                  >
                    Outside
                  </button>
                </div>

                {/* Outside Cost Input */}
                {entry.source === "outside" && (
                  <div className="pt-1">
                    <Input
                      label="Outside Cost (₹)"
                      type="number"
                      min="0"
                      placeholder="Enter amount (e.g. 120)"
                      value={entry.cost ?? ""}
                      onChange={(event) =>
                        updateMeal(meal, {
                          cost:
                            event.target.value === ""
                              ? undefined
                              : Number(event.target.value),
                        })
                      }
                      leftElement={<span className="text-xs font-medium">₹</span>}
                    />
                  </div>
                )}

                {/* Mess Selection Details */}
                {isMessSource(entry.source) && (
                  <div className="space-y-3 pt-1">
                    {eligibleMesses.length === 0 ? (
                      <p className="text-xs text-[#F59E0B] bg-[#F59E0B]/10 p-2.5 rounded-lg border border-[#F59E0B]/20">
                        No mess is configured for {meal}.
                      </p>
                    ) : (
                      <Select
                        label="Select Mess"
                        value={entry.messId ?? ""}
                        onChange={(event) =>
                          updateMeal(meal, {
                            messId: event.target.value || undefined,
                            mealOptionId: undefined,
                            mealOptionName: undefined,
                          })
                        }
                      >
                        <option value="" className="text-black">
                          Select a mess
                        </option>
                        {eligibleMesses.map((mess) => (
                          <option key={mess._id} value={mess._id} className="text-black">
                            {mess.name}
                          </option>
                        ))}
                      </Select>
                    )}

                    {entry.source === "mess" && entry.messId && (
                      availableOptions.length === 0 ? (
                        <p className="text-xs text-[#F59E0B] bg-[#F59E0B]/10 p-2.5 rounded-lg border border-[#F59E0B]/20">
                          No active {meal} options configured for this mess.
                        </p>
                      ) : (
                        <Select
                          label="Meal Option"
                          value={entry.mealOptionId ? String(entry.mealOptionId) : ""}
                          onChange={(event) => {
                            const option = availableOptions.find((item) =>
                              sameId(item._id, event.target.value)
                            );
                            updateMeal(meal, {
                              mealOptionId: option?._id,
                              mealOptionName: option?.name,
                            });
                          }}
                        >
                          <option value="" className="text-black">
                            Select a meal option
                          </option>
                          {availableOptions.map((option) => (
                            <option key={option._id} value={option._id} className="text-black">
                              {option.name}
                            </option>
                          ))}
                        </Select>
                      )
                    )}
                  </div>
                )}

                {index < mealNames.length - 1 && (
                  <div className="pt-2 border-b border-white/[0.04]" />
                )}
              </div>
            );
          })}

          <DialogFooter>
            <Button
              type="button"
              variant="subtle"
              size="md"
              onClick={onClose}
              disabled={isBusy || isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleSave}
              isLoading={isPending}
              disabled={isBusy || isPending || hasIncompleteMessMeal}
            >
              {isPending ? "Saving..." : "Save Entry"}
            </Button>
          </DialogFooter>
        </div>
      )}
    </Dialog>
  );
}
