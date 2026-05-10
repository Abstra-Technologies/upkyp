"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import useSWR from "swr";
import axios from "axios";
import Swal from "sweetalert2";
import useAuthStore from "@/zustand/authStore";

const fetcher = (url: string) => axios.get(url).then(res => res.data);

export function useBillingByPeriod(property_id: string, month: number, year: number) {
    const router = useRouter();
    const { user } = useAuthStore();
    const landlord_id = user?.landlord_id;

    const [configMissing, setConfigMissing] = useState(false);
    const [payoutMissing, setPayoutMissing] = useState(false);
    const [propertyDetails, setPropertyDetails] = useState<any>(null);

    const { data, isLoading, mutate } = useSWR(
        property_id ? `/api/landlord/billing/byPeriod?property_id=${property_id}&month=${month}&year=${year}` : null,
        fetcher,
        { revalidateOnFocus: false }
    );

    const bills = data?.bills || [];
    const scorecards = data?.scorecards || {
        expectedRevenue: 0,
        totalCollected: 0,
        totalOutstanding: 0,
        collectedPercent: 0,
        pendingCount: 0,
        totalLeases: 0,
        hasBillCount: 0,
        noBillCount: 0,
    };

    useEffect(() => {
        if (!property_id || !landlord_id) return;
        checkPropertyConfig();
        checkDefaultPayoutAccount(landlord_id);
        fetchPropertyDetails();
    }, [property_id, landlord_id]);

    const checkPropertyConfig = async () => {
        try {
            const [configRes, propRes] = await Promise.all([
                axios.get("/api/landlord/properties/configuration", { params: { id: property_id } }),
                axios.get("/api/propertyListing/getPropDetailsById", { params: { property_id } }),
            ]);

            const config = configRes.data;
            const property = propRes.data.property;
            const isSubmetered = property?.is_submetered === 1 || property?.is_submetered === true;

            const missingDueDay = config?.billingDueDay == null;
            const missingReminderDay = config?.billingReminderDay == null;
            const missingMeterDate = isSubmetered && config?.meter_reading_date == null;

            setConfigMissing(missingDueDay || missingReminderDay || missingMeterDate);
        } catch {
            setConfigMissing(true);
        }
    };

    const checkDefaultPayoutAccount = async (landlord_id: string) => {
        try {
            const { data } = await axios.get("/api/landlord/payout/getAccount", { params: { landlord_id } });
            const isValid = data && data.hasDefaultPayout === true && data.account && Number(data.account.is_active) === 1;
            setPayoutMissing(!isValid);
        } catch {
            setPayoutMissing(true);
        }
    };

    const fetchPropertyDetails = async () => {
        try {
            const res = await axios.get("/api/propertyListing/getPropDetailsById", { params: { property_id } });
            setPropertyDetails(res.data.property);
        } catch {
            setPropertyDetails(null);
        }
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
                if (result.isConfirmed) router.push("/landlord/settings/payout");
            });
            return;
        }
        action();
    };

    const handleDownloadSummary = () => {
        guardBillingAction(() => {
            window.open(`/api/landlord/billing/downloadSummary?property_id=${property_id}&month=${month}&year=${year}`, "_blank");
        });
    };

    const redirectToGenerateBill = () => {
        guardBillingAction(() => {
            router.push(`/landlord/properties/${property_id}/billing/createUnitBill?month=${month}&year=${year}`);
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

    return {
        property_id,
        router,
        bills,
        scorecards,
        isLoading,
        configMissing,
        payoutMissing,
        propertyDetails,
        mutate,
        guardBillingAction,
        handleDownloadSummary,
        redirectToGenerateBill,
        getStatusConfig,
    };
}