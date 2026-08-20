"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import MessForm from "@/app/components/MessForm";
import { createMess } from "@/lib/api";
import { MessInput } from "@/types/mess";
import { IconButton } from "@/components/ui/IconButton";

export default function NewMessPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { mutate, isPending, error, isSuccess } = useMutation({
    mutationFn: createMess,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messes"] });
      router.push("/settings/messes");
    },
  });

  function handleSubmit(values: MessInput) {
    mutate(values);
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/settings/messes">
          <IconButton size="sm" variant="ghost" label="Back to messes">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </IconButton>
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F5F7F8]">
            Add New Mess
          </h1>
          <p className="text-xs sm:text-sm text-[#9AA3AD] mt-0.5">
            Configure meal schedules and billing cycle for this mess
          </p>
        </div>
      </div>

      <MessForm
        submitLabel="Create Mess"
        pendingLabel="Creating..."
        onSubmit={handleSubmit}
        isPending={isPending}
        error={error instanceof Error ? error.message : null}
        successMessage={isSuccess ? "Mess created successfully" : null}
      />
    </div>
  );
}
