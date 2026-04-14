"use client";

import { BackButton } from "@/components/navigation/backButton";
import {
    ArrowRight,
    CreditCard,
    CheckCircle,
    CalendarClock,
    Wallet,
    Info,
} from "lucide-react";

export default function PaymentPayoutGuidePage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 p-4 sm:p-6">
            {/* Back */}
            <div className="mb-4">
                <BackButton label="Back to Guide" />
            </div>

            {/* Header */}
            <div className="relative bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100 overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500" />
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800">
                    Payment & Payout Process
                </h1>
                <p className="text-gray-600 mt-2 max-w-3xl">
                    This guide explains how tenant payments are processed through Xendit
                    and how payouts are disbursed to landlords via UPKYP.
                </p>
            </div>

            {/* Flow Section */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-10">
                <h2 className="text-xl font-bold text-gray-800 mb-6">
                    Payment to Payout Flow
                </h2>

                <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                    {/* Step 1 */}
                    <FlowCard
                        icon={<CreditCard className="h-7 w-7 text-blue-600" />}
                        title="Tenant Makes Payment"
                        description="Tenant pays rent or billing through Xendit-supported payment methods."
                        color="bg-blue-100"
                    />

                    <Arrow />

                    {/* Step 2 */}
                    <FlowCard
                        icon={<CheckCircle className="h-7 w-7 text-emerald-600" />}
                        title="Xendit Processes Payment"
                        description="Xendit securely processes and confirms the payment transaction."
                        color="bg-emerald-100"
                    />

                    <Arrow />

                    {/* Step 3 */}
                    <FlowCard
                        icon={<CalendarClock className="h-7 w-7 text-purple-600" />}
                        title="UPKYP Disbursement Processing"
                        description="UPKYP consolidates payments and prepares disbursement every 15th of the following month."
                        color="bg-purple-100"
                    />

                    <Arrow />

                    {/* Step 4 */}
                    <FlowCard
                        icon={<Wallet className="h-7 w-7 text-amber-600" />}
                        title="Payout to Landlord"
                        description="Funds are disbursed to the landlord’s registered payout account."
                        color="bg-amber-100"
                    />
                </div>
            </div>

            {/* ================= FEES SECTION ================= */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-10">
                <div className="flex items-center gap-2 mb-4">
                    <Info className="w-5 h-5 text-blue-600" />
                    <h2 className="text-xl font-bold text-gray-800">
                        Payment Processing Fees
                    </h2>
                </div>

                <p className="text-gray-600 mb-6 max-w-3xl">
                    Tenant payments are processed through Xendit. Each transaction is
                    subject to payment gateway fees depending on the payment method used.
                    These fees are automatically deducted before landlord payout.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {/* E-Wallet */}
                    <FeeCard
                        title="GCash / Maya (E-Wallets)"
                        fee="~2.5% – 3.5%"
                        description="Percentage-based fee per successful transaction."
                    />

                    {/* Online Banking */}
                    <FeeCard
                        title="Online Banking"
                        fee="~1.5% – 2.5%"
                        description="Applies to PesoNet / InstaPay bank transfers."
                    />

                    {/* Over-the-Counter */}
                    <FeeCard
                        title="Over-the-Counter"
                        fee="Fixed + %"
                        description="Includes 7-Eleven, Cebuana, MLhuillier payments."
                    />

                    {/* Credit / Debit */}
                    <FeeCard
                        title="Credit / Debit Card"
                        fee="~3.5% + ₱15"
                        description="Includes Visa, Mastercard, JCB processing fees."
                    />

                    {/* Disbursement Fee */}
                    <FeeCard
                        title="Bank Disbursement"
                        fee="₱10 – ₱15"
                        description="Fee per payout transfer to landlord bank account."
                    />

                    {/* Platform Fee */}
                    <FeeCard
                        title="UPKYP Platform Fee"
                        fee="Based on Subscription"
                        description="Platform commission may apply depending on plan tier."
                    />
                </div>

                <div className="mt-6 text-xs text-gray-500">
                    * Fees shown are approximate and subject to change. Refer to Xendit’s
                    official pricing page for the latest rates.
                </div>
            </div>

        </div>
    );
}

/* Flow Card Component */
function FlowCard({
                      icon,
                      title,
                      description,
                      color,
                  }: {
    icon: React.ReactNode;
    title: string;
    description: string;
    color: string;
}) {
    return (
        <div className="flex flex-col items-center text-center max-w-xs">
            <div className={`p-4 rounded-2xl shadow-md ${color} mb-4`}>
                {icon}
            </div>
            <h3 className="font-bold text-gray-800 mb-2">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
        </div>
    );
}

/* Arrow Component */
function Arrow() {
    return (
        <ArrowRight className="hidden lg:block h-6 w-6 text-gray-400 flex-shrink-0" />
    );
}

function FeeCard({
                     title,
                     fee,
                     description,
                 }: {
    title: string;
    fee: string;
    description: string;
}) {
    return (
        <div className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition">
            <h3 className="font-semibold text-gray-800 mb-1">{title}</h3>
            <p className="text-emerald-600 font-bold mb-2">{fee}</p>
            <p className="text-sm text-gray-600">{description}</p>
        </div>
    );
}
