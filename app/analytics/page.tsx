"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { FetchMonthlyFood } from "@/lib/api";
import { StatCard, ChartCard, MonthSwitcher } from "../components/Cards";
import { AnalyticsPageSkeleton } from "../components/Skeletons";
import { EmptyChartState } from "../components/Cards";
import PageHeader from "../components/Header";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis
} from "recharts";

export default function AnalyticsPage() {
    const [date, setDate] = useState(() => new Date());
    function formatMonth(date: Date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    }

    function monthLabel(date: Date) {
        return date.toLocaleString("default", { month: "long", year: "numeric" });
    }
  const month = formatMonth(date);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["month-entry", month],
    queryFn: () => FetchMonthlyFood(month),
    staleTime: 5 * 60 * 1000
  });

  const { messTotal, outsideTotal, grandTotal } = data?.summary ?? {
    messTotal: 0,
    outsideTotal: 0,
    grandTotal: 0
  };
  const entries = data?.entries?? [];

  const avgDaily = Math.round(grandTotal / Math.max(entries.length, 1));

  const pieData = [
    { name: "Mess", value: messTotal },
    { name: "Outside", value: outsideTotal }
  ];

  const barData = entries.map((e: any) => ({
    day: e.date.slice(8),
    total: e.totalCost
  }));

  const highestDay = entries.reduce(
    (max: any, e: any) => (e.totalCost > max.totalCost ? e : max),
    { totalCost: 0 }
  );

  const hasData =
    data?.entries?.length > 0 &&
    data?.summary?.grandTotal > 0;

  if (isFetching) {
    return <AnalyticsPageSkeleton/>
  }

  return (
    <div className="p-6 space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <PageHeader
          title="Monthly Analytics"
          subtitle="Insights into your food spending"
          actions={[
            { label: "Calendar", href: "/" }
          ]}
        />
      </div>
      <MonthSwitcher date={date} labelMonth={monthLabel(date)} onChange={setDate} />
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Total Spend" value={`₹${grandTotal}`} />
        <StatCard label="Mess" value={`₹${messTotal}`} />
        <StatCard label="Outside" value={`₹${outsideTotal}`} />
        <StatCard label="Avg / Day" value={`₹${avgDaily}`} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pie */}
        <ChartCard title="Mess vs Outside">
          {hasData ? (
            <ResponsiveContainer height={260}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
              >
                <Cell fill="#22c55e" />
                <Cell fill="#ef4444" />
              </Pie>
              <Tooltip formatter={(v) => `₹${v}`} />
            </PieChart>
          </ResponsiveContainer>
          ): <EmptyChartState message="No spending data for this month"/>}
        </ChartCard>

        {/* Bar */}
        <ChartCard title="Daily Spend">
          {hasData ? (
            <ResponsiveContainer height={260}>
            <BarChart data={barData}>
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip formatter={(v) => `₹${v}`} />
              <Bar dataKey="total" fill="#60a5fa" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          ): <EmptyChartState message="No daily entries to display"/>}
        </ChartCard>
      </div>

      {/* Extra insights */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-sm text-gray-300">
        <p>
          Highest spend day:{" "}
          <span className="font-medium">
            {highestDay.date || "—"} (₹{highestDay.totalCost || 0})
          </span>
        </p>
      </div>
    </div>
  );
}