"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

type VerificationStatus =
    | "pending"
    | "approved"
    | "rejected"
    | "not verified";

export default function LandlordVerificationResultPage() {
    const router = useRouter();
    const [status, setStatus] = useState<VerificationStatus>("pending");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let attempts = 0;
        const MAX_ATTEMPTS = 10;

        const pollStatus = async () => {
            try {
                const res = await axios.get(
                    "/api/landlord/verification/status"
                );

                const newStatus = res.data.status as VerificationStatus;
                setStatus(newStatus);

                if (newStatus === "approved") {
                    setTimeout(() => {
                        router.push("/pages/landlord/dashboard");
                    }, 3000);
                    return;
                }

                if (newStatus === "rejected") {
                    return;
                }

                attempts++;
                if (attempts >= MAX_ATTEMPTS) {
                    setError(
                        "Verification is taking longer than expected. Please refresh later."
                    );
                    return;
                }

            } catch (err) {
                console.error(err);
                setError("Failed to check verification status.");
            }
        };

        // Initial check
        pollStatus();

        // Poll every 3 seconds
        const interval = setInterval(pollStatus, 3000);

        return () => clearInterval(interval);
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center space-y-6">

                {/* PENDING */}
                {status === "pending" && !error && (
                    <>
                        <Loader2 className="w-12 h-12 mx-auto animate-spin text-blue-600" />
                        <h2 className="text-xl font-bold text-gray-900">
                            Finalizing Verification
                        </h2>
                        <p className="text-gray-600">
                            Please wait while we confirm your identity.
                            This usually takes a few seconds.
                        </p>
                    </>
                )}

                {/* APPROVED */}
                {status === "approved" && (
                    <>
                        <CheckCircle2 className="w-14 h-14 mx-auto text-green-600" />
                        <h2 className="text-xl font-bold text-gray-900">
                            Verification Successful
                        </h2>
                        <p className="text-gray-600">
                            Redirecting you to your dashboard…
                        </p>
                    </>
                )}

                {/* REJECTED */}
                {status === "rejected" && (
                    <>
                        <XCircle className="w-14 h-14 mx-auto text-red-600" />
                        <h2 className="text-xl font-bold text-gray-900">
                            Verification Failed
                        </h2>
                        <p className="text-gray-600">
                            We couldn’t verify your identity.
                            Please contact support or try again.
                        </p>

                        <button
                            onClick={() =>
                                router.push("/pages/landlord/verification")
                            }
                            className="mt-4 px-6 py-3 rounded-xl font-semibold
                                       bg-red-600 text-white hover:bg-red-700"
                        >
                            Retry Verification
                        </button>
                    </>
                )}

                {/* ERROR */}
                {error && (
                    <>
                        <XCircle className="w-14 h-14 mx-auto text-red-600" />
                        <h2 className="text-xl font-bold text-gray-900">
                            Something Went Wrong
                        </h2>
                        <p className="text-gray-600">{error}</p>
                    </>
                )}
            </div>
        </div>
    );
}
