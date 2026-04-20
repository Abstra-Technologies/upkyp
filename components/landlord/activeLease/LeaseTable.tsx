"use client";

import { StatusBadge } from "./LeaseStatusBadge";

const getStatus = (lease: any) =>
    (lease.status ?? lease.lease_status)?.toLowerCase();

/**
 * ADDITIVE helper – does not affect existing logic
 */
const requiresLandlordSignature = (lease: any) => {
    const status = getStatus(lease);
    return status === "pending_signature";
};

interface Props {
    leases: any[];
    onPrimary: (lease: any) => void; // setup / view / authenticate
    onExtend: (lease: any) => void;
    onEnd: (lease: any) => void;
    onKyp: (lease: any) => void; // eKYP handler
    onAuthenticate: (lease: any) => void;
}

export default function LeaseTable({
                                       leases,
                                       onPrimary,
                                       onExtend,
                                       onEnd,
                                       onKyp,
                                       onAuthenticate
                                   }: Props) {
    return (
        <div className="hidden md:block bg-white border rounded-lg shadow-sm overflow-hidden">
            <table className="w-full text-sm divide-y">
                {/* ================= HEADER ================= */}
                <thead className="bg-gray-50 text-[11px] uppercase text-gray-500">
                <tr>
                    <th className="px-4 py-2 text-left">Unit</th>
                    <th className="px-3 py-2 text-center">Start</th>
                    <th className="px-3 py-2 text-center">End</th>
                    <th className="px-3 py-2 text-center">Status</th>
                    <th className="px-3 py-2 text-center">eKYP ID</th>
                    <th className="px-4 py-2 text-right">Action</th>
                </tr>
                </thead>

                {/* ================= BODY ================= */}
                <tbody className="divide-y">
                {leases.map((lease) => {
                    const status = getStatus(lease);

                    return (
                        <tr
                            key={lease.agreement_id || lease.lease_id}
                            className="hover:bg-gray-50 transition"
                        >
                            {/* Unit */}
                            <td className="px-4 py-2 font-medium text-gray-800">
                                {lease.unit_name}
                                <div className="text-xs text-gray-500">
                                    {lease.tenant_name || "—"}
                                </div>
                            </td>

                            {/* Start */}
                            <td className="px-3 py-2 text-center text-gray-600">
                                {lease.start_date
                                    ? new Date(
                                        lease.start_date
                                    ).toLocaleDateString()
                                    : "—"}
                            </td>

                            {/* End */}
                            <td className="px-3 py-2 text-center text-gray-600">
                                {lease.end_date
                                    ? new Date(
                                        lease.end_date
                                    ).toLocaleDateString()
                                    : "—"}
                            </td>

                            {/* Status */}
                            <td className="px-3 py-2 text-center">
                                <StatusBadge lease={lease} />
                            </td>

                            {/* ================= eKYP ID COLUMN (PRESERVED) ================= */}
                            <td className="px-3 py-2 text-center">
                                {status === "active" ? (
                                    <button
                                        onClick={() => onKyp(lease)}
                                        className="px-3 py-1.5 text-sm
                                                       bg-indigo-600 text-white
                                                       rounded-md hover:bg-indigo-700
                                                       transition font-medium"
                                    >
                                        View ID
                                    </button>
                                ) : (
                                    <span
                                        className="inline-flex px-3 py-1.5 text-sm
                                                       bg-gray-100 text-gray-400
                                                       rounded-md cursor-not-allowed"
                                    >
                                            N/A
                                        </span>
                                )}
                            </td>

                            {/* ================= ACTIONS ================= */}
                            <td className="px-4 py-2 text-right space-x-1">
                                {/* Draft → Setup */}
                                {status === "draft" && (
                                    <button
                                        onClick={() => onPrimary(lease)}
                                        className="px-3 py-1.5 text-sm
                                                       bg-blue-600 text-white
                                                       rounded-md font-medium"
                                    >
                                        Setup
                                    </button>
                                )}

                                {/* Pending Signature → Authenticate (NEW, ADDITIVE) */}
                                {requiresLandlordSignature(lease) && (
                                    <button
                                        onClick={() => onAuthenticate(lease)}
                                        className="px-3 py-1.5 text-sm
                                                       bg-emerald-600 text-white
                                                       rounded-md font-medium"
                                    >
                                        Authenticate
                                    </button>
                                )}

                                {/* Expired → Extend / End */}
                                {status === "expired" && (
                                    <>
                                        <button
                                            onClick={() => onExtend(lease)}
                                            className="px-3 py-1.5 text-sm
                                                           bg-emerald-600 text-white
                                                           rounded-md font-medium"
                                        >
                                            Extend
                                        </button>
                                        <button
                                            onClick={() => onEnd(lease)}
                                            className="px-3 py-1.5 text-sm
                                                           bg-red-600 text-white
                                                           rounded-md font-medium"
                                        >
                                            End
                                        </button>
                                    </>
                                )}

                                {/* Active → View */}
                                {status === "active" && (
                                    <button
                                        onClick={() => onPrimary(lease)}
                                        className="px-3 py-1.5 text-sm
                                                       bg-gray-800 text-white
                                                       rounded-md font-medium"
                                    >
                                        View
                                    </button>
                                )}

                                {/* Fallback (UNCHANGED, excludes pending_signature) */}
                                {![
                                    "draft",
                                    "expired",
                                    "active",
                                    "pending_signature",
                                ].includes(status) && (
                                    <button
                                        onClick={() => onPrimary(lease)}
                                        className="px-3 py-1.5 text-sm
                                                       bg-gray-800 text-white
                                                       rounded-md font-medium"
                                    >
                                        View
                                    </button>
                                )}
                            </td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    );
}
