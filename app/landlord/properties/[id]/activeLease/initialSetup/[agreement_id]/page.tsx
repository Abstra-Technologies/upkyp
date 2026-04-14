"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import {
    FileSignature,
    ClipboardList,
    CreditCard,
    CheckCircle,
    Lock,
} from "lucide-react";

import MoveInModal from "@/components/landlord/activeLease/MoveInModal";

export default function LeaseSetupWizard() {
    const router = useRouter();
    const params = useParams();

    const property_id = params.id as string;
    const agreement_id = params.agreement_id as string;

    const [requirements, setRequirements] = useState<any>(null);
    const [documentUploaded, setDocumentUploaded] = useState(false);
    const [moveInDate, setMoveInDate] = useState<string | null>(null);

    const [paymentData, setPaymentData] = useState({
        security_deposit_amount: "",
        security_deposit_months: 1,
        advance_payment_amount: "",
        advance_payment_months: 1,
    });

    const [paymentsSaved, setPaymentsSaved] = useState(false);
    const [moveInModalOpen, setMoveInModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    /* ---------------- LOAD DATA ---------------- */
    useEffect(() => {
        const load = async () => {
            try {
                const [reqRes, moveInRes, payRes] = await Promise.all([
                    axios.get(
                        `/api/landlord/activeLease/saveChecklistRequirements?agreement_id=${agreement_id}`
                    ),
                    axios.get(
                        `/api/landlord/activeLease/moveIn?agreement_id=${agreement_id}`
                    ),
                    axios.get(
                        `/api/landlord/activeLease/initialPayments?agreement_id=${agreement_id}`
                    ),
                ]);

                setRequirements(reqRes.data.requirements || {});
                setDocumentUploaded(reqRes.data.document_uploaded || false);
                setMoveInDate(moveInRes.data.move_in_date || null);

                setPaymentData({
                    security_deposit_amount:
                        payRes.data?.security_deposit_amount || "",
                    security_deposit_months:
                        payRes.data?.security_deposit_months || 1,
                    advance_payment_amount:
                        payRes.data?.advance_payment_amount || "",
                    advance_payment_months:
                        payRes.data?.advance_payment_months || 1,
                });

                setPaymentsSaved(!!payRes.data?.saved);
                setLoading(false);
            } catch (err) {
                console.error("❌ Failed to load lease setup:", err);
            }
        };

        load();
    }, [agreement_id]);

    if (loading || !requirements) {
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-500">
                Loading lease setup…
            </div>
        );
    }

    /* ---------------- SAVE PAYMENTS ---------------- */
    const savePayments = async () => {
        try {
            await axios.post(`/api/landlord/activeLease/initialPayments`, {
                agreement_id,
                ...paymentData,
            });
            setPaymentsSaved(true);
        } catch (e) {
            console.error("❌ Failed to save payments", e);
        }
    };

    /* ---------------- BUILD STEPS ---------------- */
    const steps: any[] = [];

    if (requirements.lease_agreement) {
        steps.push({
            key: "lease",
            title: "Lease Agreement",
            icon: FileSignature,
            completed: documentUploaded,
            render: () =>
                !documentUploaded && (
                    <button
                        onClick={() =>
                            router.push(
                                `/pages/landlord/properties/${property_id}/activeLease/setup?agreement_id=${agreement_id}`
                            )
                        }
                        className="
    w-full mt-3 px-5 py-3
    rounded-xl
    bg-gradient-to-r from-blue-600 to-indigo-600
    text-white font-semibold text-sm
    shadow-md
    hover:from-blue-700 hover:to-indigo-700
    hover:shadow-lg
    active:scale-[0.98]
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
  "
                    >
                        Start Lease Setup
                    </button>

                ),
        });
    }

    if (requirements.move_in_checklist) {
        steps.push({
            key: "movein",
            title: "Move-In Date",
            icon: ClipboardList,
            completed: !!moveInDate,
            render: () => (
                <>
                    {moveInModalOpen && (
                        <MoveInModal
                            agreement_id={agreement_id}
                            defaultDate={moveInDate}
                            onClose={() => setMoveInModalOpen(false)}
                            onSaved={(date: string) => setMoveInDate(date)}
                        />
                    )}
                </>
            ),
            onClick: () => setMoveInModalOpen(true),
        });
    }

    if (requirements.security_deposit || requirements.advance_payment) {
        steps.push({
            key: "payments",
            title: "Initial Payments",
            icon: CreditCard,
            completed: paymentsSaved,
            render: () => (
                <div className="space-y-4 mt-4">
                    {requirements.security_deposit && (
                        <PaymentInput
                            label="Security Deposit"
                            amount={paymentData.security_deposit_amount}
                            months={paymentData.security_deposit_months}
                            onAmountChange={(v) =>
                                setPaymentData((p) => ({
                                    ...p,
                                    security_deposit_amount: v,
                                }))
                            }
                            onMonthsChange={(v) =>
                                setPaymentData((p) => ({
                                    ...p,
                                    security_deposit_months: v,
                                }))
                            }
                        />
                    )}

                    {requirements.advance_payment && (
                        <PaymentInput
                            label="Advance Payment"
                            amount={paymentData.advance_payment_amount}
                            months={paymentData.advance_payment_months}
                            onAmountChange={(v) =>
                                setPaymentData((p) => ({
                                    ...p,
                                    advance_payment_amount: v,
                                }))
                            }
                            onMonthsChange={(v) =>
                                setPaymentData((p) => ({
                                    ...p,
                                    advance_payment_months: v,
                                }))
                            }
                        />
                    )}

                    <button
                        onClick={savePayments}
                        className="w-full py-2.5 rounded-xl font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition"
                    >
                        Save Payments
                    </button>
                </div>
            ),
        });
    }

    /* ---------------- LOCK FLOW ---------------- */
    let unlocked = true;
    const stepsWithState = steps.map((step) => {
        const locked = !unlocked;
        if (!step.completed) unlocked = false;
        return { ...step, locked };
    });

    const allComplete = stepsWithState.every((s) => s.completed);

    /* ---------------- RENDER ---------------- */
    return (
        <div className="min-h-screen bg-gray-50 flex justify-center px-4 py-12">
            <div className="w-full max-w-xl space-y-6">
                {/* HEADER */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Lease Setup Wizard
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">
                        Agreement ID:{" "}
                        <span className="font-mono">{agreement_id}</span>
                    </p>
                </div>

                {/* STEPS */}
                {stepsWithState.map((step, index) => (
                    <StepCard
                        key={step.key}
                        index={index + 1}
                        title={step.title}
                        icon={step.icon}
                        completed={step.completed}
                        locked={step.locked}
                        onClick={!step.locked ? step.onClick : undefined}
                    >
                        {step.render?.()}
                    </StepCard>
                ))}

                {/* COMPLETE */}
                {allComplete && (
                    <div className="bg-green-50 border border-green-300 rounded-2xl p-6 text-center">
                        <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                        <h2 className="text-lg font-semibold text-green-800">
                            Lease Setup Complete
                        </h2>

                        <button
                            onClick={() =>
                                router.push(
                                    `/pages/landlord/properties/${property_id}/activeLease`
                                )
                            }
                            className="w-full mt-5 py-2.5 rounded-xl bg-green-600 text-white hover:bg-green-700 transition"
                        >
                            Back to Active Leases
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ---------------- COMPONENTS ---------------- */

function StepCard({
                      index,
                      title,
                      icon: Icon,
                      completed,
                      locked,
                      children,
                      onClick,
                  }: any) {
    return (
        <div
            onClick={onClick}
            className={`relative bg-white rounded-2xl border p-5 transition
        ${
                completed
                    ? "border-green-400 bg-green-50"
                    : locked
                        ? "opacity-60"
                        : "hover:shadow-md border-gray-200 cursor-pointer"
            }`}
        >
            <div className="flex items-center gap-3 mb-3">
                <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center
            ${
                        completed
                            ? "bg-green-600 text-white"
                            : locked
                                ? "bg-gray-300 text-gray-600"
                                : "bg-blue-600 text-white"
                    }`}
                >
                    {completed ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                </div>

                <h2 className="font-semibold text-gray-900">{title}</h2>

                {locked && <Lock className="ml-auto w-4 h-4 text-gray-400" />}
            </div>

            {children}
        </div>
    );
}

function PaymentInput({
                          label,
                          amount,
                          months,
                          onAmountChange,
                          onMonthsChange,
                      }: any) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {label} Amount
            </label>
            <input
                type="number"
                min="0"
                className="w-full border rounded-lg px-3 py-2 text-sm mb-2"
                value={amount}
                onChange={(e) => onAmountChange(e.target.value)}
            />

            <label className="block text-sm font-medium text-gray-700 mb-1">
                Months Covered
            </label>
            <input
                type="number"
                min="1"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={months}
                onChange={(e) => onMonthsChange(Number(e.target.value))}
            />
        </div>
    );
}
