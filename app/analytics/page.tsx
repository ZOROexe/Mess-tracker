"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMonthlyAnalytics } from "@/lib/api";
import { StatCard, ChartCard, MonthSwitcher, EmptyChartState } from "../components/Cards";
import { AnalyticsPageSkeleton } from "../components/Skeletons";
import PageHeader from "../components/Header";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

function formatMonth(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export default function AnalyticsPage() {
  const [date, setDate] = useState(() => new Date());
  const month = formatMonth(date);
  const { data, isFetching, error } = useQuery({
    queryKey: ["analytics", month],
    queryFn: () => fetchMonthlyAnalytics(month),
    staleTime: 5 * 60 * 1000,
  });

  if (isFetching) return <AnalyticsPageSkeleton />;
  if (error) return <div className="mx-auto max-w-4xl p-6 text-sm text-red-400">{error.message}</div>;

  const summary = data?.summary ?? { messTotal: 0, outsideTotal: 0, grandTotal: 0 };
  const dailySpend = data?.dailySpend ?? [];
  const spendingByMess = data?.spendingByMess ?? [];
  const billing = data?.billing ?? { totalBilled: 0, totalPaid: 0, outstanding: 0 };
  const averageDaily = Math.round(summary.grandTotal / Math.max(dailySpend.length, 1));
  const highestDay = dailySpend.reduce((highest, day) => day.total > highest.total ? day : highest, { date: "", total: 0 });
  const pieData = [{ name: "Mess", value: summary.messTotal }, { name: "Outside", value: summary.outsideTotal }];
  const dailyChartData = dailySpend.map((day) => ({ day: day.date.slice(8), total: day.total }));
  const hasSpend = summary.grandTotal > 0;

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <PageHeader title="Monthly Analytics" subtitle="Food spending, bills, and payments" actions={[{ label: "Calendar", href: "/" }, { label: "Bills", href: "/bills" }]} />
      <MonthSwitcher date={date} labelMonth={date.toLocaleString("default", { month: "long", year: "numeric" })} onChange={setDate} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Total Spend" value={`₹${summary.grandTotal}`} />
        <StatCard label="Mess" value={`₹${summary.messTotal}`} />
        <StatCard label="Outside" value={`₹${summary.outsideTotal}`} />
        <StatCard label="Avg / Day" value={`₹${averageDaily}`} />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <ChartCard title="Mess vs Outside">
          {hasSpend ? <ResponsiveContainer height={260}><PieChart><Pie data={pieData} dataKey="value" innerRadius={60} outerRadius={90} paddingAngle={4}><Cell fill="#22c55e" /><Cell fill="#ef4444" /></Pie><Tooltip formatter={(value) => `₹${value}`} /></PieChart></ResponsiveContainer> : <EmptyChartState message="No spending data for this month" />}
        </ChartCard>
        <ChartCard title="Daily Spend">
          {hasSpend ? <ResponsiveContainer height={260}><BarChart data={dailyChartData}><XAxis dataKey="day" /><YAxis /><Tooltip formatter={(value) => `₹${value}`} /><Bar dataKey="total" fill="#60a5fa" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer> : <EmptyChartState message="No daily entries to display" />}
        </ChartCard>
      </div>

      <ChartCard title="Spending by Mess">
        {spendingByMess.length > 0 ? <ResponsiveContainer height={Math.max(240, spendingByMess.length * 56)}><BarChart data={spendingByMess} layout="vertical" margin={{ left: 18 }}><XAxis type="number" /><YAxis type="category" dataKey="messName" width={110} /><Tooltip formatter={(value) => `₹${value}`} /><Bar dataKey="amount" fill="#a78bfa" radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer> : <EmptyChartState message="No mess spending data for this month" />}
      </ChartCard>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
        <div><h2 className="font-medium">Billing & Payments</h2><p className="text-sm text-gray-400">Bill periods that start in this month. Payments are counted only when allocated to those periods.</p></div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3"><StatCard label="Total Billed" value={`₹${billing.totalBilled}`} /><StatCard label="Total Paid" value={`₹${billing.totalPaid}`} /><StatCard label="Outstanding" value={`₹${billing.outstanding}`} /></div>
      </section>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-gray-300">Highest spend day: <span className="font-medium">{highestDay.date || "—"} (₹{highestDay.total})</span></div>
    </div>
  );
}
