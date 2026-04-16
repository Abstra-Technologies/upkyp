"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import axios from "axios";
import {
    CheckCircle,
    Clock,
    AlertCircle,
    Wallet,
    FileText,
    Home,
    X,
    Mail,
    AlertTriangle,
    Shield,
    ChevronRight,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";

import useAuthStore from "@/zustand/authStore";
import useSubscription from "@/hooks/landlord/useSubscription";
import StepPayoutInfo from "@/components/landlord/verifiication/steps/StepPayoutInfo";
import PlatformAgreementModal from "@/components/landlord/platformAgreement/PlatformAgreementModal";

type VerificationStatus = "incomplete" | "pending" | "rejected" | "verified";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface LandlordOnboardingOverlayProps {
    landlordId: string;
    emailVerified: boolean;
}

const STEPS = [
    { key: "email", title: "Verify Email", icon: Mail },
    { key: "agreement", title: "Accept Terms", icon: FileText },
    { key: "verification", title: "Verify Identity", icon: Shield },
    { key: "payout", title: "Bank Account", icon: Wallet },
    { key: "property", title: "Add Property", icon: Home },
];

export default function LandlordOnboardingOverlay({
    landlordId,
    emailVerified: initialEmailVerified,
}: LandlordOnboardingOverlayProps) {
    const router = useRouter();

    const [showPayoutModal, setShowPayoutModal] = useState(false);
    const [showAgreementModal, setShowAgreementModal] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    const [payoutMethod, setPayoutMethod] = useState("");
    const [accountName, setAccountName] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [bankName, setBankName] = useState("");

    const [otp, setOtp] = useState("");
    const [cooldown, setCooldown] = useState(60);
    const [verifying, setVerifying] = useState(false);
    const [resending, setResending] = useState(false);

    const [currentStep, setCurrentStep] = useState(0);

    const { subscription } = useSubscription(landlordId);
    const { fetchSession, updateUser } = useAuthStore();

    const { data: userData, mutate: mutateUser } = useSWR(
        "/api/auth/me",
        fetcher,
        { revalidateOnFocus: true }
    );

    const emailVerified = userData?.emailVerified ?? initialEmailVerified ?? false;

    useEffect(() => {
        if (emailVerified && currentStep === 0) {
            setCurrentStep(1);
        }
    }, [emailVerified, currentStep]);

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
    const canDismiss = emailVerified && allCompleted;

    useEffect(() => {
        if (!landlordId) return;

        if (allCompleted) {
            localStorage.removeItem(`onboardingDismissed_${landlordId}`);
            return;
        }

        const isDismissed = localStorage.getItem(`onboardingDismissed_${landlordId}`) === "true";
        if (isDismissed) {
            setDismissed(true);
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
            updateUser({ emailVerified: true });
            mutateUser();
            fetchSession();
            setCurrentStep(1);
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

    const handleDismiss = () => {
        if (!canDismiss) return;
        setDismissed(true);
        localStorage.setItem(`onboardingDismissed_${landlordId}`, "true");
    };

    const handleStepComplete = (stepKey: string) => {
        const currentIndex = STEPS.findIndex(s => s.key === stepKey);
        if (currentIndex < STEPS.length - 1) {
            setCurrentStep(currentIndex + 1);
        }
    };

    const handleCreateProperty = () => {
        if (!subscription || subscription.is_active !== 1) {
            toast.info("You need an active subscription to add properties.");
            router.push("/landlord/subsciption_plan/pricing");
            return;
        }

        router.push("/landlord/property-listing/create-property");
    };

    const getStepStatus = (stepKey: string) => {
        switch (stepKey) {
            case "email":
                return emailVerified ? "done" : "active";
            case "agreement":
                return agreementDone ? "done" : emailVerified ? "active" : "pending";
            case "verification":
                return verificationDone ? "done" : agreementDone ? "active" : "pending";
            case "payout":
                return payoutDone ? "done" : verificationDone ? "active" : "pending";
            case "property":
                return hasProperty ? "done" : payoutDone ? "active" : "pending";
            default:
                return "pending";
        }
    };

    if (dismissed) return null;

    return (
        <>
            <ToastContainer />

            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

                <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex">
                    <div className="w-64 bg-gradient-to-b from-gray-50 to-gray-100 p-6 border-r border-gray-200 flex-shrink-0">
                        <div className="mb-6">
                            <h3 className="font-bold text-gray-900 mb-1">Setup Progress</h3>
                            <p className="text-xs text-gray-500">
                                {STEPS.filter(s => getStepStatus(s.key) === "done").length} of {STEPS.length} completed
                            </p>
                        </div>

                        <div className="space-y-1">
                            {STEPS.map((step, index) => {
                                const status = getStepStatus(step.key);
                                const isActive = index === currentStep;
                                const Icon = step.icon;

                                return (
                                    <div
                                        key={step.key}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                                            status === "done"
                                                ? "bg-green-50"
                                                : isActive
                                                    ? "bg-blue-50 ring-2 ring-blue-200"
                                                    : "bg-gray-50"
                                        }`}
                                    >
                                        <div className={`shrink-0 ${
                                            status === "done"
                                                ? "text-green-600"
                                                : isActive
                                                    ? "text-blue-600"
                                                    : "text-gray-400"
                                        }`}>
                                            {status === "done" ? (
                                                <CheckCircle className="w-5 h-5" />
                                            ) : (
                                                <Icon className="w-5 h-5" />
                                            )}
                                        </div>
                                        <span className={`text-sm font-medium ${
                                            status === "done"
                                                ? "text-green-700"
                                                : isActive
                                                    ? "text-blue-700"
                                                    : "text-gray-500"
                                        }`}>
                                            {step.title}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex-1 p-6 flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                                    {(() => {
                                        const Icon = STEPS[currentStep]?.icon;
                                        return Icon ? <Icon className="h-5 w-5 text-white" /> : <Shield className="h-5 w-5 text-white" />;
                                    })()}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">{STEPS[currentStep]?.title}</h4>
                                    <p className="text-xs text-gray-500">Step {currentStep + 1} of {STEPS.length}</p>
                                </div>
                            </div>

                            {canDismiss ? (
                                <button
                                    onClick={handleDismiss}
                                    className="p-2 rounded-full hover:bg-gray-100"
                                    title="Dismiss"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            ) : !emailVerified && currentStep === 0 ? null : (
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-full">
                                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                                    <span className="text-xs font-medium text-amber-700">Required</span>
                                </div>
                            )}
                        </div>

                        <div className="flex-1">
                            <StepContent
                                step={STEPS[currentStep]?.key}
                                emailVerified={emailVerified}
                                agreementDone={agreementDone}
                                verificationDone={verificationDone}
                                verificationStatus={verificationStatus}
                                payoutDone={payoutDone}
                                hasProperty={hasProperty}
                                otp={otp}
                                setOtp={setOtp}
                                cooldown={cooldown}
                                formatTime={formatTime}
                                verifying={verifying}
                                resending={resending}
                                handleVerifyOTP={handleVerifyOTP}
                                handleResendOTP={handleResendOTP}
                                onAgreementDone={() => handleStepComplete("agreement")}
                                onVerificationDone={() => handleStepComplete("verification")}
                                onPayoutDone={() => handleStepComplete("payout")}
                                onPropertyAdded={() => handleStepComplete("property")}
                                onOpenAgreement={() => setShowAgreementModal(true)}
                                onOpenVerification={() => window.location.href = "/landlord/verification"}
                                onOpenPayout={() => setShowPayoutModal(true)}
                                onOpenProperty={handleCreateProperty}
                            />
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t">
                            {currentStep > 0 ? (
                                <button
                                    onClick={() => setCurrentStep(prev => prev - 1)}
                                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                                >
                                    Previous
                                </button>
                            ) : <div />}

                            {currentStep < STEPS.length - 1 && (
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span>Complete this step to continue</span>
                                    <ChevronRight className="w-4 h-4" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showAgreementModal && (
                <PlatformAgreementModal
                    landlordId={landlordId}
                    onClose={() => setShowAgreementModal(false)}
                    onAccepted={() => {
                        mutateAgreement();
                        handleStepComplete("agreement");
                        setShowAgreementModal(false);
                    }}
                />
            )}

            {showPayoutModal && (
                <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/50 sm:bg-black/40">
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
                                    handleStepComplete("payout");
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

interface StepContentProps {
    step?: string;
    emailVerified: boolean;
    agreementDone: boolean;
    verificationDone: boolean;
    verificationStatus: VerificationStatus;
    payoutDone: boolean;
    hasProperty: boolean;
    otp: string;
    setOtp: (val: string) => void;
    cooldown: number;
    formatTime: (s: number) => string;
    verifying: boolean;
    resending: boolean;
    handleVerifyOTP: () => void;
    handleResendOTP: () => void;
    onAgreementDone: () => void;
    onVerificationDone: () => void;
    onPayoutDone: () => void;
    onPropertyAdded: () => void;
    onOpenAgreement: () => void;
    onOpenVerification: () => void;
    onOpenPayout: () => void;
    onOpenProperty: () => void;
}

function StepContent({
    step,
    emailVerified,
    agreementDone,
    verificationDone,
    verificationStatus,
    payoutDone,
    hasProperty,
    otp,
    setOtp,
    cooldown,
    formatTime,
    verifying,
    resending,
    handleVerifyOTP,
    handleResendOTP,
    onAgreementDone,
    onVerificationDone,
    onOpenAgreement,
    onOpenVerification,
    onOpenPayout,
    onOpenProperty,
}: StepContentProps) {
    switch (step) {
        case "email":
            return (
                <EmailStep
                    otp={otp}
                    setOtp={setOtp}
                    cooldown={cooldown}
                    formatTime={formatTime}
                    verifying={verifying}
                    resending={resending}
                    handleVerifyOTP={handleVerifyOTP}
                    handleResendOTP={handleResendOTP}
                    emailVerified={emailVerified}
                />
            );
        case "agreement":
            return (
                <div className="h-full flex flex-col">
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                            <FileText className="w-8 h-8 text-blue-600" />
                        </div>
                        <h4 className="text-lg font-bold text-gray-900 mb-2">Accept Platform Usage Terms for Property Owners/Managers</h4>
                        <p className="text-sm text-gray-500 text-center max-w-sm mb-6">
                            Read and accept our terms and conditions to continue with your setup.
                        </p>
                        {agreementDone ? (
                            <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="w-5 h-5" />
                                <span className="font-medium">Completed</span>
                            </div>
                        ) : (
                            <button
                                onClick={onOpenAgreement}
                                className="px-6 py-3 rounded-xl font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all shadow-md"
                            >
                                Read & Accept Terms
                            </button>
                        )}
                    </div>
                </div>
            );
        case "verification":
            return (
                <div className="h-full flex flex-col">
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                            verificationDone ? "bg-green-100" : "bg-blue-100"
                        }`}>
                            {verificationDone ? (
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            ) : (
                                <Shield className="w-8 h-8 text-blue-600" />
                            )}
                        </div>
                        <h4 className="text-lg font-bold text-gray-900 mb-2">Verify Your Identity</h4>
                        <p className="text-sm text-gray-500 text-center max-w-sm mb-6">
                            Upload a valid ID to verify your identity and start managing properties.
                        </p>
                        {verificationDone ? (
                            <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="w-5 h-5" />
                                <span className="font-medium">Identity Verified</span>
                            </div>
                        ) : verificationStatus === "pending" ? (
                            <div className="flex items-center gap-2 text-yellow-600">
                                <Clock className="w-5 h-5" />
                                <span className="font-medium">Under Review</span>
                            </div>
                        ) : (
                            <button
                                onClick={onOpenVerification}
                                className="px-6 py-3 rounded-xl font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all shadow-md"
                            >
                                Start Verification
                            </button>
                        )}
                    </div>
                </div>
            );
        case "payout":
            return (
                <div className="h-full flex flex-col">
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                            payoutDone ? "bg-green-100" : "bg-blue-100"
                        }`}>
                            {payoutDone ? (
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            ) : (
                                <Wallet className="w-8 h-8 text-blue-600" />
                            )}
                        </div>
                        <h4 className="text-lg font-bold text-gray-900 mb-2">Set Up Bank Account</h4>
                        <p className="text-sm text-gray-500 text-center max-w-sm mb-6">
                            Add your bank details to receive rent payments directly.
                        </p>
                        {payoutDone ? (
                            <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="w-5 h-5" />
                                <span className="font-medium">Bank Account Added</span>
                            </div>
                        ) : (
                            <button
                                onClick={onOpenPayout}
                                className="px-6 py-3 rounded-xl font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all shadow-md"
                            >
                                Add Bank Details
                            </button>
                        )}
                    </div>
                </div>
            );
        case "property":
            return (
                <div className="h-full flex flex-col">
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                            hasProperty ? "bg-green-100" : "bg-blue-100"
                        }`}>
                            {hasProperty ? (
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            ) : (
                                <Home className="w-8 h-8 text-blue-600" />
                            )}
                        </div>
                        <h4 className="text-lg font-bold text-gray-900 mb-2">Add Your First Property</h4>
                        <p className="text-sm text-gray-500 text-center max-w-sm mb-6">
                            Add a rental property to start managing tenants and collecting rent.
                        </p>
                        {hasProperty ? (
                            <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="w-5 h-5" />
                                <span className="font-medium">Property Added</span>
                            </div>
                        ) : (
                            <button
                                onClick={onOpenProperty}
                                className="px-6 py-3 rounded-xl font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all shadow-md"
                            >
                                Add Property
                            </button>
                        )}
                    </div>
                </div>
            );
        default:
            return null;
    }
}

interface EmailStepProps {
    otp: string;
    setOtp: (val: string) => void;
    cooldown: number;
    formatTime: (s: number) => string;
    verifying: boolean;
    resending: boolean;
    handleVerifyOTP: () => void;
    handleResendOTP: () => void;
    emailVerified: boolean;
}

function EmailStep({
    otp,
    setOtp,
    cooldown,
    formatTime,
    verifying,
    resending,
    handleVerifyOTP,
    handleResendOTP,
    emailVerified,
}: EmailStepProps) {
    if (emailVerified) {
        return (
            <div className="h-full flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">Email Verified</h4>
                <p className="text-sm text-gray-500 text-center max-w-sm">
                    Your email has been successfully verified.
                </p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <Mail className="w-8 h-8 text-blue-600" />
            </div>
            <h4 className="text-lg font-bold text-gray-900 mb-2">Verify Your Email</h4>
            <p className="text-sm text-gray-500 text-center max-w-sm mb-6">
                Enter the 6-digit code sent to your email address.
            </p>

            <div className="flex gap-2 mb-6">
                {[...Array(6)].map((_, i) => (
                    <input
                        key={i}
                        type="text"
                        maxLength={1}
                        inputMode="numeric"
                        pattern="[0-9]"
                        value={otp[i] || ""}
                        onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            const newOtp = otp.split("");
                            newOtp[i] = val;
                            const updated = newOtp.join("").slice(0, 6);
                            setOtp(updated);
                            
                            if (val && i < 5) {
                                setTimeout(() => {
                                    const nextInput = document.querySelector<HTMLInputElement>(
                                        `input[data-index="${i + 1}"]`
                                    );
                                    nextInput?.focus();
                                }, 10);
                            }
                        }}
                        onKeyDown={(e) => {
                            const input = e.currentTarget;
                            
                            if (e.key === "Backspace" && !otp[i] && i > 0) {
                                e.preventDefault();
                                const prevInput = document.querySelector<HTMLInputElement>(
                                    `input[data-index="${i - 1}"]`
                                );
                                prevInput?.focus();
                            }
                        }}
                        onFocus={(e) => {
                            e.target.select();
                        }}
                        data-index={i}
                        className="w-11 h-12 text-center text-xl font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                        autoComplete="off"
                    />
                ))}
            </div>

            <button
                onClick={handleVerifyOTP}
                disabled={verifying || otp.length !== 6}
                className="px-8 py-3 rounded-xl font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 shadow-md mb-4"
            >
                {verifying ? "Verifying..." : "Verify Email"}
            </button>

            <div className="text-center">
                {cooldown > 0 ? (
                    <p className="text-sm text-gray-500">
                        Resend code in <span className="font-semibold text-gray-900">{formatTime(cooldown)}</span>
                    </p>
                ) : (
                    <button
                        onClick={handleResendOTP}
                        disabled={resending}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                    >
                        {resending ? "Sending..." : "Resend Code"}
                    </button>
                )}
            </div>
        </div>
    );
}
