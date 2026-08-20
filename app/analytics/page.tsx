"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMonthlyAnalytics } from "@/lib/api";
import {
  StatCard,
  ChartCard,
  MonthSwitcher,
  EmptyChartState,
} from "../components/Cards";
import { AnalyticsPageSkeleton } from "../components/Skeletons";
import PageHeader from "../components/Header";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function formatMonth(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg bg-[#171C21] border border-white/10 p-2.5 shadow-xl text-xs text-[#F5F7F8]">
        {label && <p className="text-[#9AA3AD] mb-1 font-medium">{label}</p>}
        {payload.map((entry: any, index: number) => (
          <p key={index} className="font-semibold tabular-nums" style={{ color: entry.color || entry.payload?.fill || "#2DD4BF" }}>
            {entry.name ? `${entry.name}: ` : ""}₹{entry.value?.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const [date, setDate] = useState(() => new Date());
  const month = formatMonth(date);

  const { data, isFetching, error } = useQuery({
    queryKey: ["analytics", month],
    queryFn: () => fetchMonthlyAnalytics(month),
    staleTime: 5 * 60 * 1000,
  });

  if (isFetching) return <AnalyticsPageSkeleton />;
  if (error) {
    return (
      <div className="p-6 text-sm text-[#F87171] rounded-xl bg-[#F87171]/10 border border-[#F87171]/20">
        {error.message}
      </div>
    );
  }

  const summary = data?.summary ?? {
    messTotal: 0,
    outsideTotal: 0,
    grandTotal: 0,
  };
  const dailySpend = data?.dailySpend ?? [];
  const spendingByMess = data?.spendingByMess ?? [];
  const billing = data?.billing ?? {
    totalBilled: 0,
    totalPaid: 0,
    outstanding: 0,
  };
  const averageDaily = Math.round(
    summary.grandTotal / Math.max(dailySpend.length, 1)
  );
  const highestDay = dailySpend.reduce(
    (highest, day) => (day.total > highest.total ? day : highest),
    { date: "", total: 0 }
  );
  const pieData = [
    { name: "Mess", value: summary.messTotal, fill: "#2DD4BF" },
    { name: "Outside", value: summary.outsideTotal, fill: "#F87171" },
  ];
  const dailyChartData = dailySpend.map((day) => ({
    day: day.date.slice(8),
    total: day.total,
  }));
  const hasSpend = summary.grandTotal > 0;

  return (
    <div className="space-y-6">
      {/* Header & Month Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F5F7F8]">
            Monthly Analytics
          </h1>
          <p className="text-xs sm:text-sm text-[#9AA3AD] mt-0.5">
            Food spending, billing cycles, and payment insights
          </p>
        </div>
        <MonthSwitcher
          date={date}
          labelMonth={date.toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}
          onChange={setDate}
        />
      </div>

      {/* 1. Key Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Total Spend"
          value={`₹${summary.grandTotal.toLocaleString()}`}
          dotColor="#F5F7F8"
        />
        <StatCard
          label="Mess"
          value={`₹${summary.messTotal.toLocaleString()}`}
          dotColor="#2DD4BF"
        />
        <StatCard
          label="Outside"
          value={`₹${summary.outsideTotal.toLocaleString()}`}
          dotColor="#F87171"
        />
        <StatCard
          label="Avg / Day"
          value={`₹${averageDaily.toLocaleString()}`}
          dotColor="#60A5FA"
        />
      </div>

      {/* 2 & 3. Charts: Mess vs Outside & Daily Spend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <ChartCard
          title="Mess vs Outside"
          subtitle="Expense distribution for the month"
        >
          {hasSpend ? (
            <div className="h-[240px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    stroke="none"
                  >
                    <Cell fill="#2DD4BF" />
                    <Cell fill="#F87171" />
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChartState message="No spending data recorded for this month." />
          )}
        </ChartCard>

        <ChartCard
          title="Daily Spending"
          subtitle="Daily trend across all meals"
        >
          {hasSpend ? (
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyChartData}>
                  <XAxis
                    dataKey="day"
                    stroke="#68717C"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                  />
                  <YAxis
                    stroke="#68717C"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                    tickFormatter={(v) => `₹${v}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="total"
                    fill="#60A5FA"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChartState message="No daily meal entries to display." />
          )}
        </ChartCard>
      </div>

      {/* 4. Spending by Mess */}
      <ChartCard
        title="Spending by Mess"
        subtitle="Distribution across individual messes"
      >
        {spendingByMess.length > 0 ? (
          <div
            className="w-full"
            style={{ height: Math.max(200, spendingByMess.length * 56) }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={spendingByMess}
                layout="vertical"
                margin={{ left: 10, right: 20 }}
              >
                <XAxis
                  type="number"
                  stroke="#68717C"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                  tickFormatter={(v) => `₹${v}`}
                />
                <YAxis
                  type="category"
                  dataKey="messName"
                  stroke="#9AA3AD"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                  width={120}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="amount"
                  fill="#2DD4BF"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyChartState message="No mess-specific spending for this month." />
        )}
      </ChartCard>

      {/* 5. Billing & Payments Summary */}
      <section className="rounded-xl border border-white/[0.08] bg-[#12161A] p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-[#F5F7F8] tracking-tight">
            Billing & Payments Summary
          </h2>
          <p className="text-xs text-[#9AA3AD] mt-0.5">
            Bill periods starting in this month. Payments allocated directly to those cycles.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard
            label="Total Billed"
            value={`₹${billing.totalBilled.toLocaleString()}`}
            dotColor="#9AA3AD"
          />
          <StatCard
            label="Total Paid"
            value={`₹${billing.totalPaid.toLocaleString()}`}
            dotColor="#2DD4BF"
          />
          <StatCard
            label="Outstanding"
            value={`₹${billing.outstanding.toLocaleString()}`}
            dotColor={billing.outstanding > 0 ? "#F87171" : "#2DD4BF"}
          />
        </div>
      </section>

      {/* 6. Highest Spend Day Insight */}
      {highestDay.date && (
        <div className="rounded-xl border border-white/[0.08] bg-[#171C21] p-4 flex items-center justify-between text-xs text-[#9AA3AD]">
          <span>Highest spending day:</span>
          <span className="font-semibold text-[#F5F7F8] tabular-nums">
            {highestDay.date} (₹{highestDay.total.toLocaleString()})
          </span>
        </div>
      )}
    </div>
  );
}
