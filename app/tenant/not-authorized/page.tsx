"use client";

import { ShieldExclamationIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

export default function NotAuthorizedPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-200 p-6 text-center">
                <div className="mx-auto flex items-center justify-center w-14 h-14 rounded-full bg-red-100 mb-4">
                    <ShieldExclamationIcon className="w-7 h-7 text-red-600" />
                </div>

                <h1 className="text-xl font-bold text-gray-900 mb-2">
                    Access Denied
                </h1>

                <p className="text-sm text-gray-600 mb-6">
                    This lease does not belong to your account.
                    <br />
                    If you believe this is a mistake, please contact support.
                </p>

                <div className="flex gap-3">
                    <button
                        onClick={() => router.push("/pages/tenant")}
                        className="flex-1 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition"
                    >
                        Go to Dashboard
                    </button>

                    <button
                        onClick={() => router.push("/pages/support")}
                        className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition"
                    >
                        Contact Support
                    </button>
                </div>
            </div>
        </div>
    );
}
