"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";

import useAuthStore from "@/zustand/authStore";
import PlatformAgreementModal from "@/components/landlord/platformAgreement/PlatformAgreementModal";
import StepPayoutInfo from "@/components/landlord/verifiication/steps/StepPayoutInfo";

import { FiCheck, FiChevronRight, FiHome, FiShield, FiCreditCard, FiUser, FiArrowLeft, FiSkipForward } from "react-icons/fi";
import { IoBusiness, IoWallet, IoPeople, IoBarChart, IoMegaphone, IoHome } from "react-icons/io5";

type VerificationStatus = "incomplete" | "pending" | "rejected" | "verified";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type StepId = "welcome" | "profile" | "verification" | "payout" | "property" | "complete";

interface StepConfig {
    id: StepId;
    title: string;
    subtitle: string;
}

const STEPS: StepConfig[] = [
    { id: "welcome", title: "Welcome", subtitle: "Set up your account" },
    { id: "profile", title: "Your Profile", subtitle: "Tell us about yourself" },
    { id: "verification", title: "Verify Identity", subtitle: "Secure your account" },
    { id: "payout", title: "Link Bank Account", subtitle: "Receive rent payments" },
    { id: "property", title: "Add Property", subtitle: "Start managing" },
    { id: "complete", title: "You're All Set", subtitle: "Ready to go" },
];

