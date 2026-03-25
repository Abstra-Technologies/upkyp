"use client";

import {
    FileSignature,
    CalendarRange,
    CheckCircle2,
    ArrowRight,
    X,
} from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

interface Props {
    lease: any;
    onClose: () => void;
    onContinue: (data: any) => void;
}

const formatDateForInput = (date?: string | null) =>
    date ? new Date(date).toISOString().split("T")[0] : "";

export default function ChecklistSetupModal({
                                                 lease,
                                                 onClose,
                                                 onContinue,
                                             }: Props) {
    const agreement_id = lease.lease_id;

    const [loading, setLoading] = useState(false);
    const [showDecision, setShowDecision] = useState(false);
    const [selectedOption, setSelectedOption] = useState<"agreement" | "dates" | null>(null);

    const [form, setForm] = useState({
        lease_agreement: false,
        set_lease_dates: false,
        lease_start_date: "",
        lease_end_date: "",
    });

    const hasInvalidDates: boolean =
        form.set_lease_dates === true &&
        !!form.lease_start_date &&
        !!form.lease_end_date &&
        new Date(form.lease_end_date) < new Date(form.lease_start_date);

    /* ================= LOAD EXISTING ================= */
    useEffect(() => {
        axios
            .get(
                `/api/landlord/activeLease/saveChecklistRequirements?agreement_id=${agreement_id}`
            )
            .then((res) => {
                const r = res.data?.requirements || {};

                const loadedForm = {
                    lease_agreement: r.lease_agreement === 1,
                    set_lease_dates: !!(
                        res.data?.lease_start_date || res.data?.lease_end_date
                    ),
                    lease_start_date: formatDateForInput(res.data?.lease_start_date),
                    lease_end_date: formatDateForInput(res.data?.lease_end_date),
                };

                setForm(loadedForm);

                if (loadedForm.lease_agreement || loadedForm.set_lease_dates) {
                    setShowDecision(true);
                }
            })
            .catch(() => {});
    }, [agreement_id]);

    /* ================= SAVE ================= */
    const handleSave = async () => {
        if (selectedOption === "dates" && hasInvalidDates) {
            Swal.fire({
                icon: "warning",
                title: "Invalid lease dates",
                text: "End date cannot be earlier than the start date.",
            });
            return;
        }

        setLoading(true);
        Swal.fire({
            title: "Saving lease setup...",
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
        });

        try {
            const payload = {
                agreement_id,
                lease_agreement: selectedOption === "agreement",
                move_in_checklist: false,
                move_out_checklist: false,
                // security_deposit: false,
                // advance_payment: false,
                security_deposit: !!form.lease_agreement,
                advance_payment: !!form.lease_agreement,
                lease_start_date: form.set_lease_dates
                    ? form.lease_start_date || null
                    : null,
                lease_end_date: form.set_lease_dates
                    ? form.lease_end_date || null
                    : null,
            };

            await axios.post(
                "/api/landlord/activeLease/saveChecklistRequirements",
                payload
            );

            Swal.close();

            if (selectedOption === "agreement") {
                Swal.fire({
                    icon: "success",
                    title: "Lease setup saved",
                    text: "Continue setting up the lease.",
                }).then(() => onContinue(payload));
            } else {
                Swal.fire({
                    icon: "success",
                    title: "Dates saved",
                    text: "Lease dates have been updated.",
                }).then(onClose);
            }
        } catch {
            Swal.close();
            Swal.fire({
                icon: "error",
                title: "Save failed",
                text: "Please try again.",
            });
        } finally {
            setLoading(false);
        }
    };

    /* ================= RENDER ================= */
    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-emerald-600 px-6 py-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-white">Lease Setup</h2>
                            <p className="text-sm text-white/80 mt-1">
                                Choose how to set up this lease
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {showDecision ? (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Setup Already Exists
                            </h3>
                            <p className="text-sm text-gray-600 mb-6">
                                This lease already has existing setup. You can continue editing or modify the setup.
                            </p>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => onContinue(form)}
                                    className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-semibold flex items-center justify-center gap-2"
                                >
                                    Continue Setup
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setShowDecision(false)}
                                    className="w-full py-3 rounded-xl border border-gray-300 text-gray-700 font-medium"
                                >
                                    Edit Setup
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm text-gray-600 mb-6">
                                Select one option to proceed:
                            </p>

                            {/* Option 1: Lease Agreement */}
                            <button
                                onClick={() => setSelectedOption("agreement")}
                                className={`w-full p-5 rounded-xl border-2 mb-4 text-left transition-all ${
                                    selectedOption === "agreement"
                                        ? "border-blue-500 bg-blue-50"
                                        : "border-gray-200 hover:border-gray-300"
                                }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                                        selectedOption === "agreement"
                                            ? "bg-blue-500"
                                            : "bg-gray-100"
                                    }`}>
                                        <FileSignature className={`w-6 h-6 ${
                                            selectedOption === "agreement"
                                                ? "text-white"
                                                : "text-gray-500"
                                        }`} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900">
                                            Lease Agreement
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Full lease setup with deposits, advance payment, and dates
                                        </p>
                                    </div>
                                    {selectedOption === "agreement" && (
                                        <CheckCircle2 className="w-5 h-5 text-blue-500" />
                                    )}
                                </div>
                            </button>

                            {/* Option 2: Set Dates Only */}
                            <button
                                onClick={() => setSelectedOption("dates")}
                                className={`w-full p-5 rounded-xl border-2 mb-6 text-left transition-all ${
                                    selectedOption === "dates"
                                        ? "border-indigo-500 bg-indigo-50"
                                        : "border-gray-200 hover:border-gray-300"
                                }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                                        selectedOption === "dates"
                                            ? "bg-indigo-500"
                                            : "bg-gray-100"
                                    }`}>
                                        <CalendarRange className={`w-6 h-6 ${
                                            selectedOption === "dates"
                                                ? "text-white"
                                                : "text-gray-500"
                                        }`} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900">
                                            Set Lease Dates Only
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Just set the lease start and end dates
                                        </p>
                                    </div>
                                    {selectedOption === "dates" && (
                                        <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                                    )}
                                </div>
                            </button>

                            {/* Date Fields (if dates selected) */}
                            {selectedOption === "dates" && (
                                <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Lease Start Date <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            value={form.lease_start_date}
                                            onChange={(e) =>
                                                setForm((p) => ({ ...p, lease_start_date: e.target.value }))
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Lease End Date
                                        </label>
                                        <input
                                            type="date"
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            value={form.lease_end_date}
                                            onChange={(e) =>
                                                setForm((p) => ({ ...p, lease_end_date: e.target.value }))
                                            }
                                        />
                                    </div>
                                    {hasInvalidDates && (
                                        <p className="text-xs text-red-600 flex items-center gap-1">
                                            ⚠️ End date cannot be earlier than start date
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-3 rounded-xl border border-gray-300 font-medium text-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={!selectedOption || loading || (selectedOption === "dates" && hasInvalidDates)}
                                    className={`flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 ${
                                        !selectedOption || loading || (selectedOption === "dates" && hasInvalidDates)
                                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                            : "bg-gradient-to-r from-blue-600 to-emerald-600 text-white"
                                    }`}
                                >
                                    {loading ? "Saving..." : "Continue"}
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
