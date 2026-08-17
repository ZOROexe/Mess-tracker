"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import MessForm from "@/app/components/MessForm";
import PageHeader from "@/app/components/Header";
import { createMess } from "@/lib/api";
import { MessInput } from "@/types/mess";

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
    <div className="max-w-md mx-auto p-6 space-y-6">
      <PageHeader
        title="Add Mess"
        subtitle="Configure a new mess"
        actions={[{ label: "Back", href: "/settings/messes" }]}
      />

      <MessForm
        submitLabel="Create Mess"
        pendingLabel="Creating..."
        onSubmit={handleSubmit}
        isPending={isPending}
        error={error instanceof Error ? error.message : null}
        successMessage={isSuccess ? "Mess created successfully" : null}
      />

      <Link
        href="/settings/messes"
        className="block text-center text-sm text-gray-400 hover:text-gray-200 transition"
      >
        Cancel
      </Link>
    </div>
  );
}
