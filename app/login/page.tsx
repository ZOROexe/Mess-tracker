"use client";
import { signIn } from "next-auth/react";

export default function LoginPage() {
    const callbackUrl = "/";
    return (
        <div className="min-h-screen flex items-center justify-center">
            <button
            onClick={() => signIn("google", {callbackUrl})}
            className="px-6 py-3 bg-black text-white rounded"
            >
            Sign in with Google
            </button>
        </div>
    );
}