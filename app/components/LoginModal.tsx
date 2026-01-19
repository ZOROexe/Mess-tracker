"use client";
import { useRouter } from "next/navigation";

interface props {
    onPress: () => void;
    onClose: () => void;
}

export default function LoginModal({onPress, onClose}: props) {
    const router = useRouter();

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white p-5 rounded-lg space-y-3 max-w-sm text-black">
            <p className="text-sm">
                Please log in to add or edit food entries.
            </p>

            <div className="flex justify-end gap-2">
                <button
                    onClick={() => {
                        onClose();
                    }}
                className="px-3 py-1 border rounded"
                >
                Cancel
                </button>

                <button
                    onClick={() => {
                            router.push('/login?callbackUrl=/');
                            onPress();
                        }
                    }
                className="px-3 py-1 bg-black text-white rounded"
                >
                Login
                </button>
            </div>
            </div>
        </div>
    )
}
