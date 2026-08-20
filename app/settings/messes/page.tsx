"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { fetchMesses } from "@/lib/api";
import {
  formatBillingCycle,
  formatBillingDetails,
  formatMealSchedule,
} from "@/lib/messDisplay";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

export default function MessesPage() {
  const {
    data: messes = [],
    isFetching,
    error,
  } = useQuery({
    queryKey: ["messes"],
    queryFn: () => fetchMesses(),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F5F7F8]">
            Your Messes
          </h1>
          <p className="text-xs sm:text-sm text-[#9AA3AD] mt-0.5">
            Manage meal schedules, dynamic meal options, and billing
          </p>
        </div>
        <Link href="/settings/messes/new">
          <Button
            variant="primary"
            size="sm"
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            Add Mess
          </Button>
        </Link>
      </div>

      {error && (
        <p className="text-xs text-[#F87171] p-3 rounded-lg bg-[#F87171]/10 border border-[#F87171]/20">
          {error instanceof Error ? error.message : "Failed to load messes"}
        </p>
      )}

      {/* Mess List */}
      {isFetching ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : messes.length === 0 ? (
        <EmptyState
          title="No messes configured yet"
          description="Create a mess to track meals, meal options, and billing cycles."
          action={
            <Link href="/settings/messes/new">
              <Button variant="primary" size="sm">
                + Create Your First Mess
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3.5">
          {messes.map((mess) => {
            const billingDetails = formatBillingDetails(
              mess.billingCycle,
              mess.billingConfig
            );

            return (
              <div
                key={mess._id}
                className="rounded-xl bg-[#12161A] border border-white/[0.08] p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:border-white/[0.15] transition-all"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-[#F5F7F8] tracking-tight truncate">
                      {mess.name}
                    </h2>
                    <Badge variant="mess" size="sm">
                      Active
                    </Badge>
                  </div>
                  <p className="text-xs text-[#9AA3AD]">
                    Schedule: <span className="text-[#F5F7F8]">{formatMealSchedule(mess.mealSchedule)}</span>
                  </p>
                  <p className="text-xs text-[#68717C]">
                    Cycle: {formatBillingCycle(mess.billingCycle)}
                    {billingDetails ? ` · ${billingDetails}` : ""}
                  </p>
                </div>

                <Link href={`/settings/messes/${mess._id}`} className="shrink-0">
                  <Button variant="subtle" size="sm">
                    Manage Mess
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
