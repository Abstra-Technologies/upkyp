"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import Swal from "sweetalert2";
import {
    CheckCircle,
    Clock,
    AlertCircle,
    Wallet,
    FileText,
    Home,
    X,
} from "lucide-react";

import useSubscription from "@/hooks/landlord/useSubscription";
import StepPayoutInfo from "@/components/landlord/verifiication/steps/StepPayoutInfo";
import PlatformAgreementModal from "@/components/landlord/platformAgreement/PlatformAgreementModal";

type VerificationStatus = "incomplete" | "pending" | "rejected" | "verified";

interface Props {
    landlordId: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function LandlordOnboarding({ landlordId }: Props) {
    const router = useRouter();

    const [showPayoutModal, setShowPayoutModal] = useState(false);
    const [showAgreementModal, setShowAgreementModal] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    const [payoutMethod, setPayoutMethod] = useState("");
    const [accountName, setAccountName] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [bankName, setBankName] = useState("");

    const { subscription } = useSubscription(landlordId);

    const { data: verification } = useSWR(
        landlordId ? `/api/landlord/${landlordId}/profileStatus` : null,
        fetcher
    );

    const { data: payoutRes, mutate } = useSWR(
        landlordId ? `/api/landlord/payout/${landlordId}` : null,
        fetcher
    );

    const { data: agreementRes, mutate: mutateAgreement } = useSWR(
        landlordId
            ? `/api/landlord/platformAgreement/${landlordId}`
            : null,
        fetcher
    );

    const { data: propertiesRes } = useSWR(
        landlordId
            ? `/api/propertyListing/getAllpropertyListing?landlord_id=${landlordId}`
            : null,
        fetcher
    );

    const agreementDone = agreementRes?.accepted === true;
    const verificationStatus: VerificationStatus =
        verification?.status ?? "incomplete";
    const verificationDone = verificationStatus === "verified";
    const payoutDone = payoutRes?.status === "completed";
    const hasProperty =
        Array.isArray(propertiesRes) && propertiesRes.length > 0;

    const allCompleted =
        agreementDone && verificationDone && payoutDone && hasProperty;

    const shouldShowBanner = !allCompleted && !dismissed;
    const canDismiss = agreementDone && verificationDone && payoutDone;

    useEffect(() => {
        if (!landlordId) return;

        const storageKey = `setupBannerDismissed_${landlordId}`;
        const allDoneKey = `setupBannerAllDone_${landlordId}`;

        if (allCompleted) {
            localStorage.setItem(allDoneKey, "true");
            localStorage.removeItem(storageKey);
            return;
        }

        const wasAllDone = localStorage.getItem(allDoneKey) === "true";
        const isDismissed = localStorage.getItem(storageKey) === "true";

        if (wasAllDone || isDismissed) {
            setDismissed(true);
        }
    }, [landlordId, allCompleted]);

    if (!shouldShowBanner) return null;

    const completedSteps =
        (agreementDone ? 1 : 0) +
        (verificationDone ? 1 : 0) +
        (payoutDone ? 1 : 0) +
        (hasProperty ? 1 : 0);

    const nextStep =
        !agreementDone
            ? "agreement"
            : !verificationDone
                ? "verification"
                : !payoutDone
                    ? "payout"
                    : "property";

    const isFullyVerified =
        agreementDone && verificationDone && payoutDone;

    const handleDismiss = () => {
        localStorage.setItem(`setupBannerDismissed_${landlordId}`, "true");
        setDismissed(true);
    };

    const handleCreateProperty = () => {
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

    return (
        <>
            {/* Main Banner - Mobile Optimized */}
            <div className="mb-4 sm:mb-6 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-50 to-emerald-50 p-1">
                <div className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-5 border border-gray-100 relative">
                    {/* Close Button - Only show when 3 main steps done */}
                    {canDismiss && (
                        <button
                            onClick={handleDismiss}
                            className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-gray-100"
                        >
                            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
                        </button>
                    )}

                    {/* Header */}
                    <div className={`mb-4 sm:mb-5 ${canDismiss ? 'pr-8' : ''}`}>
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <h2 className="text-base sm:text-xl font-bold text-gray-900">
                                    Welcome to Upkyp 👋
                                </h2>
                                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                    Complete the steps below to start receiving rent.
                                </p>
                            </div>
                            <div className="text-[10px] sm:text-sm font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-full whitespace-nowrap">
                                {completedSteps} of 4 steps
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-3 h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
                                style={{ width: `${(completedSteps / 4) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Steps Grid - 2x2 on mobile */}
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 lg:grid-cols-4 sm:gap-3">
                        <StepCard
                            title="Accept Platform Terms"
                            description={
                                agreementDone
                                    ? "Completed"
                                    : "Read and accept our terms"
                            }
                            icon={<FileText className="h-4 w-4" />}
                            status={agreementDone ? "done" : "start"}
                            isNext={nextStep === "agreement"}
                            onClick={() => setShowAgreementModal(true)}
                        />

                        <StepCard
                            title="Verify Your Identity"
                            description={getVerificationText(verificationStatus)}
                            icon={getVerificationIcon(verificationStatus)}
                            status={
                                verificationDone
                                    ? "done"
                                    : verificationStatus === "pending"
                                        ? "pending"
                                        : "start"
                            }
                            isNext={nextStep === "verification"}
                            onClick={() =>
                                !verificationDone &&
                                (window.location.href =
                                    "/landlord/verification")
                            }
                        />

                        <StepCard
                            title="Set Up Your Bank Account"
                            description={
                                payoutDone
                                    ? "Completed"
                                    : "Add your bank details to receive rent"
                            }
                            icon={<Wallet className="h-4 w-4" />}
                            status={payoutDone ? "done" : "start"}
                            isNext={nextStep === "payout"}
                            onClick={() => setShowPayoutModal(true)}
                        />

                        <StepCard
                            title="Add Your First Property"
                            description={
                                hasProperty
                                    ? "Completed"
                                    : isFullyVerified
                                        ? "Add your rental property"
                                        : "Complete setup first"
                            }
                            icon={<Home className="h-4 w-4" />}
                            status={hasProperty ? "done" : "start"}
                            disabled={!isFullyVerified && !hasProperty}
                            isNext={nextStep === "property"}
                            onClick={!hasProperty ? handleCreateProperty : undefined}
                        />
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

            {/* Payout Modal - Mobile Bottom Sheet */}
            {showPayoutModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 sm:bg-black/40">
                    <div className="w-full sm:w-auto sm:min-w-0 sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl sm:max-h-[85vh] overflow-hidden flex flex-col">
                        {/* Handle */}
                        <div className="hidden sm:flex justify-center pt-3">
                            <div className="w-10 h-1 bg-gray-300 rounded-full" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between border-b px-4 py-3">
                            <h3 className="text-sm font-bold">Add Bank Details</h3>
                            <button
                                onClick={() => setShowPayoutModal(false)}
                                className="p-1.5 -mr-1 rounded-lg hover:bg-gray-100"
                            >
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>

                        {/* Content */}
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
                                    mutate();
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

function StepCard({
                      title,
                      description,
                      icon,
                      status,
                      onClick,
                      isNext,
                      disabled,
                  }: {
    title: string;
    description: string;
    icon: React.ReactNode;
    status: "done" | "pending" | "start";
    onClick?: () => void;
    isNext?: boolean;
    disabled?: boolean;
}) {
    const styles = {
        done: "border-green-300 bg-green-50",
        pending: "border-yellow-300 bg-yellow-50",
        start: "border-gray-200 bg-white hover:border-blue-300",
    };

    const iconColors = {
        done: "text-green-600",
        pending: "text-yellow-600",
        start: "text-gray-500",
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`relative rounded-xl border px-2.5 py-2.5 sm:py-3 text-left transition-all ${
                styles[status]
            } ${isNext ? "ring-2 ring-blue-500" : ""} ${
                disabled
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:shadow-md"
            }`}
        >
            {isNext && (
                <span className="absolute top-2 right-2 text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-600 text-white">
                    Next Step
                </span>
            )}

            <div className="flex items-start gap-2.5">
                <div className={`${iconColors[status]} shrink-0 mt-0.5`}>
                    {icon}
                </div>
                <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs font-semibold">{title}</p>
                    <p className="text-[9px] sm:text-[10px] text-gray-500 leading-tight mt-0.5">
                        {description}
                    </p>
                </div>
            </div>
        </button>
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
