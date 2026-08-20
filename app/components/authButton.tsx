"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";

export default function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="h-8 w-20 rounded-lg bg-white/5 animate-pulse" />
    );
  }

  // Logged out → Login
  if (!session) {
    return (
      <Button
        variant="primary"
        size="sm"
        onClick={() => signIn("google", { callbackUrl: "/" })}
      >
        Sign In
      </Button>
    );
  }

  // Logged in → Logout
  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={() => signOut({ callbackUrl: "/" })}
    >
      Sign Out
    </Button>
  );
}