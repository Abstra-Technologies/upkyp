"use client";

import { CheckCircle2, AlertTriangle, ArrowLeft, Loader2 } from "lucide-react";

interface Props {
    form: any;
    leaseDetails: any;
    rentChanged?: boolean;
    generating?: boolean;
    onBack: () => void;
    onConfirm: () => void;
    onAttest: (checked: boolean) => void;
}

export default function Step3ReviewConfirm({
                                                form,
                                                leaseDetails,
                                                rentChanged,
                                                generating = false,
                                                onBack,
                                                onConfirm,
                                                onAttest,
                                            }: Props) {
    return (
        <div className="bg-white border rounded-2xl shadow-sm p-5 max-w-3xl mx-auto">
            <h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Review & Confirm Lease Terms
            </h2>

            <div className="mb-5 flex items-start gap-2 bg-yellow-50 border border-yellow-300 text-yellow-700 p-3 rounded-lg text-sm">
                <AlertTriangle className="w-4 h-4 mt-0.5" />
                Please review the lease clauses below. Once confirmed, these terms will
                be permanently recorded in the lease document.
            </div>

            {/* CONTEXT */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-6">
                <p>
                    <strong>Property:</strong> {leaseDetails?.property_name || "—"}
                </p>
                <p>
                    <strong>Unit:</strong> {leaseDetails?.unit_name || "—"}
                </p>
                <p>
                    <strong>Lease Type:</strong>{" "}
                    {form.lease_type === "commercial" ? "Commercial" : "Residential"}
                </p>
            </div>

            {/* STEP 2 TERMS */}
            <h3 className="font-semibold text-gray-800 mb-2 border-b pb-1">
                Lease Clauses
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-6">
                <Item label="Use of Premises" value={form.use_of_premises} />
                <Item label="Allowed Occupants" value={form.allowed_occupants} />
                <Item label="Utilities Responsibility" value={form.utilities} />
                <Item
                    label="Maintenance & Repairs"
                    value={form.maintenance_responsibility}
                />
                <Item label="Entry & Inspection" value={form.entry_notice} />
                <Item label="Rules & Regulations" value={form.house_rules} />

                <Item label="Pet Policy" value={form.pet_policy} />
                <Item label="Subletting & Assignment" value={form.subleasing_policy} />

                <Item
                    label="Alterations & Improvements"
                    value={form.alterations_policy}
                />
                <Item
                    label="Insurance Requirement"
                    value={form.insurance_requirement}
                />

                <Item label="Force Majeure Clause" value={form.force_majeure} />
                <Item label="Default & Remedies" value={form.default_remedies} />

                <Item label="Termination Clause" value={form.termination_clause} />
                <Item label="Renewal Terms" value={form.renewal_terms} />

                <Item label="Governing Law" value={form.governing_law} />
            </div>

            {/* ATTESTATION */}
            <div className="flex items-start gap-2 bg-gray-50 border p-3 rounded-lg text-sm mb-6">
                <input
                    type="checkbox"
                    checked={form.attestation || false}
                    onChange={(e) => onAttest(e.target.checked)}
                    className="mt-1"
                />
                <span>
          I attest that all lease terms reviewed above are accurate and agreed
          upon. I understand this will become a binding digital record.
        </span>
            </div>

            {/* ACTIONS */}
            <div className="flex justify-between gap-3">
                <button
                    onClick={onBack}
                    disabled={generating}
                    className="px-5 py-2.5 border rounded-lg text-gray-600 flex items-center gap-2 disabled:opacity-50"
                >
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>

                <button
                    disabled={!form.attestation || generating}
                    onClick={onConfirm}
                    className="px-6 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 min-w-[180px] justify-center"
                >
                    {generating ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                        </>
                    ) : (
                        "Confirm & Generate Lease"
                    )}
                </button>
            </div>
        </div>
    );
}

/* ───────── helpers ───────── */

function Item({ label, value }: any) {
    return (
        <p>
            <strong>{label}:</strong> {value || "—"}
        </p>
    );
}
