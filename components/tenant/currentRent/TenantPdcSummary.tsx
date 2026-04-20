"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { CreditCardIcon } from "@heroicons/react/24/outline";

interface Props {
    agreement_id: string;
}

export default function TenantPdcSummary({ agreement_id }: Props) {
    const [pdcs, setPdcs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadPdc() {
            try {
                const res = await axios.get(
                    "/api/tenant/activeRent/pdc",
                    { params: { agreement_id } }
                );

                setPdcs(res.data?.pdcs || []);
            } catch {
                setPdcs([]);
            } finally {
                setLoading(false);
            }
        }

        loadPdc();
    }, [agreement_id]);

    // 🔕 Hide component entirely if no PDC
    if (!loading && pdcs.length === 0) return null;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 md:p-4">
            <div className="flex items-center gap-2 mb-3">
                <CreditCardIcon className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                <h3 className="text-xs md:text-sm font-bold text-gray-900">
                    Post-Dated Checks (PDC)
                </h3>
            </div>

            {loading ? (
                <p className="text-xs text-gray-500">Loading PDC information…</p>
            ) : (
                <div className="space-y-2">
                    {pdcs.map((pdc, i) => (
                        <div
                            key={i}
                            className="flex items-center justify-between p-2.5 border rounded-lg text-xs md:text-sm"
                        >
                            <div>
                                <p className="font-semibold text-gray-800">
                                    Check #{pdc.check_number}
                                </p>
                                <p className="text-[10px] md:text-xs text-gray-500">
                                    Due: {pdc.due_date}
                                </p>
                            </div>

                            <div className="text-right">
                                <p className="font-semibold text-gray-900 text-xs md:text-sm">
                                    ₱{Number(pdc.amount).toLocaleString()}
                                </p>
                                <span
                                    className={`text-[10px] md:text-xs font-medium ${
                                        pdc.status === "cleared"
                                            ? "text-emerald-600"
                                            : pdc.status === "bounced"
                                                ? "text-red-600"
                                                : "text-amber-600"
                                    }`}
                                >
                                    {pdc.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
