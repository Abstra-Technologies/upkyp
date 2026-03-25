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
                    className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden"
                    >
                        {/* ================= HEADER ================= */}
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <h3 className="text-xl font-bold text-gray-900">
                                Payment Receipt
                            </h3>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg hover:bg-gray-100 transition"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* ================= RECEIPT ================= */}
                        <div className="px-6 py-6 overflow-y-auto max-h-[75vh] text-sm">
                            <div
                                ref={receiptRef}
                                className="border border-gray-200 rounded-2xl overflow-hidden"
                            >
                                {/* BRAND HEADER */}
                                <div className="bg-gradient-to-r from-blue-600 to-emerald-600 px-6 py-5 text-white">
                                    <h2 className="text-lg font-extrabold tracking-wide">
                                        UPKYP
                                    </h2>
                                    <p className="text-xs opacity-90">
                                        Official Digital Payment Receipt
                                    </p>
                                </div>

                                <div className="p-6 space-y-8">
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

                                    <p className="text-center text-xs text-gray-400 pt-4">
                                        Generated by UPKYP • {new Date().toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* ================= FOOTER ================= */}
                        <div className="px-6 py-4 border-t flex justify-between items-center">
                            <button
                                onClick={handleDownloadReceipt}
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 text-white hover:shadow-lg transition-all"
                            >
                                <Download className="w-4 h-4" />
                                Download Receipt
                            </button>

                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-semibold rounded-xl bg-gray-100 hover:bg-gray-200 transition"
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
            <h4 className="font-bold text-gray-800 mb-3">{title}</h4>
            <div className="space-y-2">{children}</div>
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
        <div className="flex justify-between items-center gap-4">
            <span className="text-gray-500">{label}</span>

            {badge ? (
                <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border capitalize ${badgeStyle}`}
                >
          {String(value).replaceAll("_", " ")}
        </span>
            ) : (
                <span
                    className={`font-semibold text-right ${
                        highlight ? "text-emerald-600 text-base" : "text-gray-900"
                    } ${capitalize ? "capitalize" : ""}`}
                >
          {value}
        </span>
            )}
        </div>
    );
}
