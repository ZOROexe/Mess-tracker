"use client";

import { useState } from "react";
import { BillingCycle, BillingConfig, MealSchedule, MessInput } from "@/types/mess";
import {
  getMonthlyBillingExplanation,
  getWeekdayOptions,
} from "@/lib/messDisplay";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

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
      className="rounded-xl bg-[#12161A] border border-white/[0.08] p-5 sm:p-6 space-y-5"
    >
      {/* Mess Name */}
      <Input
        label="Mess Name"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        placeholder="e.g. North Dining Mess"
      />

      {/* Meals Provided */}
      <div className="space-y-2">
        <label className="block text-xs font-medium uppercase tracking-wider text-[#9AA3AD]">
          Meals Provided
        </label>
        <div className="grid grid-cols-3 gap-2">
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
        </div>
      </div>

      {/* Billing Cycle */}
      <Select
        label="Billing Cycle"
        value={billingCycle}
        onChange={(e) => setBillingCycle(e.target.value as BillingCycle)}
      >
        <option value="daily" className="text-black">Daily</option>
        <option value="weekly" className="text-black">Weekly</option>
        <option value="monthly" className="text-black">Monthly</option>
      </Select>

      {/* Weekly Cycle Config */}
      {billingCycle === "weekly" && (
        <Select
          label="Billing starts on weekday"
          value={billingConfig.startDay ?? 1}
          onChange={(e) =>
            setBillingConfig((prev) => ({
              ...prev,
              startDay: Number(e.target.value),
            }))
          }
          helperText="Each period runs for 7 consecutive days starting on this weekday."
        >
          {getWeekdayOptions().map(({ label, value }) => (
            <option key={value} value={value} className="text-black">
              {label}
            </option>
          ))}
        </Select>
      )}

      {/* Monthly Cycle Config */}
      {billingCycle === "monthly" && (
        <Input
          label="Billing starts on day of month"
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
          helperText={getMonthlyBillingExplanation(monthlyStartDay)}
        />
      )}

      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          size="md"
          className="w-full font-semibold"
          isLoading={isPending}
          disabled={isPending || !name.trim()}
        >
          {isPending ? pendingLabel : submitLabel}
        </Button>
      </div>

      {successMessage && (
        <p className="text-xs text-[#2DD4BF] bg-[#2DD4BF]/10 p-3 rounded-lg border border-[#2DD4BF]/20">
          {successMessage}
        </p>
      )}
      {error && (
        <p className="text-xs text-[#F87171] bg-[#F87171]/10 p-3 rounded-lg border border-[#F87171]/20">
          {error}
        </p>
      )}
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
    <button
      type="button"
      onClick={onChange}
      className={`p-2.5 rounded-lg border text-xs font-medium transition-all select-none flex items-center justify-center gap-1.5 ${
        checked
          ? "bg-[#2DD4BF]/15 text-[#2DD4BF] border-[#2DD4BF]/40 shadow-sm font-semibold"
          : "bg-[#171C21] text-[#9AA3AD] border-white/[0.08] hover:text-[#F5F7F8] hover:bg-white/[0.04]"
      }`}
    >
      {/* <span
        className={`w-1.5 h-1.5 rounded-full ${
          checked ? "bg-[#2DD4BF]" : "bg-[#68717C]"
        }`}
      /> */}
      <span>{label}</span>
    </button>
  );
}
