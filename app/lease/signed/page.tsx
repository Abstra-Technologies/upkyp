
"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import useAuthStore from "@/zustand/authStore";

function LeaseSignedContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user, fetchSession } = useAuthStore();
    const event = searchParams.get("event");
    const envelopeId = searchParams.get("envelopeId");

    const [updating, setUpdating] = useState(false);


    useEffect(() => {
        if (!user) {
            fetchSession();
        }
    }, [user?.userType]);


    useEffect(() => {
        if (event === "signing_complete" && envelopeId && user?.userType) {
            setUpdating(true);
            fetch("/api/leaseAgreement/markSigned", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ envelopeId, userType: user.userType }),
            }).finally(() => setUpdating(false));
        }
    }, [event, envelopeId, user?.userType]);


    const cardClasses =
        "bg-white shadow-xl rounded-2xl p-10 max-w-md w-full text-center";

    // ✅ Success
    if (event === "signing_complete") {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cardClasses}
            >
                <h1 className="text-3xl font-bold text-green-600 mb-4">
                    Lease Signed Successfully
                </h1>
                <p className="text-gray-600 mb-6">
                    Envelope ID:{" "}
                    <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
            {envelopeId}
          </span>
                </p>
                {updating ? (
                    <p className="text-blue-500 font-medium animate-pulse">
                        Updating lease status...
                    </p>
                ) : (
                    <button
                        onClick={() => router.push("/pages/landlord/dashboard")}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                    >
                        Back to Dashboard
                    </button>
                )}
            </motion.div>
        );
    }

    // ❌ Cancelled
    if (event === "cancel") {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cardClasses}
            >
                <h1 className="text-3xl font-bold text-red-600 mb-4">
                    Signing Cancelled ❌
                </h1>
                <p className="text-gray-600 mb-6">
                    You exited the signing session before completing.
                </p>
                <button
                    onClick={() => router.push("/lease")}
                    className="px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition"
                >
                    Try Again
                </button>
            </motion.div>
        );
    }

    // ⚪ Fallback (if DocuSign returns something unexpected)
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cardClasses}
        >
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
                Redirected from DocuSign
            </h1>
            <p className="text-gray-600 mb-6">
                We couldn’t determine the signing status. Please check your dashboard.
            </p>
            <button
                onClick={() => router.push("/dashboard")}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
                Go to Dashboard
            </button>
        </motion.div>
    );
}

export default function LeaseSignedPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
            <Suspense fallback={<div className="p-8 text-center">Loading signed lease...</div>}>
                <LeaseSignedContent />
            </Suspense>
        </div>
    );
}
