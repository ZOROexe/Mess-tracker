"use client";
import { useRouter } from "next/navigation";

interface props {
    onPress: () => void;
    onClose: () => void;
}

export default function LoginModal({onPress, onClose}: props) {
    const router = useRouter();

    return (
        <div className="bg-white p-6 rounded-2xl space-y-4 max-w-sm text-black animate-[scaleIn_0.15s_ease-out]">
            <p className="text-sm text-gray-600">
                Login to track meals and see your monthly summary.
            </p>

            <button
                onClick={() => router.push("/login?callbackUrl=/")}
                className="w-full rounded-xl bg-black py-2 text-white hover:bg-gray-800 transition"
            >
                Continue with Google
            </button>

            <button
                onClick={onClose}
                className="w-full text-sm text-gray-500 hover:text-gray-700"
            >
                Maybe later
            </button>
        </div>
    )
}
