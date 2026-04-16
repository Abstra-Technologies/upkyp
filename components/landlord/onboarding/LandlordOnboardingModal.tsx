"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import axios from "axios";
import Swal from "sweetalert2";
import {
    CheckCircle,
    Clock,
    AlertCircle,
    Wallet,
    FileText,
    Home,
    X,
    Mail,
    Minus,
    Shield,
    Building,
    Sparkles,
    ArrowRight,
    Loader2,
    RefreshCw,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";

import useSubscription from "@/hooks/landlord/useSubscription";
import StepPayoutInfo from "@/components/landlord/verifiication/steps/StepPayoutInfo";
import PlatformAgreementModal from "@/components/landlord/platformAgreement/PlatformAgreementModal";

type VerificationStatus = "incomplete" | "pending" | "rejected" | "verified";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface LandlordOnboardingModalProps {
    landlordId: string;
    emailVerified: boolean;
}

export default function LandlordOnboardingModal({
    landlordId,
    emailVerified: initialEmailVerified,
}: LandlordOnboardingModalProps) {
    const router = useRouter();

    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [showPayoutModal, setShowPayoutModal] = useState(false);
    const [showAgreementModal, setShowAgreementModal] = useState(false);

    const [payoutMethod, setPayoutMethod] = useState("");
    const [accountName, setAccountName] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [bankName, setBankName] = useState("");

    const [otp, setOtp] = useState("");
    const [cooldown, setCooldown] = useState(60);
    const [verifying, setVerifying] = useState(false);
    const [resending, setResending] = useState(false);
    const [emailVerified, setEmailVerified] = useState(initialEmailVerified);

    const { subscription } = useSubscription(landlordId);

    const { data: verification, mutate: mutateVerification } = useSWR(
        landlordId ? `/api/landlord/${landlordId}/profileStatus` : null,
        fetcher
    );

    const { data: payoutRes, mutate: mutatePayout } = useSWR(
        landlordId ? `/api/landlord/payout/${landlordId}` : null,
        fetcher
    );

    const { data: agreementRes, mutate: mutateAgreement } = useSWR(
        landlordId ? `/api/landlord/platformAgreement/${landlordId}` : null,
        fetcher
    );

    const { data: propertiesRes } = useSWR(
        landlordId
            ? `/api/propertyListing/getAllpropertyListing?landlord_id=${landlordId}`
            : null,
        fetcher
    );

    const agreementDone = agreementRes?.accepted === true;
    const verificationStatus: VerificationStatus = verification?.status ?? "incomplete";
    const verificationDone = verificationStatus === "verified";
    const payoutDone = payoutRes?.status === "completed";
    const hasProperty = Array.isArray(propertiesRes) && propertiesRes.length > 0;

    const allCompleted = agreementDone && verificationDone && payoutDone && hasProperty && emailVerified;

    useEffect(() => {
        if (!landlordId) return;

        const allDoneKey = `onboardingAllDone_${landlordId}`;
        const minimizedKey = `onboardingMinimized_${landlordId}`;
        const dismissedKey = `onboardingDismissed_${landlordId}`;

        if (allCompleted) {
            localStorage.setItem(allDoneKey, "true");
            localStorage.removeItem(minimizedKey);
            localStorage.removeItem(dismissedKey);
            setIsOpen(false);
            return;
        }

        const wasAllDone = localStorage.getItem(allDoneKey) === "true";
        const wasMinimized = localStorage.getItem(minimizedKey) === "true";
        const wasDismissed = localStorage.getItem(dismissedKey) === "true";

        if (wasAllDone) return;

        if (!wasDismissed) {
            setIsOpen(true);
        } else if (wasMinimized) {
            setIsMinimized(true);
        }
    }, [landlordId, allCompleted]);

    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setInterval(() => {
            setCooldown((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [cooldown]);

    const formatTime = (seconds: number) => {
        const min = Math.floor(seconds / 60);
        const sec = seconds % 60;
        return `${min}:${sec < 10 ? "0" : ""}${sec}`;
    };

    const handleVerifyOTP = async () => {
        if (otp.length !== 6 || isNaN(Number(otp))) {
            toast.error("OTP must be a 6-digit number");
            return;
        }

        setVerifying(true);

        try {
            const res = await axios.post(
                "/api/auth/verify-otp-reg",
                { otp },
                { withCredentials: true }
            );

            toast.success("Email verified successfully!");
            setEmailVerified(true);
            setOtp("");
        } catch (err: any) {
            toast.error(err.response?.data?.message || "OTP verification failed");
        } finally {
            setVerifying(false);
        }
    };

    const handleResendOTP = async () => {
        if (cooldown > 0) return;

        setResending(true);

        try {
            const res = await axios.post("/api/auth/resend-otp-reg");
            toast.info(res.data.message || "New OTP sent");
            setCooldown(60);
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to resend OTP");
        } finally {
            setResending(false);
        }
    };

    const handleMinimize = () => {
        setIsMinimized(true);
        setIsOpen(false);
        localStorage.setItem(`onboardingMinimized_${landlordId}`, "true");
    };

    const handleExpand = () => {
        setIsMinimized(false);
        setIsOpen(true);
        localStorage.removeItem(`onboardingMinimized_${landlordId}`);
    };

    const handleDismiss = () => {
        setIsOpen(false);
        setIsMinimized(false);
        localStorage.setItem(`onboardingDismissed_${landlordId}`, "true");
    };

    const handleCreateProperty = () => {
        const isFullyVerified = agreementDone && verificationDone && payoutDone;

        if (!isFullyVerified) {
            Swal.fire(
                "Complete Setup First",
                "Please complete all required steps before adding a property.",
                "warning"
            );
            return;
        }

        if (!subscription || subscription.is_active !== 1) {
            Swal.fire({
                title: "Subscription Required",
                text: "You need an active subscription to add properties.",
                icon: "info",
                confirmButtonText: "View Plans",
            }).then((result) => {
                if (result.isConfirmed) {
                    router.push("/pages/landlord/subsciption_plan/pricing");
                }
            });
            return;
        }

        router.push("/pages/landlord/property-listing/create-property");
    };

    const handleStepClick = (key: string) => {
        if (key === "agreement" && !agreementDone) {
            setShowAgreementModal(true);
        } else if (key === "verification" && !verificationDone) {
            window.location.href = "/pages/landlord/verification";
        } else if (key === "payout" && !payoutDone) {
            setShowPayoutModal(true);
        } else if (key === "property" && !hasProperty && agreementDone && verificationDone && payoutDone) {
            handleCreateProperty();
        }
    };

    const setupSteps = [
        {
            key: "agreement",
            title: "Platform Terms",
            description: agreementDone ? "Accepted" : "Accept terms to continue",
            icon: <FileText className="h-5 w-5" />,
            status: agreementDone ? "done" as const : "pending" as const,
            done: agreementDone,
            color: "violet",
        },
        {
            key: "verification",
            title: "Verify Identity",
            description: getVerificationText(verificationStatus),
            icon: getVerificationIcon(verificationStatus),
            status: verificationDone ? "done" as const : verificationStatus === "pending" ? "pending" as const : "pending" as const,
            done: verificationDone,
            color: "blue",
        },
        {
            key: "payout",
            title: "Bank Account",
            description: payoutDone ? "Connected" : "Link to receive payments",
            icon: <Wallet className="h-5 w-5" />,
            status: payoutDone ? "done" as const : "pending" as const,
            done: payoutDone,
            color: "emerald",
        },
        {
            key: "property",
            title: "Add Property",
            description: hasProperty ? "Listed" : "Add your first property",
            icon: <Home className="h-5 w-5" />,
            status: hasProperty ? "done" as const : "pending" as const,
            done: hasProperty,
            color: "orange",
        },
    ];

    const completedSteps = setupSteps.filter((s) => s.done).length;
    const totalSteps = emailVerified ? 4 : 5;
    const progress = emailVerified ? (completedSteps / 4) * 100 : 0;
    const nextStep = setupSteps.find((s) => !s.done)?.key || null;
    const canAddProperty = setupSteps.slice(0, 3).every((s) => s.done);
    const canDismiss = agreementDone && verificationDone && payoutDone;

    if (isMinimized && !isOpen) {
        return (
            <div className="fixed bottom-6 right-6 z-[60] animate-in slide-in-from-bottom-4 fade-in duration-300">
                <button
                    onClick={handleExpand}
                    className="group relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white px-5 py-3 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 flex items-center gap-3"
                >
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-all" />
                    <Sparkles className="h-5 w-5 text-yellow-300" />
                    <span className="font-semibold">Complete Setup</span>
                    <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-sm font-bold">
                        {completedSteps}/4
                    </span>
                </button>
            </div>
        );
    }

    if (!isOpen) return null;

    return (
        <>
            <ToastContainer />

            <div className="fixed inset-0 z-[70] animate-in fade-in duration-200">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => canDismiss && handleDismiss()} />

                <div className="relative h-full w-full flex items-center justify-center p-4">
                    <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 fade-in duration-300">
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50" />
                        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-emerald-500/10 to-blue-500/10 rounded-full blur-3xl" />

                        <div className="relative h-full flex flex-col">
                            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100/80">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                                        <Sparkles className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900">
                                            {emailVerified ? "Complete Your Setup" : "Welcome to Upkyp!"}
                                        </h2>
                                        <p className="text-sm text-gray-500">
                                            {emailVerified
                                                ? `${completedSteps} of 4 steps completed`
                                                : "Verify your email to get started"}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {canDismiss && (
                                        <button
                                            onClick={handleMinimize}
                                            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                                            title="Minimize"
                                        >
                                            <Minus className="h-4 w-4 text-gray-500" />
                                        </button>
                                    )}
                                    <button
                                        onClick={handleDismiss}
                                        className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                                        title="Close"
                                    >
                                        <X className="h-4 w-4 text-gray-500" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                {!emailVerified ? (
                                    <EmailVerificationCard
                                        otp={otp}
                                        setOtp={setOtp}
                                        cooldown={cooldown}
                                        formatTime={formatTime}
                                        verifying={verifying}
                                        resending={resending}
                                        handleVerifyOTP={handleVerifyOTP}
                                        handleResendOTP={handleResendOTP}
                                    />
                                ) : (
                                    <SetupProgressCard
                                        setupSteps={setupSteps}
                                        completedSteps={completedSteps}
                                        progress={progress}
                                        nextStep={nextStep}
                                        canAddProperty={canAddProperty}
                                        onStepClick={handleStepClick}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showAgreementModal && (
                <PlatformAgreementModal
                    landlordId={landlordId}
                    onClose={() => setShowAgreementModal(false)}
                    onAccepted={() => mutateAgreement()}
                />
            )}

            {showPayoutModal && (
                <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/50">
                    <div className="w-full sm:w-auto sm:min-w-0 sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl sm:max-h-[85vh] overflow-hidden flex flex-col">
                        <div className="hidden sm:flex justify-center pt-3">
                            <div className="w-10 h-1 bg-gray-300 rounded-full" />
                        </div>
                        <div className="flex items-center justify-between border-b px-4 py-3">
                            <h3 className="text-sm font-bold">Add Bank Details</h3>
                            <button
                                onClick={() => setShowPayoutModal(false)}
                                className="p-1.5 -mr-1 rounded-lg hover:bg-gray-100"
                            >
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            <StepPayoutInfo
                                landlordId={landlordId}
                                payoutMethod={payoutMethod}
                                setPayoutMethod={setPayoutMethod}
                                accountName={accountName}
                                setAccountName={setAccountName}
                                accountNumber={accountNumber}
                                setAccountNumber={setAccountNumber}
                                bankName={bankName}
                                setBankName={setBankName}
                                onSaved={() => {
                                    setShowPayoutModal(false);
                                    mutatePayout();
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

interface EmailVerificationCardProps {
    otp: string;
    setOtp: (val: string) => void;
    cooldown: number;
    formatTime: (s: number) => string;
    verifying: boolean;
    resending: boolean;
    handleVerifyOTP: () => void;
    handleResendOTP: () => void;
}

function EmailVerificationCard({
    otp,
    setOtp,
    cooldown,
    formatTime,
    verifying,
    resending,
    handleVerifyOTP,
    handleResendOTP,
}: EmailVerificationCardProps) {
    return (
        <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Mail className="h-10 w-10 text-blue-600" />
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Verify Your Email
            </h3>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                We sent a verification code to your email. Enter it below to activate your account.
            </p>

            <div className="flex gap-3 justify-center mb-6">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                    <input
                        key={i}
                        type="text"
                        maxLength={1}
                        value={otp[i] || ""}
                        onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            const newOtp = otp.split("");
                            newOtp[i] = val;
                            const joined = newOtp.join("").slice(0, 6);
                            setOtp(joined);

                            if (val && e.target.nextElementSibling) {
                                (e.target.nextElementSibling as HTMLInputElement).focus();
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Backspace" && !otp[i] && i > 0) {
                                const newOtp = otp.split("");
                                newOtp[i - 1] = "";
                                setOtp(newOtp.join(""));
                                (e.target.previousElementSibling as HTMLInputElement)?.focus();
                            }
                        }}
                        className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all"
                        placeholder="•"
                    />
                ))}
            </div>

            <button
                onClick={handleVerifyOTP}
                disabled={verifying || otp.length !== 6}
                className="w-full max-w-xs mx-auto py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
            >
                {verifying ? (
                    <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Verifying...
                    </>
                ) : (
                    <>
                        Verify Email
                        <ArrowRight className="h-5 w-5" />
                    </>
                )}
            </button>

            <div className="mt-8 pt-6 border-t border-gray-100">
                <p className="text-sm text-gray-400 mb-3">Didn&apos;t receive the code?</p>
                {cooldown > 0 ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                        <RefreshCw className="h-4 w-4" />
                        Resend available in <span className="font-mono font-semibold text-gray-700">{formatTime(cooldown)}</span>
                    </div>
                ) : (
                    <button
                        onClick={handleResendOTP}
                        disabled={resending}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1 mx-auto"
                    >
                        <RefreshCw className={`h-4 w-4 ${resending ? "animate-spin" : ""}`} />
                        {resending ? "Sending..." : "Resend Code"}
                    </button>
                )}
            </div>
        </div>
    );
}

interface SetupProgressCardProps {
    setupSteps: Array<{
        key: string;
        title: string;
        description: string;
        icon: React.ReactNode;
        status: "done" | "pending";
        done: boolean;
        color: string;
    }>;
    completedSteps: number;
    progress: number;
    nextStep: string | null;
    canAddProperty: boolean;
    onStepClick: (key: string) => void;
}

function SetupProgressCard({
    setupSteps,
    completedSteps,
    progress,
    nextStep,
    canAddProperty,
    onStepClick,
}: SetupProgressCardProps) {
    const colorMap: Record<string, { bg: string; border: string; icon: string; ring: string }> = {
        violet: { bg: "bg-violet-50", border: "border-violet-200", icon: "text-violet-600", ring: "ring-violet-500" },
        blue: { bg: "bg-blue-50", border: "border-blue-200", icon: "text-blue-600", ring: "ring-blue-500" },
        emerald: { bg: "bg-emerald-50", border: "border-emerald-200", icon: "text-emerald-600", ring: "ring-emerald-500" },
        orange: { bg: "bg-orange-50", border: "border-orange-200", icon: "text-orange-600", ring: "ring-orange-500" },
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-900">{completedSteps}</span>
                    <span className="text-gray-400">/</span>
                    <span className="text-lg text-gray-500">4</span>
                    <span className="text-sm text-gray-500 ml-1">completed</span>
                </div>
                <div className="text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                    {Math.round(progress)}% Done
                </div>
            </div>

            <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden mb-8">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {setupSteps.map((step) => {
                    const colors = colorMap[step.color];
                    const isNext = nextStep === step.key;
                    const isDisabled = step.key === "property" && !canAddProperty;

                    return (
                        <button
                            key={step.key}
                            onClick={() => !isDisabled && onStepClick(step.key)}
                            disabled={isDisabled}
                            className={`
                                relative p-4 rounded-2xl border-2 text-left transition-all duration-200
                                ${step.done
                                    ? `${colors.bg} ${colors.border} shadow-sm`
                                    : isNext
                                        ? `bg-white ${colors.border} shadow-md ring-2 ${colors.ring}/30`
                                        : "bg-gray-50 border-gray-200 hover:border-gray-300 hover:bg-white"
                                }
                                ${isDisabled ? "opacity-50 cursor-not-allowed" : "hover:scale-[1.02] cursor-pointer"}
                            `}
                        >
                            {isNext && (
                                <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-lg">
                                    Next
                                </div>
                            )}

                            <div className="flex items-start gap-3">
                                <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${step.done ? colors.bg : "bg-gray-100"}`}>
                                    <div className={step.done ? colors.icon : "text-gray-400"}>
                                        {step.icon}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold text-gray-900">{step.title}</p>
                                        {step.done && (
                                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 mt-0.5">{step.description}</p>
                                </div>
                                {!step.done && !isDisabled && (
                                    <ArrowRight className="h-5 w-5 text-gray-400 self-center" />
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            {completedSteps === 4 && (
                <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                            <Sparkles className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div>
                            <h4 className="font-bold text-emerald-900">All Done!</h4>
                            <p className="text-sm text-emerald-700">Your account is fully set up. Start exploring!</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function getVerificationText(status: VerificationStatus) {
    switch (status) {
        case "pending":
            return "Under review";
        case "rejected":
            return "Needs attention";
        case "verified":
            return "Verified";
        default:
            return "Upload ID to verify";
    }
}

function getVerificationIcon(status: VerificationStatus) {
    switch (status) {
        case "verified":
            return <Shield className="h-5 w-5 text-emerald-600" />;
        case "pending":
            return <Clock className="h-5 w-5 text-amber-600" />;
        default:
            return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
}
