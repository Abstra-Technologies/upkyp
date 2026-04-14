"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Swal from "sweetalert2";
import { CheckCircle2, FileText, Loader2 } from "lucide-react";
import useOtpHandler from "@/hooks/lease/useOtpHandler";
import useAuthStore from "@/zustand/authStore";

export default function AuthenticateLeasePage() {
    const router = useRouter();
    const params = useParams() as {
        id?: string;
        agreement_id?: string;
    };

    const id = params.id;
    const agreement_id = params.agreement_id;

    const [leaseDetails, setLeaseDetails] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { user, fetchSession } = useAuthStore();

    useEffect(() => {
        if (!user) fetchSession();
    }, [user, fetchSession]);

    useEffect(() => {
        const fetchLeaseDetails = async () => {
            try {
                const res = await axios.get(`/api/landlord/activeLease/getByAgreementId`, {
                    params: { agreement_id },
                });
                setLeaseDetails(res.data);
            } catch (error: any) {
                console.error("Error fetching lease details:", error);
                Swal.fire("Error", "Failed to fetch lease information.", "error");
            } finally {
                setLoading(false);
            }
        };

        fetchLeaseDetails();
    }, [agreement_id]);

    const {
        otpSent,
        otpCode,
        setOtpCode,
        sendOtp,
        verifyOtp,
        resendOtp,
        cooldown,
        resending,
        alreadySigned,
        checkSignatureStatus,
    } = useOtpHandler({
        agreement_id,
        email: leaseDetails?.landlord_email,
        role: user?.userType,
    });

    useEffect(() => {
        if (leaseDetails?.agreement_id) {
            checkSignatureStatus();
        }
    }, [leaseDetails]);

    const handleSuccess = () => {
        Swal.fire({
            title: "Lease Verified!",
            text: "Your digital signature has been successfully recorded.",
            icon: "success",
            confirmButtonColor: "#059669",
        }).then(() => {
            router.push(`/pages/landlord/properties/${id}/activeLease`);
        });
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh]">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-3" />
                <p className="text-gray-600 text-sm">Loading lease details...</p>
            </div>
        );
    }

    if (!leaseDetails) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh]">
                <p className="text-gray-600 text-center">
                    No lease data found for this agreement.
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 py-10 px-4">
            <div className="max-w-xl mx-auto bg-white border border-gray-200 rounded-2xl shadow-lg p-6 sm:p-8">
                {/* HEADER */}
                <div className="flex items-center justify-center mb-6">
                    <FileText className="w-6 h-6 text-blue-600 mr-2" />
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                        Lease Authentication
                    </h1>
                </div>

                {/* LEASE DETAILS SUMMARY */}
                <div className="text-sm bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5">
                    <p className="text-gray-700 mb-1">
                        <strong>Property:</strong> {leaseDetails.property_name}
                    </p>
                    <p className="text-gray-700 mb-1">
                        <strong>Unit:</strong> {leaseDetails.unit_name}
                    </p>
                    <p className="text-gray-700 mb-1">
                        <strong>Tenant:</strong> {leaseDetails.tenant_name}
                    </p>
                    <p className="text-gray-700 mb-1">
                        <strong>Tenant Email:</strong> {leaseDetails.tenant_email}
                    </p>
                    <p className="text-gray-700 mb-1">
                        <strong>Rent:</strong> ₱{Number(leaseDetails.rent_amount || 0).toLocaleString()}
                    </p>
                    <p className="text-gray-700">
                        <strong>Lease Period:</strong>{" "}
                        {leaseDetails.start_date?.split("T")[0]} – {leaseDetails.end_date?.split("T")[0]}
                    </p>
                </div>

                {/* LEASE FILE LINK */}
                {leaseDetails.agreement_url && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                        <p className="text-gray-600 mb-2">View generated lease document:</p>

                        <div className="w-full mt-2">
                            <iframe
                                src={leaseDetails.agreement_url}
                                className="w-full h-[600px] rounded-lg border border-gray-300 shadow"
                            />
                        </div>

                        <p className="text-xs text-gray-500 mt-2">
                            If the PDF does not load,{" "}
                            <a
                                href={leaseDetails.agreement_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 underline"
                            >
                                open it in a new tab
                            </a>.
                        </p>
                    </div>
                )}


                {/* ✅ If user already signed, show info only */}
                {alreadySigned ? (
                    <div className="text-center bg-green-50 border border-green-200 rounded-lg p-6">
                        <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
                        <h2 className="text-lg font-semibold text-emerald-700">
                            Lease Already Signed
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            You have already verified and signed this lease.
                        </p>
                        <a
                            href={leaseDetails.agreement_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block mt-4 px-6 py-2 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-emerald-700 transition"
                        >
                            View Signed Lease Document
                        </a>
                    </div>
                ) : (
                    <>
                        {/* OTP SECTION */}
                        {!otpSent ? (
                            <>
                                <p className="text-sm text-gray-700 mb-5">
                                    To verify and digitally sign this lease, please authenticate using
                                    the one-time password (OTP) sent to your email:{" "}
                                    <strong>{leaseDetails.landlord_email}</strong>.
                                </p>
                                <button
                                    onClick={sendOtp}
                                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-semibold rounded-lg shadow hover:from-blue-700 hover:to-emerald-700 transition"
                                >
                                    Send OTP
                                </button>

                                <button
                                    onClick={() => router.push(`/pages/landlord/properties/${id}/activeLease`)}
                                    className="w-full mt-6 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                                >
                                    Cancel
                                </button>
                            </>
                        ) : (
                            <>
                                <p className="text-sm text-gray-700 mb-4">
                                    A 6-digit code was sent to{" "}
                                    <strong>{leaseDetails.landlord_email}</strong>. Enter it below to
                                    confirm your digital signature.
                                </p>

                                <input
                                    type="text"
                                    maxLength={6}
                                    value={otpCode}
                                    onChange={(e) =>
                                        setOtpCode(e.target.value.replace(/\D/g, ""))
                                    }
                                    className="w-48 mx-auto text-center text-2xl tracking-widest border rounded-lg p-3 mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="••••••"
                                />

                                <div className="flex flex-col sm:flex-row justify-center gap-3">
                                    <button
                                        onClick={() => verifyOtp(handleSuccess)}
                                        disabled={otpCode.length !== 6}
                                        className={`w-full sm:w-auto px-6 py-3 rounded-lg font-semibold text-white transition ${
                                            otpCode.length === 6
                                                ? "bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700"
                                                : "bg-gray-300 cursor-not-allowed"
                                        }`}
                                    >
                                        Verify & Sign
                                    </button>

                                    <button
                                        onClick={resendOtp}
                                        disabled={cooldown > 0}
                                        className="text-sm text-blue-600 hover:underline mt-2 sm:mt-0"
                                    >
                                        {resending
                                            ? "Resending..."
                                            : cooldown > 0
                                                ? `Resend OTP (${cooldown}s)`
                                                : "Resend OTP"}
                                    </button>
                                </div>
                            </>
                        )}
                    </>
                )}

                {/* FOOTNOTE */}
                {!alreadySigned && (
                    <div className="mt-8 text-center text-gray-600 text-xs">
                        <CheckCircle2 className="inline-block w-4 h-4 text-emerald-600 mr-1" />
                        Your OTP verification digitally signs the lease under your registered email.
                    </div>
                )}
            </div>
        </div>
    );
}
