"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X, Download } from "lucide-react";
import { formatCurrency } from "@/utils/formatter/formatters";
import { toPng } from "html-to-image";
import { useRef } from "react";

interface Props {
    open: boolean;
    onClose: () => void;
    payment: any | null;
}

export default function PaymentDetailsModal({
                                                open,
                                                onClose,
                                                payment,
                                            }: Props) {
    const receiptRef = useRef<HTMLDivElement>(null);

    if (!payment) return null;

    const handleDownloadReceipt = async () => {
        if (!receiptRef.current) return;

        try {
            const dataUrl = await toPng(receiptRef.current, {
                backgroundColor: "#ffffff",
                pixelRatio: 2,
            });

            const link = document.createElement("a");
            link.href = dataUrl;
            link.download = `UPKYP-Receipt-${payment.payment_id}.png`;
            link.click();
        } catch (err) {
            console.error("Failed to download receipt", err);
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "tween", duration: 0.3 }}
                        className="bg-white w-full sm:max-w-4xl sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* ================= HEADER ================= */}
                        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b shrink-0">
                            <div>
                                <h3 className="text-base sm:text-xl font-bold text-gray-900">
                                    Payment Receipt
                                </h3>
                                <p className="text-xs text-gray-500 sm:hidden">
                                    #{payment.payment_id}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg hover:bg-gray-100 transition active:bg-gray-200"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* ================= RECEIPT ================= */}
                        <div className="px-4 sm:px-6 py-4 sm:py-6 overflow-y-auto flex-1 text-sm">
                            <div
                                ref={receiptRef}
                                className="border border-gray-200 rounded-xl sm:rounded-2xl overflow-hidden"
                            >
                                {/* BRAND HEADER */}
                                <div className="bg-gradient-to-r from-blue-600 to-emerald-600 px-4 sm:px-6 py-4 sm:py-5 text-white">
                                    <h2 className="text-base sm:text-lg font-extrabold tracking-wide">
                                        UPKYP
                                    </h2>
                                    <p className="text-[10px] sm:text-xs opacity-90">
                                        Official Digital Payment Receipt
                                    </p>
                                </div>

                                <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
                                    {/* ================= CORE PAYMENT ================= */}
                                    <Section title="Payment Information">
                                        <Detail label="Payment ID" value={payment.payment_id} />
                                        <Detail
                                            label="Payment Type"
                                            value={payment.payment_type.replaceAll("_", " ")}
                                            capitalize
                                        />
                                        <Detail
                                            label="Payment Status"
                                            value={payment.payment_status}
                                            badge
                                        />
                                        <Detail
                                            label="Payout Status"
                                            value={payment.payout_status}
                                            badge
                                        />
                                        <Detail
                                            label="Payment Method"
                                            value={payment.payment_method_id}
                                        />
                                        <Detail
                                            label="Gateway Ref"
                                            value={payment.gateway_transaction_ref || "—"}
                                        />
                                        <Detail
                                            label="Receipt Ref"
                                            value={payment.receipt_reference || "—"}
                                        />
                                        <Detail
                                            label="Payment Date"
                                            value={new Date(
                                                payment.payment_date
                                            ).toLocaleString()}
                                        />
                                    </Section>

                                    {/* ================= FINANCIAL BREAKDOWN ================= */}
                                    <Section title="Financial Breakdown">
                                        <Detail
                                            label="Gross Amount (Tenant Paid)"
                                            value={formatCurrency(payment.gross_amount)}
                                        />

                                        <Detail
                                            label="Gateway Fee"
                                            value={formatCurrency(payment.gateway_fee || 0)}
                                        />

                                        <Detail
                                            label="Gateway VAT"
                                            value={formatCurrency(payment.gateway_vat || 0)}
                                        />

                                        <Detail
                                            label="Platform Fee"
                                            value={formatCurrency(payment.platform_fee || 0)}
                                        />

                                        <hr className="my-2" />

                                        <Detail
                                            label="Net Amount (After Fees)"
                                            value={formatCurrency(payment.net_amount)}
                                            highlight
                                        />
                                    </Section>

                                    {/* ================= BILLING INFO ================= */}
                                    {payment.bill_id && (
                                        <Section title="Billing Information">
                                            <Detail label="Billing ID" value={payment.bill_id} />
                                            <Detail
                                                label="Agreement ID"
                                                value={payment.agreement_id}
                                            />
                                        </Section>
                                    )}

                                    {/* ================= GATEWAY DATA ================= */}
                                    {payment.raw_gateway_payload && (
                                        <Section title="Gateway Data">
                                            {(() => {
                                                try {
                                                    const payload = typeof payment.raw_gateway_payload === 'string'
                                                        ? JSON.parse(payment.raw_gateway_payload)
                                                        : payment.raw_gateway_payload;
                                                    return Object.entries(payload).map(([key, val]) => (
                                                        <Detail
                                                            key={key}
                                                            label={key.replace(/_/g, " ")}
                                                            value={String(val)}
                                                        />
                                                    ));
                                                } catch {
                                                    return <Detail label="Raw Data" value={String(payment.raw_gateway_payload)} />;
                                                }
                                            })()}
                                        </Section>
                                    )}

                                    <p className="text-center text-[10px] sm:text-xs text-gray-400 pt-2 sm:pt-4">
                                        Generated by UPKYP • {new Date().toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* ================= FOOTER ================= */}
                        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t flex flex-col sm:flex-row gap-2 sm:justify-between items-stretch sm:items-center shrink-0">
                            <button
                                onClick={handleDownloadReceipt}
                                className="inline-flex justify-center items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 text-white hover:shadow-lg transition-all active:scale-[0.98]"
                            >
                                <Download className="w-4 h-4" />
                                Download Receipt
                            </button>

                            <button
                                onClick={onClose}
                                className="px-4 py-2.5 text-sm font-semibold rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition"
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

/* =========================
   HELPERS
========================= */

function Section({
                     title,
                     children,
                 }: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <h4 className="font-bold text-gray-800 mb-2 sm:mb-3 text-sm sm:text-base">{title}</h4>
            <div className="space-y-1.5 sm:space-y-2">{children}</div>
        </div>
    );
}

function Detail({
                    label,
                    value,
                    highlight,
                    capitalize,
                    badge,
                }: {
    label: string;
    value: string | number | null | undefined;
    highlight?: boolean;
    capitalize?: boolean;
    badge?: boolean;
}) {
    if (value === null || value === undefined || value === "" || value === 0) {
        return null;
    }

    const badgeStyle =
        {
            confirmed: "bg-emerald-100 text-emerald-700 border-emerald-200",
            pending: "bg-amber-100 text-amber-700 border-amber-200",
            failed: "bg-red-100 text-red-700 border-red-200",
            cancelled: "bg-gray-100 text-gray-600 border-gray-200",
            unpaid: "bg-gray-100 text-gray-600 border-gray-200",
            in_payout: "bg-blue-100 text-blue-700 border-blue-200",
            paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
        }[String(value)] || "bg-gray-100 text-gray-700 border-gray-200";

    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-4 py-1.5">
            <span className="text-gray-500 text-xs sm:text-sm">{label}</span>

            {badge ? (
                <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border capitalize ${badgeStyle}`}
                >
          {String(value).replaceAll("_", " ")}
        </span>
            ) : (
                <span
                    className={`font-semibold text-right break-all sm:break-normal ${
                        highlight ? "text-emerald-600 text-sm sm:text-base" : "text-gray-900 text-xs sm:text-sm"
                    } ${capitalize ? "capitalize" : ""}`}
                >
          {value}
        </span>
            )}
        </div>
    );
}
