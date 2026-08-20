"use client";

import { useRouter } from "next/navigation";
import { Dialog, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";

interface Props {
  onPress: () => void;
  onClose: () => void;
}

export default function LoginModal({ onClose }: Props) {
  const router = useRouter();

  return (
    <Dialog
      isOpen={true}
      onClose={onClose}
      title="Track Your Meals"
      description="Sign in to record your daily food entries and track your monthly budget."
      maxWidth="sm"
    >
      <div className="space-y-4 pt-1">
        <div className="p-3.5 rounded-xl bg-[#12161A] border border-white/[0.06] flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#2DD4BF]/10 border border-[#2DD4BF]/20 flex items-center justify-center text-[#2DD4BF] shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <p className="text-xs text-[#9AA3AD]">
            Your entries and messes will be securely synced with your Google account.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          className="w-full font-semibold"
          onClick={() => router.push("/login?callbackUrl=/")}
        >
          Continue with Google
        </Button>

        <DialogFooter className="justify-center border-t-0 pt-0 mt-0">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-[#68717C] hover:text-[#9AA3AD] transition-colors"
          >
            Maybe later
          </button>
        </DialogFooter>
      </div>
    </Dialog>
  );
}
