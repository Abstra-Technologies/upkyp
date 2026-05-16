"use client";

import {
    FileSignature,
    CalendarRange,
    CheckCircle2,
    ArrowRight,
    X,
    Eye,
    Pencil,
    Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Swal from "sweetalert2";

interface Props {
    open: boolean;
    lease: any;
    propertyId: string | undefined;
    onClose: () => void;
    onContinue: (data: any) => void;
}

const formatDateForInput = (date?: string | null) =>
    date ? new Date(date).toISOString().split("T")[0] : "";

export default function ChecklistSetupModal({
                                                   open,
                                                   lease,
                                                   propertyId,
                                                   onClose,
                                                   onContinue,
                                               }: Props) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showDecision, setShowDecision] = useState(false);
    const [showOptions, setShowOptions] = useState<"agreement" | "dates" | null>(null);

    const agreement_id = lease?.agreement_id || lease?.lease_id || lease?.agreementId;
    const leaseStatus = (lease?.status ?? lease?.lease_status)?.toLowerCase();
    const isActive = leaseStatus === "active";
    const hasEndDate = !!lease?.end_date;

    const [form, setForm] = useState({
        lease_agreement: false,
        set_lease_dates: false,
        lease_start_date: "",
        lease_end_date: "",
    });


    useEffect(() => {
        if (!agreement_id) return;

        setShowDecision(false);
        setShowOptions(null);
        setForm({
            lease_agreement: false,
            set_lease_dates: false,
            lease_start_date: "",
            lease_end_date: "",
        });
        
        axios
            .get(
                `/api/landlord/activeLease/saveChecklistRequirements?agreement_id=${agreement_id}`
            )
            .then((res) => {
                const r = res.data?.requirements;

                if (r) {
                    const loadedForm = {
                        lease_agreement: r.lease_agreement === 1,
                        set_lease_dates: !!(
                            res.data?.lease_start_date || res.data?.lease_end_date
                        ),
                        lease_start_date: formatDateForInput(res.data?.lease_start_date),
                        lease_end_date: formatDateForInput(res.data?.lease_end_date),
                    };

                    setForm(loadedForm);
                    setShowDecision(true);
                }
            })
            .catch(() => {});
    }, [agreement_id]);


    if (!open || !agreement_id) return null;

    const hasInvalidDates: boolean =
        showOptions === "dates" &&
        !!form.lease_start_date &&
        !!form.lease_end_date &&
        new Date(form.lease_end_date) < new Date(form.lease_start_date);

    const canProceed =
        (showOptions === "agreement") ||
        (showOptions === "dates" && form.lease_start_date);


    const handleSave = async () => {
        if (hasInvalidDates) {
            await Swal.fire({
                icon: "warning",
                title: "Invalid lease dates",
                text: "End date cannot be earlier than the start date.",
            });
            return;
        }

        if (!canProceed) {
            await Swal.fire({
                icon: "warning",
                title: "Select an option",
                text: "Please select at least one option to proceed.",
            });
            return;
        }

        try {

            const isDatesOnly = showOptions === "dates";
            
            if (showOptions === "dates") {
                console.log("Calling updateLeaseDateSet with:", {
                    agreement_id,
                    start_date: form.lease_start_date,
                    end_date: form.lease_end_date || null,
                });
                
                const dateSetRes = await axios.put("/api/leaseAgreement/updateLeaseDateSet", {
                    agreement_id,
                    start_date: form.lease_start_date,
                    end_date: form.lease_end_date || null,
                });
                
                console.log("updateLeaseDateSet response:", dateSetRes.data);
            }

            const shouldSaveChecklist = showOptions === "agreement";
                
            if (shouldSaveChecklist) {
                const checklistRes = await axios.post(
                    "/api/landlord/activeLease/saveChecklistRequirements",
                    {
                        agreement_id,
                        lease_agreement: showOptions === "agreement",
                        // move_in_checklist: form.include_move_in,
                        // move_out_checklist: form.include_move_out,
                        security_deposit: showOptions === "agreement",
                        advance_payment: showOptions === "agreement",
                        lease_start_date: form.lease_start_date || null,
                        lease_end_date: form.lease_end_date || null,
                    }
                );
                
                console.log("saveChecklistRequirements response:", checklistRes.data);
            }

            Swal.close();

            if (isDatesOnly) {
                await Swal.fire({
                    icon: "success",
                    title: "Dates saved",
                    text: "Lease dates have been updated.",
                });
                onClose();
            } else {
                onClose();
                router.push(
                    `/landlord/properties/${propertyId}/activeLease/setup?agreement_id=${agreement_id}`
                );
            }
        } catch (error: any) {
            console.error("Save error:", error);
            Swal.close();
            Swal.fire({
                icon: "error",
                title: "Save failed",
                text: error?.response?.data?.error || "Please try again.",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 sm:p-6">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto">

                <div className={`px-6 py-5 ${isActive ? "bg-gradient-to-r from-emerald-600 to-teal-600" : "bg-gradient-to-r from-blue-600 to-emerald-600"}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                {isActive ? "Lease Actions" : "Checklist Setup"}
                            </h2>
                            <p className="text-sm text-white/80 mt-1">
                                {isActive ? "Manage your active lease" : "Select options to configure"}
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

                <div className="p-6">
                    {isActive ? (
                        <div className="space-y-4">
                            <div className="bg-gray-50 rounded-xl p-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">{lease?.tenant_name || "Tenant"}</p>
                                        <p className="text-sm text-gray-500">{lease?.unit_name || "Unit"}</p>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-600">
                                    <p>Lease Term: {lease?.start_date ? new Date(lease.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"} - {lease?.end_date ? new Date(lease.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Ongoing"}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() => {
                                        onClose();
                                        window.location.href = `/landlord/properties/${propertyId}/activeLease/leaseDetails/${agreement_id}`;
                                    }}
                                    className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                        <Eye className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="font-semibold text-gray-900">View Lease Details</p>
                                        <p className="text-xs text-gray-500">View full lease information</p>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-gray-400" />
                                </button>

                                {hasEndDate && (
                                    <button
                                        onClick={() => {
                                            onClose();
                                            window.location.href = `/landlord/properties/${propertyId}/activeLease/extend/${agreement_id}`;
                                        }}
                                        className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-amber-300 hover:bg-amber-50 transition-all"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                                            <Pencil className="w-5 h-5 text-amber-600" />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <p className="font-semibold text-gray-900">Extend Lease</p>
                                            <p className="text-xs text-gray-500">Extend the lease period</p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-gray-400" />
                                    </button>
                                )}

                                <button
                                    onClick={async () => {
                                        const result = await Swal.fire({
                                            icon: "warning",
                                            title: "End Lease",
                                            text: "Are you sure you want to end this lease? This action cannot be undone.",
                                            showCancelButton: true,
                                            confirmButtonText: "Yes, End Lease",
                                            cancelButtonText: "Cancel",
                                            confirmButtonColor: "#dc2626",
                                        });
                                        if (result.isConfirmed) {
                                            try {
                                                await axios.put(`/api/leaseAgreement/end?agreement_id=${agreement_id}`);
                                                Swal.fire("Success", "Lease has been ended.", "success");
                                                onClose();
                                                window.location.reload();
                                            } catch (error: any) {
                                                Swal.fire("Error", error.response?.data?.error || "Failed to end lease", "error");
                                            }
                                        }
                                    }}
                                    className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-all"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                                        <Trash2 className="w-5 h-5 text-red-600" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="font-semibold text-gray-900">End Lease</p>
                                        <p className="text-xs text-gray-500">Terminate this lease</p>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-gray-400" />
                                </button>
                            </div>

                            <button
                                onClick={onClose}
                                className="w-full py-3 rounded-xl border border-gray-300 font-medium text-gray-700 mt-4"
                            >
                                Cancel
                            </button>
                        </div>
                    ) : showDecision ? (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Setup Already Exists
                            </h3>
                            <p className="text-sm text-gray-600 mb-6">
                                This lease already has existing setup. You can continue editing or modify the setup.
                                lease id: {lease.lease_id}
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
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3">
                                        Primary Setup <span className="text-red-500">*</span>
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setShowOptions(showOptions === "agreement" ? null : "agreement")}
                                            className={`p-4 rounded-xl border-2 text-left transition-all ${
                                                showOptions === "agreement"
                                                    ? "border-blue-500 bg-blue-50"
                                                    : "border-gray-200 hover:border-gray-300"
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                                    showOptions === "agreement"
                                                        ? "bg-blue-500"
                                                        : "bg-gray-100"
                                                }`}>
                                                    <FileSignature className={`w-5 h-5 ${
                                                        showOptions === "agreement"
                                                            ? "text-white"
                                                            : "text-gray-500"
                                                    }`} />
                                                </div>
                                                <div className="flex-1">
                                                    <p className={`font-medium ${showOptions === "agreement" ? "text-blue-700" : "text-gray-900"}`}>
                                                        Lease Agreement
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        detail your lease conditions.
                                                    </p>
                                                </div>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => setShowOptions(showOptions === "dates" ? null : "dates")}
                                            className={`p-4 rounded-xl border-2 text-left transition-all ${
                                                showOptions === "dates"
                                                    ? "border-indigo-500 bg-indigo-50"
                                                    : "border-gray-200 hover:border-gray-300"
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                                    showOptions === "dates"
                                                        ? "bg-indigo-500"
                                                        : "bg-gray-100"
                                                }`}>
                                                    <CalendarRange className={`w-5 h-5 ${
                                                        showOptions === "dates"
                                                            ? "text-white"
                                                            : "text-gray-500"
                                                    }`} />
                                                </div>
                                                <div className="flex-1">
                                                    <p className={`font-medium ${showOptions === "dates" ? "text-indigo-700" : "text-gray-900"}`}>
                                                        Set Lease Dates Only
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        Set dates
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    </div>
                                    {lease?.lease_id && (
                                        <p className="text-xs text-gray-400 mt-2">
                                            Lease ID: {lease.lease_id}
                                        </p>
                                    )}
                                </div>

                                {/* <div>
                                    <h3 className="font-semibold text-gray-900 mb-3">
                                        Additional Checklists <span className="text-gray-400 font-normal">(optional)</span>
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setForm(p => ({ ...p, include_move_in: !p.include_move_in }))}
                                            className={`p-4 rounded-xl border-2 text-left transition-all ${
                                                form.include_move_in
                                                    ? "border-emerald-500 bg-emerald-50"
                                                    : "border-gray-200 hover:border-gray-300"
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                                    form.include_move_in
                                                        ? "bg-emerald-500"
                                                        : "bg-gray-100"
                                                }`}>
                                                    <KeyRound className={`w-5 h-5 ${
                                                        form.include_move_in
                                                            ? "text-white"
                                                            : "text-gray-500"
                                                    }`} />
                                                </div>
                                                <div className="flex-1">
                                                    <p className={`font-medium ${form.include_move_in ? "text-emerald-700" : "text-gray-900"}`}>
                                                        Move-IN Checklist
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        Property condition
                                                    </p>
                                                </div>
                                                {form.include_move_in && (
                                                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                                )}
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => setForm(p => ({ ...p, include_move_out: !p.include_move_out }))}
                                            className={`p-4 rounded-xl border-2 text-left transition-all ${
                                                form.include_move_out
                                                    ? "border-orange-500 bg-orange-50"
                                                    : "border-gray-200 hover:border-gray-300"
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                                    form.include_move_out
                                                        ? "bg-orange-500"
                                                        : "bg-gray-100"
                                                }`}>
                                                    <LogOut className={`w-5 h-5 ${
                                                        form.include_move_out
                                                            ? "text-white"
                                                            : "text-gray-500"
                                                    }`} />
                                                </div>
                                                <div className="flex-1">
                                                    <p className={`font-medium ${form.include_move_out ? "text-orange-700" : "text-gray-900"}`}>
                                                        Move-OUT Checklist
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        Final inspection
                                                    </p>
                                                </div>
                                                {form.include_move_out && (
                                                    <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0" />
                                                )}
                                            </div>
                                        </button>
                                    </div>
                                </div> */}

                                {showOptions === "dates" && (
                                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                Lease Start Date <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                value={form.lease_start_date}
                                                onChange={(e) => setForm(p => ({ ...p, lease_start_date: e.target.value }))}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                Lease End Date <span className="text-gray-400">(optional)</span>
                                            </label>
                                            <input
                                                type="date"
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                value={form.lease_end_date}
                                                onChange={(e) => setForm(p => ({ ...p, lease_end_date: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                )}

                                {hasInvalidDates && (
                                    <p className="text-xs text-red-600">
                                        End date cannot be earlier than start date
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-3 rounded-xl border border-gray-300 font-medium text-gray-700"
                                >
                                    Cancel
                                </button>
                                {showOptions === "dates" ? (
                                    <button
                                        onClick={handleSave}
                                        disabled={loading || !canProceed || hasInvalidDates || (showOptions === "dates" && !form.lease_start_date)}
                                        className={`flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 ${
                                            !canProceed || loading || hasInvalidDates || (showOptions === "dates" && !form.lease_start_date)
                                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                                : "bg-gradient-to-r from-blue-600 to-emerald-600 text-white"
                                        }`}
                                    >
                                        {loading ? "Saving..." : "Save"}
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleSave}
                                        disabled={loading || !canProceed || hasInvalidDates}
                                        className={`flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 ${
                                            !canProceed || loading || hasInvalidDates
                                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                                : "bg-gradient-to-r from-blue-600 to-emerald-600 text-white"
                                        }`}
                                    >
                                        {loading ? "Saving..." : "Continue"}
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}