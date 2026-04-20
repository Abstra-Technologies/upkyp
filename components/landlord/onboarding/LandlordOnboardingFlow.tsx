"use client";

import { useState, useEffect, useCallback } from "react";
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
    ChevronLeft,
    ChevronRight,
    Mail,
    Minus,
    Maximize2,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";

import useSubscription from "@/hooks/landlord/useSubscription";
import StepPayoutInfo from "@/components/landlord/verifiication/steps/StepPayoutInfo";
import PlatformAgreementModal from "@/components/landlord/platformAgreement/PlatformAgreementModal";

type VerificationStatus = "incomplete" | "pending" | "rejected" | "verified";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface LandlordOnboardingFlowProps {
    landlordId: string;
    emailVerified: boolean;
    onComplete?: () => void;
    isStandalone?: boolean;
}

export default function LandlordOnboardingFlow({
    landlordId,
    emailVerified: initialEmailVerified,
    onComplete,
    isStandalone = true,
}: LandlordOnboardingFlowProps) {
    const router = useRouter();

    const [showPayoutModal, setShowPayoutModal] = useState(false);
    const [showAgreementModal, setShowAgreementModal] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    const [payoutMethod, setPayoutMethod] = useState("");
    const [accountName, setAccountName] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [bankName, setBankName] = useState("");

    const [otp, setOtp] = useState("");
    const [cooldown, setCooldown] = useState(60);
    const [verifying, setVerifying] = useState(false);
    const [resending, setResending] = useState(false);
    const [emailVerified, setEmailVerified] = useState(initialEmailVerified);

    const [activeStep, setActiveStep] = useState<"email" | "setup">("email");

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
        if (emailVerified) {
            setActiveStep("setup");
        }
    }, [emailVerified]);

    useEffect(() => {
        if (!landlordId) return;

        const storageKey = `onboardingDismissed_${landlordId}`;
        const allDoneKey = `onboardingAllDone_${landlordId}`;
        const minimizedKey = `onboardingMinimized_${landlordId}`;

        if (allCompleted) {
            localStorage.setItem(allDoneKey, "true");
            localStorage.removeItem(storageKey);
            localStorage.removeItem(minimizedKey);
            onComplete?.();
            return;
        }

        const wasAllDone = localStorage.getItem(allDoneKey) === "true";
        const isDismissed = localStorage.getItem(storageKey) === "true";
        const wasMinimized = localStorage.getItem(minimizedKey) === "true";

        if (wasAllDone) {
            onComplete?.();
            return;
        }

        if (isDismissed) {
            setDismissed(true);
        }

        if (wasMinimized && !isDismissed) {
            setIsMinimized(true);
        }
    }, [landlordId, allCompleted, onComplete]);

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
            setActiveStep("setup");

        } catch (err: any) {
            toast.error(
                err.response?.data?.message || "OTP verification failed"
            );
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
        localStorage.setItem(`onboardingMinimized_${landlordId}`, "true");
    };

    const handleExpand = () => {
        setIsMinimized(false);
        localStorage.removeItem(`onboardingMinimized_${landlordId}`);
    };

    const handleDismiss = () => {
        setDismissed(true);
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
                    router.push("/landlord/subsciption_plan/pricing");
                }
            });
            return;
        }

        router.push("/landlord/property-listing/create-property");
    };

    if (dismissed || (!isStandalone && !isMinimized && allCompleted)) return null;
    if (isStandalone && allCompleted) return null;

    const setupSteps = [
        {
            key: "agreement",
            title: "Accept Platform Terms",
            description: agreementDone ? "Completed" : "Read and accept our terms",
            icon: <FileText className="h-4 w-4" />,
            status: agreementDone ? "done" as const : "start" as const,
            done: agreementDone,
        },
        {
            key: "verification",
            title: "Verify Your Identity",
            description: getVerificationText(verificationStatus),
            icon: getVerificationIcon(verificationStatus),
            status: verificationDone ? "done" as const : verificationStatus === "pending" ? "pending" as const : "start" as const,
            done: verificationDone,
        },
        {
            key: "payout",
            title: "Set Up Bank Account",
            description: payoutDone ? "Completed" : "Add your bank details to receive rent",
            icon: <Wallet className="h-4 w-4" />,
            status: payoutDone ? "done" as const : "start" as const,
            done: payoutDone,
        },
        {
            key: "property",
            title: "Add Your First Property",
            description: hasProperty
                ? "Completed"
                : agreementDone && verificationDone && payoutDone
                    ? "Add your rental property"
                    : "Complete setup first",
            icon: <Home className="h-4 w-4" />,
            status: hasProperty ? "done" as const : "start" as const,
            done: hasProperty,
        },
    ];

    const completedSetupSteps = setupSteps.filter((s) => s.done).length;
    const nextStep = setupSteps.find((s) => !s.done)?.key || "complete";
    const canDismissSetup = agreementDone && verificationDone && payoutDone;

    const handleStepClick = (step: typeof setupSteps[0]) => {
        if (step.key === "agreement" && !agreementDone) {
            setShowAgreementModal(true);
        } else if (step.key === "verification" && !verificationDone) {
            window.location.href = "/landlord/verification";
        } else if (step.key === "payout" && !payoutDone) {
            setShowPayoutModal(true);
        } else if (step.key === "property" && !hasProperty && agreementDone && verificationDone && payoutDone) {
            handleCreateProperty();
        }
    };

    if (isMinimized && !isStandalone) {
        return (
            <div className="fixed bottom-4 right-4 z-50">
                <button
                    onClick={handleExpand}
                    className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 hover:shadow-xl transition-all"
                >
                    <span className="text-sm font-medium">Complete Setup</span>
                    <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                        {completedSetupSteps}/4
                    </span>
                </button>
            </div>
        );
    }

    return (
        <>
            <ToastContainer />

            {isStandalone ? (
                <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
                    <div className="max-w-4xl mx-auto px-4 py-8">
                        <OnboardingContent
                            activeStep={activeStep}
                            setActiveStep={setActiveStep}
                            emailVerified={emailVerified}
                            otp={otp}
                            setOtp={setOtp}
                            cooldown={cooldown}
                            formatTime={formatTime}
                            verifying={verifying}
                            resending={resending}
                            handleVerifyOTP={handleVerifyOTP}
                            handleResendOTP={handleResendOTP}
                            setupSteps={setupSteps}
                            completedSetupSteps={completedSetupSteps}
                            nextStep={nextStep}
                            canDismissSetup={canDismissSetup}
                            handleStepClick={handleStepClick}
                            handleDismiss={handleDismiss}
                            isStandalone={isStandalone}
                        />
                    </div>
                </div>
            ) : (
                <div className="mb-6 sm:mb-8 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-50 to-emerald-50 p-1">
                    <div className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-5 border border-gray-100 relative">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                                {activeStep === "email" ? (
                                    <>
                                        <Mail className="h-5 w-5 text-blue-600" />
                                        Verify Your Email
                                    </>
                                ) : (
                                    <>
                                        Welcome to Upkyp 👋
                                    </>
                                )}
                            </h2>
                            <div className="flex items-center gap-2">
                                {canDismissSetup && (
                                    <button
                                        onClick={handleMinimize}
                                        className="p-1.5 rounded-full hover:bg-gray-100"
                                        title="Minimize"
                                    >
                                        <Minus className="w-4 h-4 text-gray-500" />
                                    </button>
                                )}
                                {canDismissSetup && (
                                    <button
                                        onClick={handleDismiss}
                                        className="p-1.5 rounded-full hover:bg-gray-100"
                                        title="Dismiss"
                                    >
                                        <X className="w-4 h-4 text-gray-500" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {activeStep === "email" ? (
                            <EmailVerificationStep
                                otp={otp}
                                setOtp={setOtp}
                                cooldown={cooldown}
                                formatTime={formatTime}
                                verifying={verifying}
                                resending={resending}
                                handleVerifyOTP={handleVerifyOTP}
                                handleResendOTP={handleResendOTP}
                                onSkip={() => setActiveStep("setup")}
                            />
                        ) : (
                            <SetupStepsGrid
                                setupSteps={setupSteps}
                                completedSetupSteps={completedSetupSteps}
                                nextStep={nextStep}
                                handleStepClick={handleStepClick}
                            />
                        )}
                    </div>
                </div>
            )}

            {showAgreementModal && (
                <PlatformAgreementModal
                    landlordId={landlordId}
                    onClose={() => setShowAgreementModal(false)}
                    onAccepted={() => mutateAgreement()}
                />
            )}

            {showPayoutModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 sm:bg-black/40">
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

interface OnboardingContentProps {
    activeStep: "email" | "setup";
    setActiveStep: (step: "email" | "setup") => void;
    emailVerified: boolean;
    otp: string;
    setOtp: (val: string) => void;
    cooldown: number;
    formatTime: (s: number) => string;
    verifying: boolean;
    resending: boolean;
    handleVerifyOTP: () => void;
    handleResendOTP: () => void;
    setupSteps: Array<{
        key: string;
        title: string;
        description: string;
        icon: React.ReactNode;
        status: "done" | "pending" | "start";
        done: boolean;
    }>;
    completedSetupSteps: number;
    nextStep: string;
    canDismissSetup: boolean;
    handleStepClick: (step: any) => void;
    handleDismiss: () => void;
    isStandalone: boolean;
}

function OnboardingContent({
    activeStep,
    setActiveStep,
    emailVerified,
    otp,
    setOtp,
    cooldown,
    formatTime,
    verifying,
    resending,
    handleVerifyOTP,
    handleResendOTP,
    setupSteps,
    completedSetupSteps,
    nextStep,
    handleStepClick,
    isStandalone,
}: OnboardingContentProps) {
    return (
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="flex border-b">
                <button
                    onClick={() => setActiveStep("email")}
                    className={`flex-1 py-4 px-6 text-sm font-medium transition-colors ${
                        activeStep === "email"
                            ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600"
                            : "text-gray-500 hover:bg-gray-50"
                    }`}
                >
                    <div className="flex items-center justify-center gap-2">
                        <Mail className="h-4 w-4" />
                        1. Verify Email
                    </div>
                    {emailVerified && (
                        <CheckCircle className="h-4 w-4 text-green-500 mx-auto mt-1" />
                    )}
                </button>
                <button
                    onClick={() => setActiveStep("setup")}
                    className={`flex-1 py-4 px-6 text-sm font-medium transition-colors ${
                        activeStep === "setup"
                            ? "bg-emerald-50 text-emerald-600 border-b-2 border-emerald-600"
                            : "text-gray-500 hover:bg-gray-50"
                    }`}
                >
                    <div className="flex items-center justify-center gap-2">
                        <FileText className="h-4 w-4" />
                        2. Complete Setup
                    </div>
                    <div className="text-xs mt-1">
                        {completedSetupSteps}/4 done
                    </div>
                </button>
            </div>

            <div className="p-6 sm:p-8">
                {activeStep === "email" ? (
                    <EmailVerificationStep
                        otp={otp}
                        setOtp={setOtp}
                        cooldown={cooldown}
                        formatTime={formatTime}
                        verifying={verifying}
                        resending={resending}
                        handleVerifyOTP={handleVerifyOTP}
                        handleResendOTP={handleResendOTP}
                        onSkip={emailVerified ? () => setActiveStep("setup") : undefined}
                    />
                ) : (
                    <SetupStepsGrid
                        setupSteps={setupSteps}
                        completedSetupSteps={completedSetupSteps}
                        nextStep={nextStep}
                        handleStepClick={handleStepClick}
                    />
                )}
            </div>
        </div>
    );
}

interface EmailVerificationStepProps {
    otp: string;
    setOtp: (val: string) => void;
    cooldown: number;
    formatTime: (s: number) => string;
    verifying: boolean;
    resending: boolean;
    handleVerifyOTP: () => void;
    handleResendOTP: () => void;
    onSkip?: () => void;
}

function EmailVerificationStep({
    otp,
    setOtp,
    cooldown,
    formatTime,
    verifying,
    resending,
    handleVerifyOTP,
    handleResendOTP,
    onSkip,
}: EmailVerificationStepProps) {
    return (
        <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-50 flex items-center justify-center">
                <Mail className="h-8 w-8 text-blue-600" />
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">
                Verify Your Email Address
            </h3>
            <p className="text-sm text-gray-500 mb-6">
                Enter the 6-digit code sent to your registered email to verify your account.
            </p>

            <input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                maxLength={6}
                inputMode="numeric"
                className="w-full text-center text-3xl tracking-[0.7em] py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all mb-4"
                placeholder="• • • • • •"
            />

            <button
                onClick={handleVerifyOTP}
                disabled={verifying || otp.length !== 6}
                className="w-full py-3 rounded-2xl font-medium text-white bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-700 hover:to-emerald-600 transition-all disabled:opacity-60 shadow-lg mb-6"
            >
                {verifying ? "Verifying..." : "Verify Email"}
            </button>

            <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 uppercase tracking-wider">
                    Didn&apos;t receive the code?
                </span>
                <div className="flex-1 h-px bg-gray-200" />
            </div>

            <div className="mt-4 text-center">
                {cooldown > 0 ? (
                    <p className="text-sm text-gray-500">
                        Request a new code in{" "}
                        <span className="font-semibold text-gray-900">
                            {formatTime(cooldown)}
                        </span>
                    </p>
                ) : (
                    <button
                        onClick={handleResendOTP}
                        disabled={resending}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition"
                    >
                        {resending ? "Resending..." : "Resend Code"}
                    </button>
                )}
            </div>

            {onSkip && (
                <button
                    onClick={onSkip}
                    className="mt-6 text-sm text-gray-500 hover:text-gray-700 underline"
                >
                    Skip for now (you can verify later)
                </button>
            )}
        </div>
    );
}

interface SetupStepsGridProps {
    setupSteps: Array<{
        key: string;
        title: string;
        description: string;
        icon: React.ReactNode;
        status: "done" | "pending" | "start";
        done: boolean;
    }>;
    completedSetupSteps: number;
    nextStep: string;
    handleStepClick: (step: any) => void;
}

function SetupStepsGrid({
    setupSteps,
    completedSetupSteps,
    nextStep,
    handleStepClick,
}: SetupStepsGridProps) {
    const canAddProperty = setupSteps.slice(0, 3).every((s) => s.done);

    return (
        <div>
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600">
                        Complete the steps below to start receiving rent.
                    </p>
                    <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-full">
                        {completedSetupSteps} of 4 steps
                    </span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
                        style={{ width: `${(completedSetupSteps / 4) * 100}%` }}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {setupSteps.map((step) => (
                    <button
                        key={step.key}
                        onClick={() => handleStepClick(step)}
                        disabled={
                            step.key === "property" && !canAddProperty
                        }
                        className={`relative rounded-xl border px-3 py-3 text-left transition-all ${
                            step.status === "done"
                                ? "border-green-300 bg-green-50"
                                : step.status === "pending"
                                    ? "border-yellow-300 bg-yellow-50"
                                    : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-md"
                        } ${
                            nextStep === step.key
                                ? "ring-2 ring-blue-500"
                                : ""
                        } ${
                            step.key === "property" && !canAddProperty
                                ? "opacity-50 cursor-not-allowed"
                                : "cursor-pointer"
                        }`}
                    >
                        {nextStep === step.key && (
                            <span className="absolute top-2 right-2 text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-600 text-white">
                                Next
                            </span>
                        )}

                        <div className="flex items-start gap-2.5">
                            <div
                                className={`shrink-0 mt-0.5 ${
                                    step.status === "done"
                                        ? "text-green-600"
                                        : step.status === "pending"
                                            ? "text-yellow-600"
                                            : "text-gray-500"
                                }`}
                            >
                                {step.icon}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-semibold">{step.title}</p>
                                <p className="text-[10px] text-gray-500 leading-tight mt-0.5">
                                    {step.description}
                                </p>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}

function getVerificationText(status: VerificationStatus) {
    switch (status) {
        case "pending":
            return "Reviewing";
        case "rejected":
            return "Rejected";
        case "verified":
            return "Verified";
        default:
            return "Upload ID";
    }
}

function getVerificationIcon(status: VerificationStatus) {
    switch (status) {
        case "verified":
            return <CheckCircle className="h-4 w-4 text-green-600" />;
        case "pending":
            return <Clock className="h-4 w-4 text-yellow-600" />;
        default:
            return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
}
