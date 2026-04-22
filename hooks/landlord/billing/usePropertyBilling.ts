"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import useSWR from "swr";
import axios from "axios";
import Swal from "sweetalert2";
import { useOnboarding } from "@/hooks/useOnboarding";
import { propertyBillingSteps } from "@/lib/onboarding/propertyBilling";
import useAuthStore from "@/zustand/authStore"; // ✅ important

const fetcher = (url: string) => axios.get(url).then(res => res.data);

export function usePropertyBilling(property_id: string) {
    const router = useRouter();
    const { user } = useAuthStore();

    const landlord_id = user?.landlord_id;

    /* ================= STATE ================= */

    const [openMeterList, setOpenMeterList] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [propertyDetails, setPropertyDetails] = useState<any>(null);
    const [billingData, setBillingData] = useState<any>(null);
    const [hasBillingForMonth, setHasBillingForMonth] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const [configMissing, setConfigMissing] = useState(false);
    const [configModal, setConfigModal] = useState(false);
    const [payoutMissing, setPayoutMissing] = useState(false);

    const [billingForm, setBillingForm] = useState({
        billingPeriod: "",
        electricityConsumption: "",
        electricityTotal: "",
        waterConsumption: "",
        waterTotal: "",
    });

    /* ================= ONBOARDING ================= */

    const { startTour } = useOnboarding({
        tourId: "property-billing",
        steps: propertyBillingSteps,
        autoStart: true,
    });

    /* ================= DATA ================= */

    const { data: billsData, isLoading: loadingBills } = useSWR(
        property_id
            ? `/api/landlord/billing/current?property_id=${property_id}`
            : null,
        fetcher
    );

    const bills = billsData?.bills || [];

    /* ================= INITIAL LOAD ================= */

    useEffect(() => {
        if (!property_id || !landlord_id) return;

        const load = async () => {
            try {
                setIsInitialLoad(true);

                await Promise.all([
                    checkPropertyConfig(),
                    checkDefaultPayoutAccount(landlord_id),
                    fetchPropertyDetails(),
                    fetchBillingData(),
                ]);
            } finally {
                setIsInitialLoad(false);
            }
        };

        load();
    }, [property_id, landlord_id]);

    /* ================= HELPERS ================= */

    const checkPropertyConfig = async () => {
        try {
            const res = await axios.get("/api/properties/configuration", {
                params: { id: property_id },
            });

            if (!res.data?.billingDueDay) {
                setConfigMissing(true);
                setConfigModal(true);
            } else {
                setConfigMissing(false);
            }
        } catch {
            setConfigMissing(true);
            setConfigModal(true);
        }
    };

    /* 🔥 FIXED Payout Check */
    const checkDefaultPayoutAccount = async (landlord_id: string) => {
        try {
            const { data } = await axios.get(
                "/api/landlord/payout/getAccount",
                { params: { landlord_id } }
            );

            const isValid =
                data &&
                data.hasDefaultPayout === true &&
                data.account &&
                Number(data.account.is_active) === 1;

            setPayoutMissing(!isValid);

        } catch (err) {
            console.error("Default payout validation error:", err);
            setPayoutMissing(true);
        }
    };

    const fetchPropertyDetails = async () => {
        const res = await axios.get(
            "/api/propertyListing/getPropDetailsById",
            { params: { property_id } }
        );
        setPropertyDetails(res.data.property);
    };

    const fetchBillingData = async () => {
        const res = await axios.get(
            "/api/landlord/billing/checkPropertyBillingStats",
            { params: { property_id } }
        );

        if (res.data.billingData) {
            const data = res.data.billingData;
            setBillingData(data);
            setHasBillingForMonth(true);

            setBillingForm({
                billingPeriod: data.billing_period || "",
                electricityTotal: data.electricity?.total || "",
                electricityConsumption: data.electricity?.consumption || "",
                waterTotal: data.water?.total || "",
                waterConsumption: data.water?.consumption || "",
            });
        } else {
            setBillingData(null);
            setHasBillingForMonth(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setBillingForm(prev => ({ ...prev, [name]: value }));
    };

    /* ================= GUARD ================= */

    const guardBillingAction = (action: () => void) => {
        if (configMissing) {
            Swal.fire(
                "Configuration Required",
                "Please complete the property configuration first.",
                "warning"
            );
            return;
        }

        if (payoutMissing) {
            Swal.fire({
                title: "Payout Account Required",
                text: "Set your default payout account before issuing billing.",
                icon: "warning",
                confirmButtonText: "Set Up Now",
            }).then((result) => {
                if (result.isConfirmed) {
                    router.push("/pages/commons/landlord/payoutDetails");
                }
            });
            return;
        }

        action();
    };

    /* ================= SAVE ================= */

    const handleSaveorUpdateRates = async (e: React.FormEvent) => {
        e.preventDefault();

        guardBillingAction(async () => {
            await axios.post(
                "/api/landlord/billing/savePropertyConcessionaireRates",
                {
                    property_id,
                    period_start: billingForm.periodStart,
                    period_end: billingForm.periodEnd,
                    electricityConsumption: +billingForm.electricityConsumption || 0,
                    electricityTotal: +billingForm.electricityTotal || 0,
                    waterConsumption: +billingForm.waterConsumption || 0,
                    waterTotal: +billingForm.waterTotal || 0,
                }
            );

            await fetchBillingData();

            Swal.fire("Success", "Billing saved successfully.", "success");
        });
    };

    const handleDownloadSummary = () => {
        guardBillingAction(() => {
            window.open(
                `/api/landlord/billing/downloadSummary?property_id=${property_id}`,
                "_blank"
            );
        });
    };

    const getStatusConfig = (status: string) => {
        switch (status?.toLowerCase()) {
            case "paid":
                return "bg-emerald-50 text-emerald-700 border-emerald-200";
            case "overdue":
                return "bg-red-50 text-red-700 border-red-200";
            case "unpaid":
                return "bg-amber-50 text-amber-700 border-amber-200";
            default:
                return "bg-gray-50 text-gray-700 border-gray-200";
        }
    };

    /* ================= EXPORT ================= */

    return {
        property_id,
        router,

        isInitialLoad,
        propertyDetails,
        billingData,
        billingForm,
        hasBillingForMonth,
        configMissing,
        configModal,
        payoutMissing,
        bills,
        loadingBills,
        openMeterList,
        isModalOpen,

        setIsModalOpen,
        setOpenMeterList,
        setConfigModal,
        setBillingData,
        setHasBillingForMonth,

        handleInputChange,
        handleSaveorUpdateRates,
        handleDownloadSummary,
        guardBillingAction,
        getStatusConfig,
        startTour,
    };
}