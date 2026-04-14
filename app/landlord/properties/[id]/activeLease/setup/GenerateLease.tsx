"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
    FileCog,
    Users,
    AlertTriangle,
    HelpCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

import useOtpHandler from "@/hooks/lease/useOtpHandler";
import useAuthStore from "@/zustand/authStore";
import { useOnboarding } from "@/hooks/useOnboarding";
import { leaseGenerationSteps } from "@/lib/onboarding/leaseGenerationWizard";

/* 🔽 STEP COMPONENTS */
import Step1ContractTerms from "@/components/lease_agreement/Step1ContractTerms";
import Step2AdditionalDetails from "@/components/lease_agreement/Step2AdditionalDetails";
import Step3ReviewConfirm from "@/components/lease_agreement/Step3ReviewConfirm";
import Step4OtpSigning from "@/components/lease_agreement/Step4OtpSigning";
import Step5Success from "@/components/lease_agreement/Step5Success";

export default function GenerateLease({
                                          property_id,
                                          agreement_id,
                                          leaseDetails,
                                      }: any) {
    const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
    const [config, setConfig] = useState<any>(null);
    const [leaseFileUrl, setLeaseFileUrl] = useState("");

    const [form, setForm] = useState<any>({
        rent_amount: "",
        billing_due_day: "",
        grace_period_days: "",
        late_fee_amount: "",
    });

    const [rentChanged, setRentChanged] = useState(false);

    const STORAGE_KEY = `lease_step_${agreement_id}`;
    const router = useRouter();
    const { user } = useAuthStore();

    const {
        otpSent,
        otpCode,
        setOtpCode,
        sendOtp,
        verifyOtp,
        resendOtp,
        cooldown,
        resending,
    } = useOtpHandler({
        agreement_id,
        email: leaseDetails?.landlord_email,
        role: user?.userType,
    });

    /* 🧭 ONBOARDING */
    const { startTour } = useOnboarding({
        tourId: "lease-generation-wizard",
        steps: leaseGenerationSteps,
        autoStart: true,
    });

    /* 🔁 RESTORE STEP */
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && +saved >= 1 && +saved <= 4) {
            setStep(+saved as any);
        }
    }, [agreement_id]);

    useEffect(() => {
        if (step <= 4) localStorage.setItem(STORAGE_KEY, String(step));
        if (step === 5) localStorage.removeItem(STORAGE_KEY);
    }, [step]);

    /* ⚙️ FETCH PROPERTY CONFIG */
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await axios.get(
                    "/api/landlord/properties/getPropertyConfigurations",
                    { params: { property_id } }
                );

                const cfg = res.data?.config || {};
                setConfig(cfg);

                setForm((prev: any) => ({
                    ...prev,
                    rent_amount: leaseDetails?.rent_amount || "",
                    billing_due_day: cfg.billingDueDay || "",
                    grace_period_days: cfg.gracePeriodDays || "",
                    late_fee_amount: cfg.lateFeeAmount || "",
                }));
            } catch {
                Swal.fire("Error", "Failed to load property configuration.", "error");
            }
        };

        fetchConfig();
    }, [property_id, leaseDetails]);

    /* ✏️ FORM CHANGE */
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setForm((prev: any) => ({ ...prev, [name]: value }));

        if (name === "rent_amount") {
            setRentChanged(value !== String(leaseDetails?.rent_amount));
        }
    };

    /* 📄 GENERATE LEASE */
    const handleGenerate = async () => {
        if (!form.attestation) {
            Swal.fire("Missing Attestation", "Please confirm the attestation.", "warning");
            return;
        }

        try {
            const payload = {
                ...form,
                agreement_id,
                property_id,
                rent_changed: rentChanged ? 1 : 0,
                landlord_id: leaseDetails?.landlord_id,
                tenant_id: leaseDetails?.tenant_id,
                unit_id: leaseDetails?.unit_id,
                property_name: leaseDetails?.property_name,
                unit_name: leaseDetails?.unit_name,
            };

            const res = await axios.post(
                "/api/landlord/activeLease/generateLease",
                payload
            );

            if (res.data?.pdf_url) {
                setLeaseFileUrl(res.data.pdf_url);
                setStep(4);
                Swal.fire("Lease Generated", "Lease document created.", "success");
            }
        } catch {
            Swal.fire("Error", "Failed to generate lease.", "error");
        }
    };

    return (
        <div className="bg-white border rounded-2xl shadow-sm p-5">
            {/* HELP */}
            <div className="flex justify-end mb-4">
                <button
                    onClick={startTour}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
                >
                    <HelpCircle className="w-4 h-4" />
                    Show Guide
                </button>
            </div>

            {/* ================= STEP 1 ================= */}
            {step === 1 && (
                <Step1ContractTerms
                    form={form}
                    setForm={setForm}
                    leaseDetails={leaseDetails}
                    config={config}
                    rentChanged={rentChanged}
                    onChange={handleChange}
                    onNext={() => setStep(2)}
                />
            )}


            {/* ================= STEP 2 ================= */}
            {step === 2 && (
                <Step2AdditionalDetails
                    form={form}
                    onChange={handleChange}
                    onBack={() => setStep(1)}
                    onNext={() => setStep(3)}
                />
            )}

            {/* ================= STEP 3 ================= */}
            {step === 3 && (
                <Step3ReviewConfirm
                    form={form}
                    leaseDetails={leaseDetails}
                    rentChanged={rentChanged}
                    onBack={() => setStep(2)}
                    onConfirm={handleGenerate}
                    onAttest={(v) =>
                        setForm((prev: any) => ({ ...prev, attestation: v }))
                    }
                />
            )}

            {/* ================= STEP 4 ================= */}
            {step === 4 && (
                <Step4OtpSigning
                    leaseFileUrl={leaseFileUrl}
                    email={leaseDetails?.landlord_email}
                    otpSent={otpSent}
                    otpCode={otpCode}
                    cooldown={cooldown}
                    resending={resending}
                    onSendOtp={sendOtp}
                    onVerify={() => verifyOtp(() => setStep(5))}
                    onResend={resendOtp}
                    onOtpChange={setOtpCode}
                />
            )}

            {/* ================= STEP 5 ================= */}
            {step === 5 && <Step5Success leaseFileUrl={leaseFileUrl} />}
        </div>
    );
}
