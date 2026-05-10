"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import useSWR from "swr";
import axios from "axios";
import Swal from "sweetalert2";
import useAuthStore from "@/zustand/authStore";

const fetcher = (url: string) => axios.get(url).then(res => res.data);

export function usePropertyBilling(propertyId: string) {
    const router = useRouter();
    const { user } = useAuthStore();
    const landlord_id = user?.landlord_id;

    const [selectedPeriod, setSelectedPeriod] = useState<{ month: number; year: number }>({
        month: new Date().getMonth(),
        year: new Date().getFullYear(),
    });

    const [propertyDetails, setPropertyDetails] = useState<any>(null);
    const [billingData, setBillingData] = useState<any>(null);
    const [hasBillingForMonth, setHasBillingForMonth] = useState(false);
    const [configMissing, setConfigMissing] = useState(false);
    const [payoutMissing, setPayoutMissing] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [openMeterList, setOpenMeterList] = useState(false);

    const [billingForm, setBillingForm] = useState({
        billingPeriod: "",
        electricityConsumption: "",
        electricityTotal: "",
        waterConsumption: "",
        waterTotal: "",
    });

    const { data: billsData, isLoading: loadingBills, mutate: mutateBills } = useSWR(
        propertyId
            ? `/api/landlord/billing/current?property_id=${propertyId}&month=${selectedPeriod.month}&year=${selectedPeriod.year}`
            : null,
        fetcher
    );

    const bills = billsData?.bills || [];

    const checkPropertyConfig = async () => {
        try {
            const [configRes, propRes] = await Promise.all([
                axios.get("/api/landlord/properties/configuration", { params: { id: propertyId } }),
                axios.get("/api/propertyListing/getPropDetailsById", { params: { property_id: propertyId } }),
            ]);

            const config = configRes.data;
            const property = propRes.data.property;
            const isSubmetered = property?.is_submetered === 1 || property?.is_submetered === true;

            const missingDueDay = config?.billingDueDay == null;
            const missingReminderDay = config?.billingReminderDay == null;
            const missingMeterDate = isSubmetered && config?.meterReadingDay == null;

            setConfigMissing(missingDueDay || missingReminderDay || missingMeterDate);
        } catch (err) {
            console.error("Config check error:", err);
            setConfigMissing(true);
        }
    };

    const checkDefaultPayoutAccount = async (landlord_id: string) => {
        try {
            const { data } = await axios.get("/api/landlord/payout/getAccount", { params: { landlord_id } });
            const isValid = data?.hasDefaultPayout === true && data?.account && Number(data.account.is_active) === 1;
            setPayoutMissing(!isValid);
        } catch {
            setPayoutMissing(true);
        }
    };

    const fetchPropertyDetails = async () => {
        const res = await axios.get("/api/propertyListing/getPropDetailsById", { params: { property_id: propertyId } });
        setPropertyDetails(res.data.property);
    };

    const fetchBillingData = async () => {
        try {
            const res = await axios.get("/api/landlord/billing/checkPropertyBillingStats", {
                params: { property_id: propertyId, month: selectedPeriod.month, year: selectedPeriod.year },
            });

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
        } catch (err) {
            console.error("Error fetching billing data:", err);
        }
    };

    useEffect(() => {
        if (!propertyId) return;

        const load = async () => {
            try {
                await Promise.all([
                    checkPropertyConfig(),
                    checkDefaultPayoutAccount(landlord_id),
                    fetchPropertyDetails(),
                ]);
            } catch (err) {
                console.error("Initial load error:", err);
            }
        };

        load();
    }, [propertyId, landlord_id]);

    useEffect(() => {
        if (selectedPeriod) {
            fetchBillingData();
        }
    }, [selectedPeriod]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setBillingForm(prev => ({ ...prev, [name]: value }));
    };

    const guardBillingAction = (action: () => void) => {
        if (configMissing) {
            Swal.fire("Configuration Required", "Please complete the property configuration first.", "warning");
            return;
        }
        if (payoutMissing) {
            Swal.fire({
                title: "Payout Account Required",
                text: "Set your default payout account before issuing billing.",
                icon: "warning",
                confirmButtonText: "Set Up Now",
            }).then((result) => {
                if (result.isConfirmed) router.push("/pages/commons/landlord/payoutDetails");
            });
            return;
        }
        action();
    };

    const handleSaveorUpdateRates = async (e: React.FormEvent) => {
        e.preventDefault();
        guardBillingAction(async () => {
            await axios.post("/api/landlord/billing/savePropertyConcessionaireRates", {
                property_id: propertyId,
                period_start: billingForm.periodStart,
                period_end: billingForm.periodEnd,
                electricityConsumption: +billingForm.electricityConsumption || 0,
                electricityTotal: +billingForm.electricityTotal || 0,
                waterConsumption: +billingForm.waterConsumption || 0,
                waterTotal: +billingForm.waterTotal || 0,
            });
            await fetchBillingData();
            Swal.fire("Success", "Billing saved successfully.", "success");
        });
    };

    const handleDownloadSummary = () => {
        guardBillingAction(() => {
            window.open(`/api/landlord/billing/downloadSummary?property_id=${propertyId}`, "_blank");
        });
    };

    const getStatusConfig = (status: string) => {
        switch (status?.toLowerCase()) {
            case "paid": return "bg-emerald-50 text-emerald-700 border-emerald-200";
            case "overdue": return "bg-red-50 text-red-700 border-red-200";
            case "unpaid": return "bg-amber-50 text-amber-700 border-amber-200";
            default: return "bg-gray-50 text-gray-700 border-gray-200";
        }
    };

    return {
        propertyId,
        landlord_id,
        router,

        bills,
        loadingBills,
        error: billsData?.error,

        propertyDetails,
        billingData,
        billingForm,
        hasBillingForMonth,
        configMissing,
        payoutMissing,
        isModalOpen,
        openMeterList,

        selectedPeriod,
        setSelectedPeriod,

        setIsModalOpen,
        setOpenMeterList,
        setBillingData,
        setHasBillingForMonth,

        handleInputChange,
        handleSaveorUpdateRates,
        handleDownloadSummary,
        guardBillingAction,
        getStatusConfig,
        mutateBills,
    };
}
