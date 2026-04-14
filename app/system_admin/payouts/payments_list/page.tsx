"use client";

import useSWR from "swr";
import { useState, useMemo } from "react";
import axios from "axios";
import {
    Banknote,
    Search,
    Send,
    ChevronDown,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/utils/formatter/formatters";

const fetcher = (url: string) =>
    axios.get(url).then((res) => res.data);

export default function PaymentsListPage() {
    const router = useRouter();

    const [search, setSearch] = useState("");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [openProperty, setOpenProperty] = useState<string | null>(null);


    const { data, error, isLoading, mutate } = useSWR(
        "/api/systemadmin/payouts/getListofPayments",
        fetcher
    );

    const payments = data?.payments || [];

    /* ==============================================
       1️⃣ Filter disbursement-ready
    ============================================== */
    const availablePayments = useMemo(() => {
        return payments.filter(
            (p: any) =>
                p.payment_status === "confirmed" &&
                p.payout_status === "unpaid"
        );
    }, [payments]);

    /* ==============================================
       2️⃣ Search
    ============================================== */
    const searchedPayments = useMemo(() => {
        if (!search) return availablePayments;

        return availablePayments.filter((p: any) =>
            `${p.landlord_name} 
       ${p.payment_id} 
       ${p.property?.property_name}`
                .toLowerCase()
                .includes(search.toLowerCase())
        );
    }, [availablePayments, search]);

    /* ==============================================
       3️⃣ Group by PROPERTY (FIXED)
    ============================================== */
    const groupedByProperty = useMemo(() => {
        const grouped: Record<number, any> = {};

        searchedPayments.forEach((payment: any) => {
            const propertyId =
                payment.property?.property_id;

            if (!propertyId) return;

            if (!grouped[propertyId]) {
                grouped[propertyId] = {
                    property_name:
                        payment.property?.property_name ||
                        "Unnamed Property",
                    payments: [],
                };
            }

            grouped[propertyId].payments.push(payment);
        });

        return grouped;
    }, [searchedPayments]);

    /* ==============================================
       4️⃣ Selection Logic
    ============================================== */
    const toggleSelect = (payment: any) => {
        setSelectedIds((prev) =>
            prev.includes(payment.payment_id)
                ? prev.filter((id) => id !== payment.payment_id)
                : [...prev, payment.payment_id]
        );
    };

    const toggleSelectProperty = (payments: any[]) => {
        const ids = payments.map((p) => p.payment_id);

        const allSelected = ids.every((id) =>
            selectedIds.includes(id)
        );

        if (allSelected) {
            setSelectedIds((prev) =>
                prev.filter((id) => !ids.includes(id))
            );
        } else {
            setSelectedIds((prev) => [
                ...new Set([...prev, ...ids]),
            ]);
        }
    };

    /* ==============================================
       5️⃣ Actions
    ============================================== */
    const handleProcessPayout = async () => {
        if (!selectedIds.length) {
            alert("No payments selected.");
            return;
        }

        await axios.put(
            "/api/systemadmin/payouts/updateStatus",
            {
                payment_ids: selectedIds,
                new_status: "in_payout",
            }
        );

        alert("Marked as in payout.");
        setSelectedIds([]);
        mutate();
    };

    const handleDisburseNow = () => {
        if (!selectedIds.length) {
            alert("No payments selected.");
            return;
        }

        router.push(
            `/pages/system_admin/payouts/review?payment_ids=${selectedIds.join(
                ","
            )}`
        );
    };

    /* ==============================================
       UI
    ============================================== */
    return (
        <div className="w-full min-h-screen p-6 bg-gradient-to-br from-gray-50 to-gray-100">

            {/* HEADER */}
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-600 p-2 rounded-lg shadow">
                    <Banknote className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800">
                    Property Payout Disbursement
                </h1>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex gap-3 mb-6">
                <button
                    onClick={handleProcessPayout}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
                >
                    Mark as In Payout
                </button>

                <button
                    onClick={handleDisburseNow}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg shadow hover:bg-emerald-700 flex items-center gap-2"
                >
                    <Send className="w-4 h-4" />
                    Disburse Selected
                </button>
            </div>

            {/* SEARCH */}
            <div className="flex items-center bg-white border px-4 py-2 rounded-lg shadow-sm w-full sm:w-96 mb-6">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search property, landlord, or payment ID..."
                    className="ml-3 w-full outline-none text-sm"
                    value={search}
                    onChange={(e) =>
                        setSearch(e.target.value)
                    }
                />
            </div>

            {/* LOADING / ERROR */}
            {isLoading && (
                <div className="bg-white p-6 rounded-xl shadow text-center">
                    Loading payments...
                </div>
            )}

            {error && (
                <div className="bg-white p-6 rounded-xl shadow text-center text-red-500">
                    Failed to load payments.
                </div>
            )}

            {/* ACCORDION */}
            {!isLoading && !error && (
                <div className="space-y-4">
                    {Object.entries(groupedByProperty).map(
                        ([propertyId, group]: any) => {
                            const isOpen = openProperty === propertyId;

                            const totalNet = group.payments.reduce(
                                (sum: number, p: any) =>
                                    sum + Number(p.net_amount ?? p.amount ?? 0),
                                0
                            );

                            return (
                                <div
                                    key={propertyId}
                                    className="bg-white rounded-xl shadow border"
                                >
                                    {/* HEADER */}
                                    <div
                                        onClick={() =>
                                            setOpenProperty(
                                                isOpen ? null : propertyId
                                            )
                                        }
                                        className="flex justify-between items-center p-5 cursor-pointer hover:bg-gray-50 transition"
                                    >
                                        <div>
                                            <h2 className="text-lg font-bold text-gray-800">
                                                {group.property_name}
                                            </h2>
                                            <p className="text-sm text-gray-500">
                                                {group.payments.length} payments
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="text-sm text-gray-500">
                                                    Total Net
                                                </p>
                                                <p className="text-xl font-bold text-emerald-600">
                                                    {formatCurrency(totalNet)}
                                                </p>
                                            </div>

                                            <ChevronDown
                                                className={`transition-transform duration-300 ${
                                                    isOpen ? "rotate-180" : ""
                                                }`}
                                            />
                                        </div>
                                    </div>

                                    {/* BODY */}
                                    {/* BODY */}
                                    {isOpen && (
                                        <div className="border-t divide-y bg-gray-50">
                                            {group.payments.map((p: any) => (
                                                <div
                                                    key={p.payment_id}
                                                    className="p-5 hover:bg-white transition"
                                                >
                                                    <div className="flex justify-between items-start">

                                                        {/* LEFT SIDE */}
                                                        <div className="flex items-start gap-4">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedIds.includes(
                                                                    p.payment_id
                                                                )}
                                                                onChange={() => toggleSelect(p)}
                                                                className="mt-1"
                                                            />

                                                            <div className="space-y-2">
                                                                {/* Payment ID + Landlord */}
                                                                <div>
                                                                    <p className="font-semibold text-gray-800">
                                                                        Payment #{p.payment_id}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500">
                                                                        Landlord: {p.landlord_name}
                                                                    </p>
                                                                </div>

                                                                {/* Unit + Tenant */}
                                                                <div className="text-xs text-gray-600 space-y-1">
                                                                    <p>
                                                                        Unit:{" "}
                                                                        <span className="font-medium">
                    {p.unit?.unit_name ?? "—"}
                  </span>
                                                                    </p>
                                                                    <p>
                                                                        Tenant:{" "}
                                                                        <span className="font-medium">
                    {p.tenant
                        ? `${p.tenant.firstName} ${p.tenant.lastName}`
                        : "—"}
                  </span>
                                                                    </p>
                                                                </div>

                                                                {/* Date + Reference */}
                                                                <div className="text-xs text-gray-500 space-y-1">
                                                                    <p>
                                                                        Date:{" "}
                                                                        {new Date(
                                                                            p.payment_date
                                                                        ).toLocaleDateString()}
                                                                    </p>
                                                                    <p>
                                                                        Receipt Ref:{" "}
                                                                        {p.receipt_reference || "—"}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* RIGHT SIDE */}
                                                        <div className="text-right space-y-3">

                                                            {/* Net Amount */}
                                                            <div>
                                                                <p className="text-xs text-gray-500">
                                                                    Net Amount
                                                                </p>
                                                                <p className="text-lg font-bold text-emerald-600">
                                                                    {formatCurrency(
                                                                        p.net_amount ?? p.amount
                                                                    )}
                                                                </p>
                                                            </div>

                                                            {/* Status Badges */}
                                                            <div className="flex flex-col gap-1 items-end">

              <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      p.payment_status === "confirmed"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                  }`}
              >
                Payment: {p.payment_status}
              </span>

                                                                <span
                                                                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                                        p.payout_status === "unpaid"
                                                                            ? "bg-blue-100 text-blue-700"
                                                                            : p.payout_status === "in_payout"
                                                                                ? "bg-indigo-100 text-indigo-700"
                                                                                : "bg-gray-200 text-gray-700"
                                                                    }`}
                                                                >
                Payout: {p.payout_status}
              </span>
                                                            </div>
                                                        </div>

                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                </div>
                            );
                        }
                    )}
                </div>
            )}
        </div>
    );
}
