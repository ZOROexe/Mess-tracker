"use client";
import Link from "next/link";
import AuthButton from "./authButton";
import { useSession } from "next-auth/react";

interface Action {
  label: string;
  href: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: Action[];
}

export default function PageHeader({
  title,
  subtitle,
  actions = []
}: PageHeaderProps) {
  const { data: session } = useSession();

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Title */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-gray-400">
            {subtitle}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3 sm:justify-end">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 transition"
          >
            {action.label}
          </Link>
        ))}

        {session && (
          <span className="text-sm text-gray-400 max-w-[170px] truncate">
            {session.user?.email}
          </span>
        )}

        <AuthButton />
      </div>
    </div>
  );
}