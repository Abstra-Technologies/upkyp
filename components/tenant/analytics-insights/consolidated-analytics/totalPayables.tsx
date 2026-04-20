"use client";

import { formatDate } from "@/utils/formatter/formatters";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ExclamationCircleIcon,
    CheckCircleIcon,
    CreditCardIcon,
    HomeIcon,
    ChevronDownIcon,
    ChevronUpIcon,
} from "@heroicons/react/24/outline";

/* ================= TYPES ================= */

interface BillingDetail {
    billing_id: number;
    billing_period: string;
    billing_due_date: string;
    amount: number;
    status: string;
}

interface InitialPayment {
    amount: number;
    status: string;
}

interface UnitPayable {
    agreement_id: number;
    unit_id: number;
    unit_name: string;
    property_name: string;
    total_due: number;
    billings: BillingDetail[];
    security_deposits: InitialPayment[];
    advance_payments: (InitialPayment & { months_covered: number })[];
}

interface PayablesResponse {
    total: number;
    details: UnitPayable[];
}

/* ================= COMPONENT ================= */

export default function TenantPayables({
                                           tenant_id,
                                       }: {
    tenant_id?: number;
}) {
    const [data, setData] = useState<PayablesResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedUnit, setExpandedUnit] = useState<number | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const router = useRouter();

    /* ================= FETCH ================= */

    useEffect(() => {
        if (!tenant_id) return;

        setLoading(true);
        fetch(
            `/api/analytics/tenant/consolidated/totalPayables?tenant_id=${tenant_id}`
        )
            .then((res) => {
                if (!res.ok) throw new Error("Failed to fetch payables");
                return res.json();
            })
            .then(setData)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [tenant_id]);

    /* ================= HELPERS ================= */

    const formatPHP = (value?: number) =>
        `₱${(Number(value) || 0).toLocaleString("en-PH", {
            minimumFractionDigits: 2,
        })}`;

    const handleBillingPay = (agreementId: string) => {
        router.push(`/tenant/rentalPortal/${agreementId}/billing?agreement_id=${agreementId}`);
    };



    const handleInitialPay = (agreementId: string) => {
        router.push(`/tenant/initialPayment/${agreementId}`);
    };

    const getStatusColor = (status: string) =>
        status === "overdue"
            ? "text-red-600"
            : status === "paid"
                ? "text-emerald-600"
                : "text-amber-600";

    /* ================= STATES ================= */

    if (!tenant_id)
        return (
            <EmptyState
                icon={<ExclamationCircleIcon className="w-6 h-6 text-gray-400" />}
                title="Please log in"
                subtitle="Log in to view your payables"
            />
        );

    if (loading) return <Skeleton />;

    if (error)
        return (
            <EmptyState
                icon={<ExclamationCircleIcon className="w-6 h-6 text-red-500" />}
                title="Error loading payables"
                subtitle={error}
            />
        );

    if (!data) return null;

    const units = data.details.filter((u) => u.total_due > 0);

    if (!units.length)
        return (
            <EmptyState
                icon={<CheckCircleIcon className="w-6 h-6 text-emerald-600" />}
                title="No Outstanding Payables"
                subtitle="All payments are settled"
            />
        );

    /* ================= UI ================= */

    return (
        <div className="w-full">
            {/* HEADER */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-3 py-3 flex justify-between items-center
                   bg-gray-900 rounded-lg hover:bg-gray-800 transition"
            >
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white/10 rounded-md flex items-center justify-center">
                        <CreditCardIcon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold text-gray-300 uppercase">
                            Total Payables
                        </p>
                        <p className="text-lg font-bold text-white">
                            {formatPHP(data.total)}
                        </p>
                        <p className="text-[11px] text-gray-400">
                            {units.length} unit{units.length > 1 && "s"} with balance
                        </p>
                    </div>
                </div>
                <ChevronDownIcon
                    className={`w-4 h-4 text-gray-300 transition-transform ${
                        isExpanded ? "rotate-180" : ""
                    }`}
                />
            </button>

            {/* LIST */}
            <div
                className={`mt-2 space-y-2 transition-all overflow-hidden ${
                    isExpanded ? "max-h-[3000px] opacity-100" : "max-h-0 opacity-0"
                }`}
            >
                {units.map((unit) => (
                    <div
                        key={unit.unit_id}
                        className="bg-white border border-gray-200 rounded-lg"
                    >
                        {/* UNIT HEADER */}
                        <button
                            onClick={() =>
                                setExpandedUnit(
                                    expandedUnit === unit.unit_id ? null : unit.unit_id
                                )
                            }
                            className="w-full px-3 py-2 flex justify-between items-center hover:bg-gray-50"
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                <HomeIcon className="w-4 h-4 text-gray-500" />
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold truncate">
                                        {unit.property_name}
                                    </p>
                                    <p className="text-[11px] text-gray-500 truncate">
                                        Unit {unit.unit_name}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <p className="text-xs font-semibold">
                                    {formatPHP(unit.total_due)}
                                </p>
                                {expandedUnit === unit.unit_id ? (
                                    <ChevronUpIcon className="w-3.5 h-3.5 text-gray-400" />
                                ) : (
                                    <ChevronDownIcon className="w-3.5 h-3.5 text-gray-400" />
                                )}
                            </div>
                        </button>

                        {/* DETAILS */}
                        {expandedUnit === unit.unit_id && (
                            <div className="px-3 pb-3 border-t border-gray-100 space-y-4">
                                {/* MONTHLY BILLING */}
                                {unit.billings.length > 0 && (
                                    <Section title="Monthly Billing">
                                        {unit.billings.map((b) => (
                                            <Row
                                                key={b.billing_id}
                                                title={formatDate(b.billing_period)}
                                                subtitle={`Due ${formatDate(b.billing_due_date)}`}
                                                amount={formatPHP(b.amount)}
                                                status={b.status}
                                                onPay={() => handleBillingPay(unit.agreement_id)}
                                            />
                                        ))}
                                    </Section>
                                )}

                                {/* INITIAL PAYMENTS */}
                                {(unit.security_deposits.length > 0 ||
                                    unit.advance_payments.length > 0) && (
                                    <Section title="Initial Payments">
                                        {unit.security_deposits.map((d, i) => (
                                            <Row
                                                key={`sec-${i}`}
                                                title="Security Deposit"
                                                amount={formatPHP(d.amount)}
                                                status={d.status}
                                                onPay={() => handleInitialPay(unit.agreement_id)}
                                            />
                                        ))}

                                        {unit.advance_payments.map((a, i) => (
                                            <Row
                                                key={`adv-${i}`}
                                                title="Advance Payment"
                                                subtitle={`Covers ${a.months_covered} month(s)`}
                                                amount={formatPHP(a.amount)}
                                                status={a.status}
                                                onPay={() => handleInitialPay(unit.agreement_id)}
                                            />
                                        ))}
                                    </Section>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ================= SMALL UI PARTS ================= */

function Section({ title, children }: any) {
    return (
        <div>
            <p className="text-[11px] font-semibold text-gray-500 uppercase mb-2">
                {title}
            </p>
            <div className="space-y-1.5">{children}</div>
        </div>
    );
}

function Row({ title, subtitle, amount, status, onPay }: any) {
    return (
        <div className="bg-gray-50 rounded-md px-2.5 py-2 flex justify-between items-center">
            <div>
                <p className="text-xs font-medium">{title}</p>
                {subtitle && <p className="text-[11px] text-gray-500">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-2">
                <div className="text-right">
                    <p className="text-xs font-semibold">{amount}</p>
                    <p className={`text-[10px] ${status === "paid" ? "text-emerald-600" : "text-amber-600"}`}>
                        {status}
                    </p>
                </div>
                {status !== "paid" && (
                    <button
                        onClick={onPay}
                        className="px-3 py-1.5 text-[11px] font-semibold rounded-md bg-blue-600 text-white"
                    >
                        Pay
                    </button>
                )}
            </div>
        </div>
    );
}

function EmptyState({ icon, title, subtitle }: any) {
    return (
        <div className="flex flex-col items-center justify-center py-12">
            {icon}
            <p className="mt-2 text-sm font-semibold">{title}</p>
            <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
    );
}

function Skeleton() {
    return <div className="h-24 bg-gray-200 rounded-lg animate-pulse" />;
}
