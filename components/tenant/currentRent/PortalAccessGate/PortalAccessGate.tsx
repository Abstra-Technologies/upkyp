"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
    ExclamationTriangleIcon,
    CheckCircleIcon,
    LockClosedIcon,
    DocumentTextIcon,
    ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import { useLeaseAuthentication } from "@/hooks/tenant/useLeaseAuthentication";

type GateStatus = {
    allowed: boolean;
    reasons: string[];
};

export default function PortalAccessGate({
    agreementId,
}: {
    agreementId?: string;
}) {
    const router = useRouter();
    const [status, setStatus] = useState<GateStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [otpCode, setOtpCode] = useState("");

    const {
        needsSignature,
        isSigned,
        otpSent,
        verifying,
        sendOtp,
        verifyOtp,
    } = useLeaseAuthentication(agreementId);

    /* =====================================================
       CHECK ACCESS GATE
    ===================================================== */
    const checkGate = async () => {
        if (!agreementId) return;

        try {
            const res = await axios.get(
                `/api/tenant/activeRent/access-check?agreement_id=${agreementId}`
            );

            setStatus(res.data);

            if (res.data?.allowed === true) {
                sessionStorage.setItem(
                    `portal_access_ok_${agreementId}`,
                    "true"
                );
            }
        } catch {
            setStatus({
                allowed: false,
                reasons: ["Unable to verify lease requirements"],
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!agreementId) return;

        const cacheKey = `portal_access_ok_${agreementId}`;

        // ✅ Fast path
        if (sessionStorage.getItem(cacheKey) === "true") {
            setStatus({ allowed: true, reasons: [] });
            setLoading(false);
            return;
        }

        checkGate();
    }, [agreementId]);

    /* 🔄 Re-check gate automatically after signing */
    useEffect(() => {
        if (isSigned) {
            checkGate();
        }
    }, [isSigned]);

    /* =====================================================
       RENDER LOGIC
    ===================================================== */

    // ⏭ Access granted
    if (!loading && status?.allowed) return null;

    // ⏳ Checking
    if (loading) {
        return (
            <div className="fixed inset-0 z-50 bg-white/70 backdrop-blur-sm flex items-center justify-center">
                <div className="flex items-center gap-3 text-gray-700">
                    <LockClosedIcon className="w-6 h-6 animate-pulse" />
                    <span className="font-semibold">
                        Checking access requirements…
                    </span>
                </div>
            </div>
        );
    }

    // 🔒 Blocked
    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-amber-100">
                        <ExclamationTriangleIcon className="w-6 h-6 text-amber-600" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">
                        Action Required
                    </h2>
                </div>

                <ul className="space-y-2">
                    {status?.reasons.map((reason, i) => (
                        <li
                            key={i}
                            className="flex items-start gap-2 text-sm text-gray-700"
                        >
                            <CheckCircleIcon className="w-4 h-4 text-amber-500 mt-0.5" />
                            {reason}
                        </li>
                    ))}
                </ul>

                {/* 🔐 LEASE AUTH — FROM HOOK */}
                {needsSignature && (
                    <div className="pt-4 space-y-3">
                        {!otpSent ? (
                            <button
                                onClick={sendOtp}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-lg font-semibold"
                            >
                                <DocumentTextIcon className="w-5 h-5" />
                                Authenticate & Sign Lease
                            </button>
                        ) : (
                            <>
                                <input
                                    value={otpCode}
                                    onChange={(e) =>
                                        setOtpCode(e.target.value)
                                    }
                                    maxLength={6}
                                    className="w-full border p-3 rounded-lg text-center text-xl tracking-[0.3em]"
                                    placeholder="••••••"
                                />

                                <button
                                    onClick={() => verifyOtp(otpCode)}
                                    disabled={verifying}
                                    className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold"
                                >
                                    {verifying
                                        ? "Verifying…"
                                        : "Verify & Unlock"}
                                </button>
                            </>
                        )}
                    </div>
                )}

                <div className="pt-2 text-xs text-gray-500">
                    Access unlocks automatically once requirements are completed.
                </div>

                <button
                    onClick={() => router.push("/tenant/my-unit")}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors"
                >
                    <ArrowLeftIcon className="w-5 h-5" />
                    Back to My Units
                </button>
            </div>
        </div>
    );
}
