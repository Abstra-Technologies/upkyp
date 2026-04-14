"use client";

import { useParams } from "next/navigation";
import { ReceiptText, HelpCircle, AlertTriangle } from "lucide-react";

import PropertyRatesModal from "@/components/landlord/properties/utilityRatesSetter";
import UnitMeterReadingsModal from "@/components/landlord/unitBilling/UnitMeterReadingsModal";

/* 🔹 Hook */
import { usePropertyBilling } from "@/hooks/landlord/billing/usePropertyBilling";

/* 🔹 Components */
import ConfigRequiredModal from "@/components/landlord/property-billing/ConfigRequiredModal";
import BillingActions from "@/components/landlord/property-billing/BillingActions";
import BillingStats from "@/components/landlord/property-billing/BillingStats";
import BillingRateStatus from "@/components/landlord/property-billing/BillingRateStatus";
import BillingUnitListMobile from "@/components/landlord/property-billing/BillingUnitListMobile";
import BillingUnitTableDesktop from "@/components/landlord/property-billing/BillingUnitTableDesktop";
import BillingSkeleton from "@/components/landlord/property-billing/BillingSkeleton";

export default function PropertyBillingPage() {
    const { id } = useParams();
    const property_id = id as string;

    const billing = usePropertyBilling(property_id);

    if (billing.isInitialLoad) {
        return <BillingSkeleton />;
    }

    /* ================= ENTERPRISE VALIDATION ================= */

    const billingBlocked =
        billing.configMissing || billing.payoutMissing;

    return (
        <div className="min-h-screen bg-gray-50 pb-24 md:pb-6">
            <div className="w-full px-4 md:px-6 pt-20 md:pt-6">

                {/* CONFIG MODAL */}
                <ConfigRequiredModal
                    configModal={billing.configModal}
                    setConfigModal={billing.setConfigModal}
                    router={billing.router}
                    property_id={billing.property_id}
                />

                {/* ================= HEADER ================= */}
                <div className="mb-5">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center">
                                <ReceiptText className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                                    Property Billing
                                </h1>
                                <p className="text-xs md:text-sm text-gray-600 mt-0.5">
                                    Manage property-level bills, generate invoices, and download
                                    summaries
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={billing.startTour}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200"
                        >
                            <HelpCircle className="w-4 h-4" />
                            <span className="hidden sm:inline">Show Guide</span>
                        </button>
                    </div>

                    {/* ================= ENTERPRISE VALIDATION CARD ================= */}

                    {billing.payoutMissing && (
                        <div className="mb-5 p-4 rounded-xl border border-amber-300 bg-amber-50">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-amber-800">
                                        Payout Account Required
                                    </p>
                                    <p className="text-sm text-amber-700 mt-1">
                                        You must set a default payout account before issuing billing.
                                        This ensures rent payments can be transferred to your bank.
                                    </p>

                                    <button
                                        onClick={() =>
                                            billing.router.push(
                                                "/pages/landlord/settings/payout"
                                            )
                                        }
                                        className="mt-3 px-4 py-2 text-sm font-medium bg-amber-600 hover:bg-amber-700 text-white rounded-lg"
                                    >
                                        Set Up Payout Account
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ================= ACTION BUTTONS ================= */}

                    <BillingActions
                        propertyDetails={billing.propertyDetails}
                        configMissing={billing.configMissing}
                        payoutMissing={billing.payoutMissing}
                        setIsModalOpen={(val: boolean) => {
                            if (billingBlocked) return;
                            billing.setIsModalOpen(val);
                        }}
                        handleDownloadSummary={() => {
                            if (billingBlocked) return;
                            billing.handleDownloadSummary();
                        }}
                    />

                    {/* ================= STATS ================= */}
                    {!billingBlocked && (
                        <BillingStats bills={billing.bills} />
                    )}

                    {/* ================= RATE STATUS ================= */}
                    {!billingBlocked && (
                        <BillingRateStatus
                            propertyDetails={billing.propertyDetails}
                            hasBillingForMonth={billing.hasBillingForMonth}
                            billingData={billing.billingData}
                        />
                    )}
                </div>

                {/* ================= MODALS ================= */}
                {!billingBlocked && (
                    <>
                        <PropertyRatesModal
                            isOpen={billing.isModalOpen}
                            onClose={() => billing.setIsModalOpen(false)}
                            billingData={billing.billingData}
                            billingForm={billing.billingForm}
                            propertyDetails={billing.propertyDetails}
                            hasBillingForMonth={billing.hasBillingForMonth}
                            handleInputChange={billing.handleInputChange}
                            handleSaveorUpdateRates={billing.handleSaveorUpdateRates}
                            onBillingUpdated={(updated) => {
                                billing.setBillingData(updated);
                                billing.setHasBillingForMonth(true);
                            }}
                        />

                        <UnitMeterReadingsModal
                            isOpen={billing.openMeterList}
                            onClose={() => billing.setOpenMeterList(false)}
                            property_id={billing.property_id}
                        />

                        {/* MOBILE LIST */}
                        <BillingUnitListMobile
                            bills={billing.bills}
                            loadingBills={billing.loadingBills}
                            propertyDetails={billing.propertyDetails}
                            router={billing.router}
                            property_id={billing.property_id}
                            guardActionWithConfig={billing.guardBillingAction}
                            getStatusConfig={billing.getStatusConfig}
                        />

                        {/* DESKTOP TABLE */}
                        <BillingUnitTableDesktop
                            bills={billing.bills}
                            loadingBills={billing.loadingBills}
                            propertyDetails={billing.propertyDetails}
                            router={billing.router}
                            property_id={billing.property_id}
                            guardActionWithConfig={billing.guardBillingAction}
                            getStatusConfig={billing.getStatusConfig}
                        />
                    </>
                )}
            </div>
        </div>
    );
}