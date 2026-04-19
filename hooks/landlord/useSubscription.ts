"use client";

import useSWR, { KeyedMutator } from "swr";
import axios from "axios";

const fetcher = async (url: string) => {
    const res = await axios.get(url);
    return res.data;
};

export type Subscription = {
    subscription_id: number;
    plan_id: number;
    plan_code: string;
    plan_name: string;
    price: number;
    billing_cycle: "monthly" | "yearly" | "lifetime";

    start_date: string;
    end_date: string;
    payment_status: string;
    is_trial: number;
    is_active: number;

    limits: {
        maxStorage: string | null;
        maxAssetsPerProperty: number | null;
        financialHistoryYears: number | null;
    };

    features: {
        reports: boolean;
        pdcManagement: boolean;
        aiUnitGenerator: boolean;
        bulkImport: boolean;
        announcements: boolean;
        assetManagement: boolean;
        financialInsights: boolean;
    };
};

export default function useSubscription(
    landlordId?: number | string
) {
    const swrKey = landlordId
        ? `/api/landlord/subscription/active/${landlordId}`
        : null;

    const {
        data,
        error,
        isLoading,
        mutate,
    } = useSWR<Subscription>(swrKey, fetcher, {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        revalidateIfStale: false,
        dedupingInterval: 30_000,
        keepPreviousData: true,
    });

    const upgradeSubscriptionOptimistic = async (
        updatedFields: Partial<Subscription>
    ) => {
        if (!data) return;

        //  Snapshot previous data
        const previous = data;

        //  Optimistically update UI
        await mutate(
            { ...data, ...updatedFields },
            false // do NOT revalidate yet
        );

        try {
            // 3⃣ Background revalidation
            await mutate();
        } catch (err) {
            //  Rollback on failure
            await mutate(previous, false);
        }
    };

    const refreshSubscription = async () => {
        await mutate();
    };


    const isUnlimited = (value: number | null | undefined) =>
        value === null || value === undefined;

    const hasFeature = (feature: keyof Subscription["features"]) =>
        data?.features?.[feature] === true;

    const hasLimitAvailable = (
        limit: keyof Subscription["limits"],
        currentCount: number
    ) => {
        const max = data?.limits?.[limit];
        if (isUnlimited(max)) return true;
        return currentCount < (max ?? 0);
    };

    return {
        subscription: data ?? null,
        loadingSubscription: isLoading,

        errorSubscription: error
            ? error.response?.data?.error ??
            error.response?.data?.message ??
            "Failed to fetch subscription."
            : null,

        refreshSubscription,
        mutateSubscription: mutate,

        upgradeSubscriptionOptimistic,

        hasFeature,
        hasLimitAvailable,
        isUnlimited,
    };
}
