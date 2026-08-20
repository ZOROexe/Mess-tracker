"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const callbackUrl = "/";

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl bg-[#12161A] border border-white/[0.08] p-6 sm:p-8 space-y-6 text-center shadow-2xl">
        {/* Brand Icon & Heading */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#2DD4BF]/10 border border-[#2DD4BF]/20 flex items-center justify-center text-[#2DD4BF]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#F5F7F8]">
              Mess Food Tracker
            </h1>
            <p className="text-xs text-[#9AA3AD] mt-1">
              Precision food expense & mess management
            </p>
          </div>
        </div>

        {/* Action */}
        <div className="pt-2">
          <Button
            variant="primary"
            size="lg"
            className="w-full font-semibold"
            onClick={() => signIn("google", { callbackUrl })}
          >
            Continue with Google
          </Button>
        </div>

        <p className="text-[11px] text-[#68717C]">
          Sign in to securely store your daily meals, track multiple messes, and view monthly billing cycles.
        </p>
      </div>
    </div>
  );
}