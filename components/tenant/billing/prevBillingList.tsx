"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { formatDate, formatCurrency } from "@/utils/formatter/formatters";
import {
    DocumentArrowDownIcon,
    CalendarIcon,
    BanknotesIcon,
    FolderOpenIcon,
    ReceiptPercentIcon,
} from "@heroicons/react/24/outline";

export default function PreviousBilling({ agreement_id, user_id }) {
    const [billingData, setBillingData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [fetchFailed, setFetchFailed] = useState(false); // <-- NEW FLAG

    useEffect(() => {
        if (!user_id) return;

        const fetchBillingData = async () => {
            try {
                const res = await axios.get("/api/tenant/billing/previousBilling", {
                    params: { agreement_id, user_id },
                });

                setBillingData(res.data.billings || []);
            } catch (err) {
                console.error("Error fetching previous billing:", err);
                setFetchFailed(true); // <-- MARK AS FAILED, BUT DO NOT SHOW ERROR BOX
            } finally {
                setLoading(false);
            }
        };

        fetchBillingData();
    }, [agreement_id, user_id]);

    /**
     * Generate & download PDF on demand.
     */
    const handleDownload = async (billing_id: string) => {
        setDownloadingId(billing_id);
        try {
            const res = await axios.get(`/api/tenant/billing/${billing_id}`, {
                responseType: "blob",
            });

            const blob = new Blob([res.data], { type: "application/pdf" });
            const url = window.URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.download = `Billing_${billing_id}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();

            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Error generating PDF:", err);
            alert("Failed to generate billing PDF.");
        } finally {
            setDownloadingId(null);
        }
    };

    /* -----------------------------------------------
       LOADING STATE
    ------------------------------------------------*/
    if (loading)
        return (
            <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                    >
                        <div className="p-3">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {[1, 2, 3].map((j) => (
                                        <div key={j}>
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
                                                <div className="h-2.5 bg-gray-200 rounded w-14 animate-pulse" />
                                            </div>
                                            <div className="h-4 bg-gray-200 rounded w-18 animate-pulse" />
                                        </div>
                                    ))}
                                </div>
                                <div className="h-9 w-full sm:w-36 bg-gray-200 rounded-lg animate-pulse" />
                            </div>
                        </div>
                        <div className="bg-gray-50 px-3 py-2 border-t border-gray-200">
                            <div className="h-3 bg-gray-200 rounded w-36 animate-pulse" />
                        </div>
                    </div>
                ))}
            </div>
        );

    /* -----------------------------------------------
       IF FETCH FAILED OR EMPTY → SHOW NO HISTORY
    ------------------------------------------------*/
    if (fetchFailed || billingData.length === 0)
        return (
            <div className="text-center py-10">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                    <FolderOpenIcon className="w-7 h-7 text-gray-400" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1.5">
                    No Billing History
                </h3>
                <p className="text-sm text-gray-500">
                    You currently have no previous billing records.
                </p>
            </div>
        );

    /* -----------------------------------------------
       BILLING LIST
    ------------------------------------------------*/
    return (
        <div className="space-y-3">
            {billingData.map((bill) => (
                <div
                    key={bill.billing_id}
                    className="bg-white rounded-xl border border-gray-200 hover:shadow-md hover:border-blue-200 transition-all duration-200 overflow-hidden"
                >
                    <div className="p-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                            <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-2">
                                <div>
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <div className="p-1 bg-blue-100 rounded">
                                            <ReceiptPercentIcon className="w-3.5 h-3.5 text-blue-600" />
                                        </div>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                                            Billing ID
                                        </p>
                                    </div>
                                    <p className="text-xs font-bold text-gray-900">
                                        #{bill.billing_id}
                                    </p>
                                </div>

                                <div>
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <div className="p-1 bg-emerald-100 rounded">
                                            <CalendarIcon className="w-3.5 h-3.5 text-emerald-600" />
                                        </div>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                                            Period
                                        </p>
                                    </div>
                                    <p className="text-xs font-semibold text-gray-900">
                                        {formatDate(bill.billing_period)}
                                    </p>
                                </div>

                                <div className="col-span-2 sm:col-span-1">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <div className="p-1 bg-amber-100 rounded">
                                            <BanknotesIcon className="w-3.5 h-3.5 text-amber-600" />
                                        </div>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                                            Amount
                                        </p>
                                    </div>
                                    <p className="text-base font-bold text-gray-900">
                                        {formatCurrency(bill.total_amount_due || 0)}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => handleDownload(bill.billing_id)}
                                disabled={downloadingId === bill.billing_id}
                                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white rounded-lg font-semibold shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                            >
                                {downloadingId === bill.billing_id ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Downloading...</span>
                                    </>
                                ) : (
                                    <>
                                        <DocumentArrowDownIcon className="w-3.5 h-3.5" />
                                        <span>Download PDF</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="bg-gray-50 px-3 py-2 border-t border-gray-200">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <span className="text-gray-400">•</span>
                            <span>Statement available for download</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