export default function LandlordOnboardingPage() {
    const router = useRouter();
    const { user, fetchSession } = useAuthStore();
    const landlordId = user?.landlord_id ?? "";

    const [currentStep, setCurrentStep] = useState<StepId>("welcome");
    const [isTransitioning, setIsTransitioning] = useState(false);

    const [showAgreementModal, setShowAgreementModal] = useState(false);
    const [showPayoutModal, setShowPayoutModal] = useState(false);

    const [portfolioSize, setPortfolioSize] = useState("");
    const [experienceLevel, setExperienceLevel] = useState("");
    const [primaryGoals, setPrimaryGoals] = useState<string[]>([]);
    const [propertyName, setPropertyName] = useState("");

    const { data: verification } = useSWR(
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
    const { data: propertiesRes, mutate: mutateProperties } = useSWR(
        landlordId ? `/api/propertyListing/getAllpropertyListing?landlord_id=${landlordId}` : null,
        fetcher
    );

    const verificationStatus: VerificationStatus = verification?.status ?? "incomplete";
    const verificationDone = verificationStatus === "verified";
    const payoutDone = payoutRes?.status === "completed";
    const agreementDone = agreementRes?.accepted === true;
    const hasProperty = Array.isArray(propertiesRes) && propertiesRes.length > 0;

    useEffect(() => {
        if (!user) {
            fetchSession();
        }
    }, [user, fetchSession]);

    const navigateToStep = useCallback((step: StepId) => {
        setIsTransitioning(true);
        setTimeout(() => {
            setCurrentStep(step);
            setIsTransitioning(false);
        }, 200);
    }, []);

    const goToNextStep = useCallback(() => {
        const stepOrder: StepId[] = ["welcome", "profile", "verification", "payout", "property", "complete"];
        const currentIndex = stepOrder.indexOf(currentStep);
        if (currentIndex < stepOrder.length - 1) {
            navigateToStep(stepOrder[currentIndex + 1]);
        }
    }, [currentStep, navigateToStep]);

    const goToPrevStep = useCallback(() => {
        const stepOrder: StepId[] = ["welcome", "profile", "verification", "payout", "property", "complete"];
        const currentIndex = stepOrder.indexOf(currentStep);
        if (currentIndex > 0) {
            navigateToStep(stepOrder[currentIndex - 1]);
        }
    }, [currentStep, navigateToStep]);

    const toggleGoal = (goal: string) => {
        setPrimaryGoals(prev =>
            prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
        );
    };

    const handleSaveProfile = async () => {
        try {
            await axios.post("/api/landlord/onboarding/save", {
                landlordId,
                portfolioSize,
                experienceLevel,
                primaryGoals,
            });
            goToNextStep();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to save profile");
        }
    };

    const handleAddProperty = () => {
        router.push("/landlord/properties/create-property?onboarding=true");
    };

    const stepIndex = STEPS.findIndex((s) => s.id === currentStep);
    const progress = ((stepIndex + 1) / STEPS.length) * 100;

    if (!user || !landlordId) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/30">
                <div className="text-center">
                    <div className="w-10 h-10 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-sm text-gray-500 font-medium">Loading your workspace...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-emerald-50/20">
            <ToastContainer />

            {/* Progress Bar */}
            <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200/50 z-50">
                <div
                    className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md border-b border-gray-200/50 z-40 shadow-sm">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {currentStep !== "welcome" && currentStep !== "complete" && (
                            <button
                                onClick={goToPrevStep}
                                className="p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <FiArrowLeft className="w-4 h-4 text-gray-600" />
                            </button>
                        )}
                        <div>
                            <h1 className="text-sm font-semibold text-gray-900">
                                {STEPS[stepIndex]?.title}
                            </h1>
                            <p className="text-xs text-gray-500">
                                {STEPS[stepIndex]?.subtitle}
                            </p>
                        </div>
                    </div>
                    <span className="text-xs text-gray-400 font-medium">
                        {stepIndex + 1} / {STEPS.length}
                    </span>
                </div>
            </header>

            {/* Main Content */}
            <main className="pt-20 pb-16 px-4 sm:px-6">
                <div
                    className={`max-w-2xl mx-auto transition-all duration-200 ${
                        isTransitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
                    }`}
                >
                    {currentStep === "welcome" && (
                        <WelcomeStep onNext={() => navigateToStep("profile")} />
                    )}

                    {currentStep === "profile" && (
                        <ProfileStep
                            portfolioSize={portfolioSize}
                            setPortfolioSize={setPortfolioSize}
                            experienceLevel={experienceLevel}
                            setExperienceLevel={setExperienceLevel}
                            primaryGoals={primaryGoals}
                            toggleGoal={toggleGoal}
                            onNext={handleSaveProfile}
                            onSkip={() => navigateToStep("verification")}
                        />
                    )}

                    {currentStep === "verification" && (
                        <VerificationStep
                            verificationDone={verificationDone}
                            verificationStatus={verificationStatus}
                            agreementDone={agreementDone}
                            onNext={() => navigateToStep("payout")}
                            onOpenAgreement={() => setShowAgreementModal(true)}
                            onOpenVerification={() => router.push("/landlord/verification")}
                            onSkip={() => navigateToStep("payout")}
                        />
                    )}

                    {currentStep === "payout" && (
                        <PayoutStep
                            payoutDone={payoutDone}
                            landlordId={landlordId}
                            onNext={() => navigateToStep("property")}
                            onOpenModal={() => setShowPayoutModal(true)}
                            onSkip={() => navigateToStep("property")}
                        />
                    )}

                    {currentStep === "property" && (
                        <PropertyStep
                            hasProperty={hasProperty}
                            onNext={() => navigateToStep("complete")}
                            onSkip={() => navigateToStep("complete")}
                            onGoToCreateProperty={handleAddProperty}
                        />
                    )}

                    {currentStep === "complete" && (
                        <CompleteStep onGoToDashboard={() => router.push("/landlord/dashboard")} />
                    )}
                </div>
            </main>

            {/* Modals */}
            {showAgreementModal && (
                <PlatformAgreementModal
                    landlordId={landlordId}
                    onClose={() => setShowAgreementModal(false)}
                    onAccepted={() => {
                        setShowAgreementModal(false);
                        mutateAgreement();
                    }}
                />
            )}

            {showPayoutModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
                    <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[85vh] flex flex-col">
                        <div className="flex justify-center pt-3">
                            <div className="w-10 h-1 bg-gray-300 rounded-full" />
                        </div>
                        <div className="flex items-center justify-between border-b px-4 py-3">
                            <h3 className="text-sm font-bold">Add Bank Details</h3>
                            <button
                                onClick={() => setShowPayoutModal(false)}
                                className="p-1.5 rounded-lg hover:bg-gray-100"
                            >
                                <FiCheck className="w-4 h-4 text-gray-500 rotate-45" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            <StepPayoutInfo
                                landlordId={landlordId}
                                payoutMethod=""
                                setPayoutMethod={() => {}}
                                accountName=""
                                setAccountName={() => {}}
                                accountNumber=""
                                setAccountNumber={() => {}}
                                bankName=""
                                setBankName={() => {}}
                                onSaved={() => {
                                    setShowPayoutModal(false);
                                    mutatePayout();
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ==================== STEP COMPONENTS ==================== */

function WelcomeStep({ onNext }: { onNext: () => void }) {
    return (
        <div className="text-center py-8 sm:py-12">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <IoBusiness className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                Welcome to Upkyp
            </h2>
            <p className="text-base sm:text-lg text-gray-500 mb-8 max-w-md mx-auto px-4">
                Your property management workspace is almost ready. Let's get you set up in just a few minutes.
            </p>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 sm:p-6 mb-8 text-left max-w-sm mx-auto shadow-sm border border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">What you'll get</p>
                <div className="space-y-3">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center flex-shrink-0">
                            <IoHome className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-900">Manage Properties</p>
                            <p className="text-xs text-gray-500">Track units, leases, and maintenance</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center flex-shrink-0">
                            <IoWallet className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-900">Collect Rent</p>
                            <p className="text-xs text-gray-500">Automated payments and payouts</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center flex-shrink-0">
                            <IoPeople className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-900">Tenant Portal</p>
                            <p className="text-xs text-gray-500">Self-service for your tenants</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center flex-shrink-0">
                            <IoBarChart className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-900">Analytics</p>
                            <p className="text-xs text-gray-500">Insights into your portfolio</p>
                        </div>
                    </div>
                </div>
            </div>

            <button
                onClick={onNext}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-gray-900 to-gray-800 text-white font-medium rounded-xl hover:from-gray-800 hover:to-gray-700 transition-all active:scale-[0.98] shadow-lg shadow-gray-900/10"
            >
                Get Started
                <FiChevronRight className="w-4 h-4" />
            </button>
        </div>
    );
}

function ProfileStep({
    portfolioSize,
    setPortfolioSize,
    experienceLevel,
    setExperienceLevel,
    primaryGoals,
    toggleGoal,
    onNext,
    onSkip,
}: {
    portfolioSize: string;
    setPortfolioSize: (v: string) => void;
    experienceLevel: string;
    setExperienceLevel: (v: string) => void;
    primaryGoals: string[];
    toggleGoal: (v: string) => void;
    onNext: () => void;
    onSkip: () => void;
}) {
    const canContinue = portfolioSize && experienceLevel && primaryGoals.length > 0;

    return (
        <div className="py-6 sm:py-8">
            <div className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Tell us about yourself</h2>
                <p className="text-sm sm:text-base text-gray-500">This helps us personalize your experience.</p>
            </div>

            <div className="space-y-6 sm:space-y-8">
                {/* Portfolio Size */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100">
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                        How many properties do you manage?
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { value: "1", label: "1 property" },
                            { value: "2-5", label: "2-5 properties" },
                            { value: "6-20", label: "6-20 properties" },
                            { value: "20+", label: "20+ properties" },
                        ].map((option) => (
                            <button
                                key={option.value}
                                onClick={() => setPortfolioSize(option.value)}
                                className={`px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl border text-sm font-medium transition-all ${
                                    portfolioSize === option.value
                                        ? "border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100/50 text-blue-700 ring-2 ring-blue-200 shadow-sm"
                                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700"
                                }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Experience Level */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100">
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                        What's your experience level?
                    </label>
                    <div className="space-y-2">
                        {[
                            { value: "new", label: "Just starting out", desc: "New to property management" },
                            { value: "some", label: "Some experience", desc: "Managing a few properties" },
                            { value: "experienced", label: "Experienced", desc: "Years of property management" },
                        ].map((option) => (
                            <button
                                key={option.value}
                                onClick={() => setExperienceLevel(option.value)}
                                className={`w-full px-4 py-3 rounded-xl border text-left transition-all ${
                                    experienceLevel === option.value
                                        ? "border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100/50 ring-2 ring-blue-200 shadow-sm"
                                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                }`}
                            >
                                <p className={`text-sm font-medium ${experienceLevel === option.value ? "text-blue-700" : "text-gray-900"}`}>
                                    {option.label}
                                </p>
                                <p className="text-xs text-gray-500">{option.desc}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Primary Goals - Multi Select */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100">
                    <label className="block text-sm font-semibold text-gray-900 mb-1">
                        What are your goals?
                    </label>
                    <p className="text-xs text-gray-500 mb-3">Select all that apply</p>
                    <div className="space-y-2">
                        {[
                            { value: "organize", label: "Centralize my data", desc: "Keep all property info, leases, and documents in one place", icon: <IoBusiness className="w-4 h-4" /> },
                            { value: "automate", label: "Automate rent collection", desc: "Set up recurring payments and reduce manual tracking", icon: <IoWallet className="w-4 h-4" /> },
                            { value: "reduce_vacancy", label: "Reduce vacancy rates", desc: "Fill empty units faster and minimize income gaps", icon: <IoHome className="w-4 h-4" /> },
                            { value: "scale", label: "Scale my portfolio", desc: "Grow from a few units to a larger property business", icon: <IoBarChart className="w-4 h-4" /> },
                            { value: "communicate", label: "Better tenant communication", desc: "Streamline announcements, requests, and feedback", icon: <IoMegaphone className="w-4 h-4" /> },
                            { value: "maintenance", label: "Streamline maintenance", desc: "Track and resolve repair requests efficiently", icon: <IoPeople className="w-4 h-4" /> },
                            { value: "analytics", label: "Track financial performance", desc: "Monitor revenue, expenses, and profitability", icon: <IoBarChart className="w-4 h-4" /> },
                            { value: "compliance", label: "Stay compliant", desc: "Manage leases, deposits, and legal requirements with ease", icon: <FiShield className="w-4 h-4" /> },
                        ].map((option) => {
                            const isSelected = primaryGoals.includes(option.value);
                            return (
                                <button
                                    key={option.value}
                                    onClick={() => toggleGoal(option.value)}
                                    className={`w-full flex items-start gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                                        isSelected
                                            ? "border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100/50 ring-2 ring-blue-200 shadow-sm"
                                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                    }`}
                                >
                                    <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                                        isSelected ? "bg-blue-600" : "border-2 border-gray-300"
                                    }`}>
                                        {isSelected && <FiCheck className="w-3 h-3 text-white" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className={isSelected ? "text-blue-600" : "text-gray-400"}>
                                                {option.icon}
                                            </span>
                                            <span className={`text-sm font-medium ${isSelected ? "text-blue-700" : "text-gray-900"}`}>
                                                {option.label}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 leading-tight">{option.desc}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between mt-8 sm:mt-10 pt-6 border-t border-gray-200/50">
                <button
                    onClick={onSkip}
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                    <FiSkipForward className="w-4 h-4" />
                    Skip for now
                </button>
                <button
                    onClick={onNext}
                    disabled={!canContinue}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-900 to-gray-800 text-white font-medium rounded-xl hover:from-gray-800 hover:to-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] shadow-lg shadow-gray-900/10"
                >
                    Continue
                    <FiChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

function PropertyStep({
    hasProperty,
    onNext,
    onSkip,
    onGoToCreateProperty,
}: {
    hasProperty: boolean;
    onNext: () => void;
    onSkip: () => void;
    onGoToCreateProperty: () => void;
}) {
    if (hasProperty) {
        return (
            <div className="py-12 text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <FiHome className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Property Added</h2>
                <p className="text-gray-500 mb-8">You already have a property set up.</p>
                <button
                    onClick={onNext}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-900 to-gray-800 text-white font-medium rounded-xl hover:from-gray-800 hover:to-gray-700 transition-all active:scale-[0.98] shadow-lg shadow-gray-900/10"
                >
                    Continue
                    <FiChevronRight className="w-4 h-4" />
                </button>
            </div>
        );
    }

    return (
        <div className="py-6 sm:py-8">
            <div className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Add your first property</h2>
                <p className="text-sm sm:text-base text-gray-500">Start by adding the property you want to manage.</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl p-5 mb-8 border border-emerald-200/50">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <IoBusiness className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-emerald-900 mb-1">Why this matters</p>
                        <p className="text-sm text-emerald-700">
                            Adding your property is the first step to managing tenants, collecting rent, and tracking maintenance all in one place.
                        </p>
                    </div>
                </div>
            </div>

            <button
                onClick={onGoToCreateProperty}
                className="w-full py-3.5 bg-gradient-to-r from-gray-900 to-gray-800 text-white font-medium rounded-xl hover:from-gray-800 hover:to-gray-700 transition-all active:scale-[0.98] mb-4 shadow-lg shadow-gray-900/10"
            >
                Add Property
            </button>

            <div className="flex justify-center">
                <button
                    onClick={onSkip}
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                    <FiSkipForward className="w-4 h-4" />
                    Do this later
                </button>
            </div>
        </div>
    );
}

function PayoutStep({
    payoutDone,
    landlordId,
    onNext,
    onOpenModal,
    onSkip,
}: {
    payoutDone: boolean;
    landlordId: string;
    onNext: () => void;
    onOpenModal: () => void;
    onSkip: () => void;
}) {
    if (payoutDone) {
        return (
            <div className="py-12 text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <FiCreditCard className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Setup Complete</h2>
                <p className="text-gray-500 mb-8">Your bank account is ready to receive rent payments.</p>
                <button
                    onClick={onNext}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-900 to-gray-800 text-white font-medium rounded-xl hover:from-gray-800 hover:to-gray-700 transition-all active:scale-[0.98] shadow-lg shadow-gray-900/10"
                >
                    Continue
                    <FiChevronRight className="w-4 h-4" />
                </button>
            </div>
        );
    }

    return (
        <div className="py-6 sm:py-8">
            <div className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Set up payments</h2>
                <p className="text-sm sm:text-base text-gray-500">Add your bank account to receive rent payments from tenants.</p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-5 mb-8 border border-blue-200/50">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <IoWallet className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-blue-900 mb-1">Why this matters</p>
                        <p className="text-sm text-blue-700">
                            Setting up your bank account enables automatic rent collection. Tenants can pay directly through the platform and funds are deposited to your account.
                        </p>
                    </div>
                </div>
            </div>

            <button
                onClick={onOpenModal}
                className="w-full py-3.5 bg-gradient-to-r from-gray-900 to-gray-800 text-white font-medium rounded-xl hover:from-gray-800 hover:to-gray-700 transition-all active:scale-[0.98] mb-4 shadow-lg shadow-gray-900/10"
            >
                Add Bank Account
            </button>

            <div className="flex justify-center">
                <button
                    onClick={onSkip}
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                    <FiSkipForward className="w-4 h-4" />
                    Do this later
                </button>
            </div>
        </div>
    );
}

function VerificationStep({
    verificationDone,
    verificationStatus,
    agreementDone,
    onNext,
    onOpenAgreement,
    onOpenVerification,
    onSkip,
}: {
    verificationDone: boolean;
    verificationStatus: VerificationStatus;
    agreementDone: boolean;
    onNext: () => void;
    onOpenAgreement: () => void;
    onOpenVerification: () => void;
    onSkip: () => void;
}) {
    if (verificationDone && agreementDone) {
        return (
            <div className="py-12 text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <FiShield className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Identity Verified</h2>
                <p className="text-gray-500 mb-8">Your identity has been verified and terms accepted.</p>
                <button
                    onClick={onNext}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-900 to-gray-800 text-white font-medium rounded-xl hover:from-gray-800 hover:to-gray-700 transition-all active:scale-[0.98] shadow-lg shadow-gray-900/10"
                >
                    Continue
                    <FiChevronRight className="w-4 h-4" />
                </button>
            </div>
        );
    }

    return (
        <div className="py-6 sm:py-8">
            <div className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Verify your identity</h2>
                <p className="text-sm sm:text-base text-gray-500">Complete these final steps to secure your account.</p>
            </div>

            <div className="space-y-4">
                {!agreementDone && (
                    <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0">
                                <FiUser className="w-5 h-5 text-gray-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-900 mb-1">Accept Platform Terms</p>
                                <p className="text-xs text-gray-500 mb-3">Read and accept our terms and conditions.</p>
                                <button
                                    onClick={onOpenAgreement}
                                    className="px-4 py-2 bg-gradient-to-r from-gray-900 to-gray-800 text-white text-sm font-medium rounded-lg hover:from-gray-800 hover:to-gray-700 transition-all shadow-sm"
                                >
                                    Review & Accept
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {!verificationDone && (
                    <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0">
                                <FiShield className="w-5 h-5 text-gray-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-900 mb-1">
                                    {verificationStatus === "pending" ? "Verification Pending" : "Verify Identity"}
                                </p>
                                <p className="text-xs text-gray-500 mb-3">
                                    {verificationStatus === "pending"
                                        ? "Your documents are under review."
                                        : "Upload a valid ID to verify your identity."}
                                </p>
                                {verificationStatus !== "pending" && (
                                    <button
                                        onClick={onOpenVerification}
                                        className="px-4 py-2 bg-gradient-to-r from-gray-900 to-gray-800 text-white text-sm font-medium rounded-lg hover:from-gray-800 hover:to-gray-700 transition-all shadow-sm"
                                    >
                                        Start Verification
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-center mt-8">
                <button
                    onClick={onSkip}
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                    <FiSkipForward className="w-4 h-4" />
                    Complete later
                </button>
            </div>
        </div>
    );
}

function CompleteStep({ onGoToDashboard }: { onGoToDashboard: () => void }) {
    return (
        <div className="py-8 sm:py-12 text-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-blue-600 to-emerald-500 flex items-center justify-center shadow-xl shadow-blue-500/25">
                <FiCheck className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">You're all set!</h2>
            <p className="text-base sm:text-lg text-gray-500 mb-8 max-w-md mx-auto px-4">
                Your workspace is ready. Start managing your properties and tenants with ease.
            </p>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 sm:p-6 mb-8 text-left max-w-sm mx-auto shadow-sm border border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Quick start guide</p>
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">1</div>
                        <p className="text-sm text-gray-700">Add your property details and units</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">2</div>
                        <p className="text-sm text-gray-700">Invite your tenants to the platform</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">3</div>
                        <p className="text-sm text-gray-700">Set up automated rent collection</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">4</div>
                        <p className="text-sm text-gray-700">Monitor everything from your dashboard</p>
                    </div>
                </div>
            </div>

            <button
                onClick={onGoToDashboard}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-gray-900 to-gray-800 text-white font-medium rounded-xl hover:from-gray-800 hover:to-gray-700 transition-all active:scale-[0.98] shadow-lg shadow-gray-900/10"
            >
                Go to Dashboard
                <FiChevronRight className="w-4 h-4" />
            </button>
        </div>
    );
}
