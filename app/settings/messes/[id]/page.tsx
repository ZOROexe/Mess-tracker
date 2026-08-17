"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import MessForm from "@/app/components/MessForm";
import PageHeader from "@/app/components/Header";
import { MessFormSkeleton } from "@/app/components/Skeletons";
import { deactivateMess, fetchMess, updateMess } from "@/lib/api";
import { MessInput } from "@/types/mess";

export default function ManageMessPage() {
  const params = useParams<{ id: string }>();
  const messId = params.id;
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: mess, isFetching, error } = useQuery({
    queryKey: ["mess", messId],
    queryFn: () => fetchMess(messId),
    enabled: !!messId,
    staleTime: 5 * 60 * 1000,
  });

  const updateMutation = useMutation({
    mutationFn: (values: Partial<MessInput>) => updateMess(messId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messes"] });
      queryClient.invalidateQueries({ queryKey: ["mess", messId] });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: () => deactivateMess(messId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messes"] });
      router.push("/settings/messes");
    },
  });

  if (isFetching) {
    return <MessFormSkeleton />;
  }

  if (error || !mess) {
    return (
      <div className="max-w-md mx-auto p-6 space-y-4">
        <PageHeader
          title="Manage Mess"
          actions={[{ label: "Back", href: "/settings/messes" }]}
        />
        <p className="text-sm text-red-400">
          {error instanceof Error ? error.message : "Mess not found"}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <PageHeader
        title={mess.name}
        subtitle="Update meal schedule and billing"
        actions={[{ label: "Back", href: "/settings/messes" }]}
      />

      <MessForm
        initialValues={{
          name: mess.name,
          mealSchedule: mess.mealSchedule,
          billingCycle: mess.billingCycle,
          billingConfig: mess.billingConfig,
        }}
        submitLabel="Save Changes"
        onSubmit={(values) => updateMutation.mutate(values)}
        isPending={updateMutation.isPending}
        error={
          updateMutation.error instanceof Error
            ? updateMutation.error.message
            : null
        }
        successMessage={
          updateMutation.isSuccess ? "Mess updated successfully" : null
        }
      />

      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 space-y-3">
        <p className="text-sm text-gray-300">Deactivate this mess</p>
        <p className="text-xs text-gray-400">
          Historical food entries and payments will be preserved. The mess will
          no longer appear in active lists.
        </p>
        <button
          type="button"
          onClick={() => {
            if (
              window.confirm(
                `Deactivate "${mess.name}"? You can still access it with includeInactive.`
              )
            ) {
              deactivateMutation.mutate();
            }
          }}
          disabled={deactivateMutation.isPending}
          className="rounded-xl border border-red-500/30 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-60 transition"
        >
          {deactivateMutation.isPending ? "Deactivating..." : "Deactivate Mess"}
        </button>
        {deactivateMutation.error instanceof Error && (
          <p className="text-sm text-red-400">{deactivateMutation.error.message}</p>
        )}
      </div>

      <Link
        href="/settings/messes"
        className="block text-center text-sm text-gray-400 hover:text-gray-200 transition"
      >
        Back to messes
      </Link>
    </div>
  );
}
