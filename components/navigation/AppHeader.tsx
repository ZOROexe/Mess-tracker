"use client";

import React from "react";
import Link from "next/link";
import { useSession, signOut, signIn } from "next-auth/react";
import { IconButton } from "../ui/IconButton";

export interface AppHeaderProps {
  onToggleSidebar: () => void;
}

export function AppHeader({ onToggleSidebar }: AppHeaderProps) {
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 h-14 bg-[#0E1216]/95 backdrop-blur-md border-b border-white/[0.06] select-none">
      {/* Left: Hamburger Button & Brand */}
      <div className="flex items-center gap-3">
        <IconButton
          size="sm"
          variant="ghost"
          label="Toggle Navigation Menu"
          onClick={onToggleSidebar}
          className="text-[#F5F7F8] hover:bg-white/10"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </IconButton>

        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-lg bg-[#2DD4BF]/10 border border-[#2DD4BF]/20 flex items-center justify-center text-[#2DD4BF] group-hover:border-[#2DD4BF]/40 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-[#F5F7F8] tracking-tight">Mess Tracker</span>
            <span className="hidden sm:inline text-[11px] text-[#68717C] font-medium border-l border-white/[0.08] pl-2">
              Daily meals & expenses
            </span>
          </div>
        </Link>
      </div>

      {/* Right: User Profile / Auth Action */}
      <div className="flex items-center gap-3">
        {status === "loading" ? (
          <div className="w-7 h-7 rounded-full bg-white/5 animate-pulse" />
        ) : session ? (
          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex flex-col items-end min-w-0">
              <span className="text-xs font-medium text-[#F5F7F8] truncate max-w-[140px]">
                {session.user?.name || "User"}
              </span>
              <span className="text-[10px] text-[#68717C] truncate max-w-[140px]">
                {session.user?.email}
              </span>
            </div>
            <div
              className="w-7 h-7 rounded-full bg-[#171C21] border border-white/10 flex items-center justify-center text-xs font-semibold text-[#2DD4BF] shrink-0"
              title={session.user?.name || session.user?.email || "User"}
            >
              {session.user?.name ? session.user.name[0].toUpperCase() : "U"}
            </div>
          </div>
        ) : (
          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#2DD4BF] text-[#0B0D0F] hover:bg-[#2DD4BF]/90 transition-all shadow-sm cursor-pointer"
          >
            Sign In with Google
          </button>
        )}
      </div>
    </header>
  );
}
