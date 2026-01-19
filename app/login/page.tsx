"use client";
import { signIn } from "next-auth/react";

export default function LoginPage() {
    const callbackUrl = "/";
    return (
        <div className="min-h-screen flex flex-col items-center justify-center space-y-6">
            <h1 className="text-2xl font-semibold text-white">
                Mess Food Tracker
            </h1>

            <button
                onClick={() => signIn("google", { callbackUrl })}
                className="rounded-xl bg-white px-6 py-3 text-black shadow hover:shadow-md transition"
            >
                Sign in with Google
            </button>
        </div>
    );
}