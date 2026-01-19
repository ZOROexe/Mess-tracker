"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="h-9 w-20 rounded-lg bg-white/10 animate-pulse" />
    );
  }

  // Logged out → Login
  if (!session) {
    return (
      <button
        onClick={() => signIn("google", { callbackUrl: "/" })}
        className="
          rounded-xl
          bg-white/10
          px-4 py-2
          text-sm text-white
          border border-white/15
          hover:bg-white/20
          transition
        "
      >
        Login
      </button>
    );
  }

  // Logged in → Logout
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="
        rounded-xl
        px-4 py-2
        text-sm
        text-gray-300
        border border-white/10
        hover:text-white
        hover:bg-white/10
        transition
      "
    >
      Logout
    </button>
  );
}