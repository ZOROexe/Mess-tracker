"use client";

import { useState } from "react";
import { BillingCycle, BillingConfig, MealSchedule, MessInput } from "@/types/mess";
import {
  getMonthlyBillingExplanation,
  getWeekdayOptions,
} from "@/lib/messDisplay";

const defaultMealSchedule: MealSchedule = {
  breakfast: false,
  lunch: false,
  dinner: false,
};

const defaultBillingConfig: BillingConfig = {
  startDay: 1,
  monthlyStartDay: 1,
};

interface MessFormProps {
  initialValues?: Partial<MessInput>;
  submitLabel: string;
  pendingLabel?: string;
  onSubmit: (values: MessInput) => void;
  isPending?: boolean;
  error?: string | null;
  successMessage?: string | null;
}

export default function MessForm({
  initialValues,
  submitLabel,
  pendingLabel = "Saving...",
  onSubmit,
  isPending = false,
  error,
  successMessage,
}: MessFormProps) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [mealSchedule, setMealSchedule] = useState<MealSchedule>(
    initialValues?.mealSchedule ?? defaultMealSchedule
  );
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(
    initialValues?.billingCycle ?? "monthly"
  );
  const [billingConfig, setBillingConfig] = useState<BillingConfig>({
    ...defaultBillingConfig,
    ...initialValues?.billingConfig,
  });

  function toggleMeal(meal: keyof MealSchedule) {
    setMealSchedule((prev) => ({ ...prev, [meal]: !prev[meal] }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const payload: MessInput = {
      name: name.trim(),
      mealSchedule,
      billingCycle,
    };

    if (billingCycle === "weekly") {
      payload.billingConfig = { startDay: billingConfig.startDay ?? 1 };
    } else if (billingCycle === "monthly") {
      payload.billingConfig = {
        monthlyStartDay: billingConfig.monthlyStartDay ?? 1,
      };
    }

    onSubmit(payload);
  }

  const monthlyStartDay = billingConfig.monthlyStartDay ?? 1;

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-5"
    >
      <FormField label="Mess Name">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="e.g. Hostel Mess"
          className={inputClassName}
        />
      </FormField>

      <fieldset className="space-y-3">
        <legend className="text-xs uppercase tracking-wide text-gray-400">
          Meals Provided
        </legend>
        <MealToggle
          label="Breakfast"
          checked={mealSchedule.breakfast}
          onChange={() => toggleMeal("breakfast")}
        />
        <MealToggle
          label="Lunch"
          checked={mealSchedule.lunch}
          onChange={() => toggleMeal("lunch")}
        />
        <MealToggle
          label="Dinner"
          checked={mealSchedule.dinner}
          onChange={() => toggleMeal("dinner")}
        />
      </fieldset>

      <FormField label="Billing Cycle">
        <select
          value={billingCycle}
          onChange={(e) => setBillingCycle(e.target.value as BillingCycle)}
          className={inputClassName}
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </FormField>

      {billingCycle === "weekly" && (
        <FormField label="Billing starts on">
          <select
            value={billingConfig.startDay ?? 1}
            onChange={(e) =>
              setBillingConfig((prev) => ({
                ...prev,
                startDay: Number(e.target.value),
              }))
            }
            className={inputClassName}
          >
            {getWeekdayOptions().map(({ label, value }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-400 pt-1">
            Each period runs for 7 days starting on the selected weekday.
          </p>
        </FormField>
      )}

      {billingCycle === "monthly" && (
        <FormField label="Billing starts on day">
          <input
            type="number"
            min={1}
            max={31}
            value={monthlyStartDay}
            onChange={(e) =>
              setBillingConfig((prev) => ({
                ...prev,
                monthlyStartDay: Number(e.target.value),
              }))
            }
            required
            className={inputClassName}
          />
          <p className="text-xs text-gray-400 pt-1">
            {getMonthlyBillingExplanation(monthlyStartDay)}
          </p>
        </FormField>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-blue-600 py-2 text-white font-medium hover:bg-blue-700 disabled:opacity-60 transition"
      >
        {isPending ? pendingLabel : submitLabel}
      </button>

      {successMessage && (
        <p className="text-sm text-green-400">{successMessage}</p>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </form>
  );
}

function MealToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 px-4 py-3 cursor-pointer hover:bg-white/10 transition">
      <span className="text-sm text-gray-200">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded accent-blue-600"
      />
    </label>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs uppercase tracking-wide text-gray-400">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClassName =
  "w-full rounded-xl bg-white/10 border border-white/10 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition";
