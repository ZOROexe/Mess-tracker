"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { AppHeader } from "./AppHeader";

export interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0B0D0F] text-[#F5F7F8] flex flex-col antialiased">
      {/* Universal Top Header with Hamburger Button */}
      <AppHeader onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />

      {/* Slide-out Sidebar Drawer for desktop & mobile */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Viewport */}
      <main className="flex-1 w-full min-w-0 flex flex-col overflow-x-hidden min-h-[calc(100vh-3.5rem)]">
        <div className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
