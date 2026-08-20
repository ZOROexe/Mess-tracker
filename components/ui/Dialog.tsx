"use client";

import React, { useEffect } from "react";
import { IconButton } from "./IconButton";

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
}

const maxWidthMap = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
};

export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = "md",
  className = "",
}: DialogProps) {
  // Handle ESC key press
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`w-full ${maxWidthMap[maxWidth]} max-h-[92vh] flex flex-col rounded-2xl bg-[#171C21] border border-white/[0.08] shadow-2xl animate-scaleIn text-[#F5F7F8] overflow-hidden ${className}`}
      >
        {/* Dialog Header */}
        {(title || description) && (
          <div className="flex items-start justify-between p-5 border-b border-white/[0.06] shrink-0">
            <div className="space-y-1 pr-4">
              {title && (
                <h2 className="text-lg font-semibold text-[#F5F7F8] tracking-tight">
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-xs text-[#9AA3AD]">{description}</p>
              )}
            </div>
            <IconButton
              size="sm"
              variant="ghost"
              label="Close modal"
              onClick={onClose}
              className="text-[#9AA3AD] hover:text-[#F5F7F8] shrink-0 -mr-1.5 -mt-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </IconButton>
          </div>
        )}

        {/* Dialog Body */}
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

export function DialogFooter({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex items-center justify-end gap-3 pt-4 mt-4 border-t border-white/[0.06] shrink-0 ${className}`}
    >
      {children}
    </div>
  );
}
