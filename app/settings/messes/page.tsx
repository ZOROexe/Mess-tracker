"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import PageHeader from "@/app/components/Header";
import { MessListSkeleton } from "@/app/components/Skeletons";
import { fetchMesses } from "@/lib/api";
import {
  formatBillingCycle,
  formatBillingDetails,
  formatMealSchedule,
} from "@/lib/messDisplay";

export default function MessesPage() {
  const { data: messes = [], isFetching, error } = useQuery({
    queryKey: ["messes"],
    queryFn: () => fetchMesses(),
    staleTime: 5 * 60 * 1000,
  });

  if (isFetching) {
    return <MessListSkeleton />;
  }

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      <PageHeader
        title="Your Messes"
        subtitle="Manage meal schedules and billing"
        actions={[
          { label: "Calendar", href: "/" },
          { label: "Mess Pricing", href: "/settings/mess-pricing" },
        ]}
      />

      {error && (
        <p className="text-sm text-red-400">
          {error instanceof Error ? error.message : "Failed to load messes"}
        </p>
      )}

      <div className="space-y-4">
        {messes.length === 0 ? (
          <div className="rounded-2xl bg-white/5 border border-white/10 p-6 text-center space-y-2">
            <p className="text-sm text-gray-300">No messes configured yet.</p>
            <p className="text-xs text-gray-400">
              Add a mess to track meals and billing separately.
            </p>
          </div>
        ) : (
          messes.map((mess) => {
            const billingDetails = formatBillingDetails(
              mess.billingCycle,
              mess.billingConfig
            );

            return (
              <div
                key={mess._id}
                className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 p-5 space-y-3 hover:bg-white/[0.12] transition"
              >
                <div className="space-y-1">
                  <h2 className="text-lg font-medium text-white">{mess.name}</h2>
                  <p className="text-sm text-gray-300">
                    {formatMealSchedule(mess.mealSchedule)}
                  </p>
                  <p className="text-sm text-gray-400">
                    {formatBillingCycle(mess.billingCycle)}
                    {billingDetails ? ` · ${billingDetails}` : ""}
                  </p>
                </div>

                <Link
                  href={`/settings/messes/${mess._id}`}
                  className="inline-flex rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 transition"
                >
                  Manage
                </Link>
              </div>
            );
          })
        )}
      </div>

      <Link
        href="/settings/messes/new"
        className="flex w-full items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/5 py-3 text-sm text-gray-200 hover:bg-white/10 hover:border-white/30 transition"
      >
        + Add Mess
      </Link>
    </div>
  );
}
