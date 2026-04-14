"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import axios from "axios";
import {  useRef } from "react";
import * as htmlToImage from "html-to-image";


export default function ViewBillingPageWrapper() {
    return (
        <Suspense fallback={<p className="text-gray-500">Loading billing details...</p>}>
            <BillingDetails />
        </Suspense>
    );
}

function BillingDetails() {
    const [billing, setBilling] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const billingRef = useRef<HTMLDivElement>(null);
    const searchParams = useSearchParams();
    const billing_id = searchParams.get("billing_id");

    useEffect(() => {
        if (!billing_id) return;

        const fetchBilling = async () => {
            try {
                const res = await axios.get(`/api/tenant/billing/previousBilling/${billing_id}`);
                setBilling(res.data.billing);
            } catch (err) {
                console.error(err);
                setError("Failed to fetch billing.");
            }
        };

        fetchBilling();
    }, [billing_id]);

    const downloadImage = async () => {
        if (!billingRef.current) return;

        try {
            const dataUrl = await htmlToImage.toPng(billingRef.current, { cacheBust: true });
            const link = document.createElement("a");
            link.href = dataUrl;
            link.download = `billing_${billing_id}.png`;
            link.click();
        } catch (err) {
            console.error("Error generating image:", err);
        }
    };

    if (error) return <p className="text-red-500">{error}</p>;
    if (!billing) return <p className="text-gray-500">Loading billing...</p>;

    return (
        <div className="max-w-2xl mx-auto py-8 px-6 bg-white shadow-xl border border-gray-200 rounded-lg font-sans relative">

            {/* Watermark */}
            <div className="absolute top-0 left-0 w-full h-full flex flex-wrap items-center justify-center pointer-events-none opacity-5 z-0">
                {Array.from({ length: 100 }).map((_, i) => (
                    <span key={i} className="text-5xl font-bold text-gray-400 mx-2 my-2 transform rotate-45 select-none">HESTIA</span>
                ))}
            </div>

            {/* Billing Statement */}
            <div ref={billingRef} className="relative z-10 p-6 bg-white rounded-lg">

                {/* Header */}
                <div className="flex justify-between items-center mb-6 border-b border-gray-300 pb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Billing Statement</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            {billing.billing_period
                                ? new Date(billing.billing_period).toLocaleDateString(undefined, {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                })
                                : "N/A"}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-medium text-gray-600">Billing ID</p>
                        <p className="text-gray-900 font-semibold text-lg">{billing.billing_id}</p>
                    </div>
                </div>

                {/* Tenant & Property Info */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                        <p className="text-sm font-semibold text-gray-600 mb-1">Tenant</p>
                        <p className="text-gray-900 font-medium">{billing.tenant.user.firstName} {billing?.tenant?.user?.lastName}</p>
                        <p className="text-gray-500">{billing?.tenant?.user?.email}</p>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-gray-600 mb-1">Property & Unit</p>
                        <p className="text-gray-900 font-medium">{billing?.property?.property_name}</p>
                        <p className="text-gray-500">Unit {billing?.unit?.unit_name}</p>
                    </div>
                </div>

                {/* Total Amount Due */}
                <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-white border border-gray-200 rounded-lg text-center shadow-sm">
                    <p className="text-sm font-semibold text-gray-500">Total Amount Due</p>
                    <p className="mt-2 text-4xl font-extrabold text-gray-900">
                        ₱{parseFloat(billing.total_amount_due).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                </div>

                {/* Breakdown */}
                <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-2 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-700 border-b border-gray-300 pb-2 mb-2">Breakdown</h2>

                    {[
                        { label: "Rent", value: billing?.unit?.rent_amount },
                        { label: "Association Due", value: billing?.property?.assoc_dues },
                        { label: "Discount", value: billing?.discount_amount },
                        { label: "Penalties", value: billing?.penalty_amount },
                    ].map((item) => (
                        <div key={item.label} className="flex justify-between">
                            <p className="text-gray-600">{item.label}</p>
                            <p className="text-gray-900 font-medium">₱{parseFloat(item.value || "0").toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                    ))}

                    {/* Meter Readings */}
                    {billing.meter_readings && (
                        <table className="w-full text-left border-collapse mt-4">
                            <thead>
                            <tr className="bg-gray-100">
                                <th className="py-2 px-4 border-b">Utility Type</th>
                                <th className="py-2 px-4 border-b">Previous Reading</th>
                                <th className="py-2 px-4 border-b">Current Reading</th>
                                <th className="py-2 px-4 border-b">Amount (₱)</th>
                            </tr>
                            </thead>
                            <tbody>
                            {Object.entries(billing.meter_readings).map(([type, reading]: [string, any]) => {
                                const amount =
                                    type === "water"
                                        ? billing.total_water_amount
                                        : type === "electricity"
                                            ? billing.total_electricity_amount
                                            : 0;
                                return (
                                    <tr key={type} className="hover:bg-gray-50">
                                        <td className="py-2 px-4 border-b">{type.charAt(0).toUpperCase() + type.slice(1)}</td>
                                        <td className="py-2 px-4 border-b">{reading.previous ?? 0}</td>
                                        <td className="py-2 px-4 border-b">{reading.current ?? 0}</td>
                                        <td className="py-2 px-4 border-b font-medium">
                                            ₱{parseFloat(amount ?? "0").toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Due Date */}
                <div className="mb-6 text-gray-700 text-sm space-y-1">
                    <p><span className="font-semibold">Due Date:</span> {billing?.due_date}</p>
                </div>
            </div>

            {/* Download Button */}
            <div className="text-center mt-4">
                <button
                    onClick={downloadImage}
                    className="inline-block px-6 py-2 bg-blue-600 text-white font-medium rounded-lg shadow hover:bg-blue-700 transition"
                >
                    Download Bill
                </button>
            </div>

            {/* Page_footer */}
            <div className="mt-6 text-xs text-gray-400 text-center border-t border-gray-200 pt-4">
                Abstra Technologies. @ Hestia Rent360 This is a system-generated billing statement.
            </div>
        </div>
    );
}

