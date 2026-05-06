"use client";

import useSWR from "swr";
import axios from "axios";

const fetcher = async (url: string) => {
    const res = await axios.get(url);
    return res.data;
};

export type PlanFeatures = {
    reports: boolean;
    pdc_management: boolean;
    ai_unit_generator: boolean;
    bulk_import: boolean;
    announcements: boolean;
    asset_management: boolean;
    financial_insights: boolean;
};

export type PlanLimits = {
    max_storage: string | null;
    max_assets_per_property: number | null;
    financial_history_years: number | null;
};

export type Subscription = {
    subscription_id: string;
    plan_id: number;
    plan_code: string;
    plan_name: string;
    price: number;
    billing_cycle: "monthly" | "yearly" | "lifetime";
    start_date: string;
    end_date: string;
    payment_status: string;
    subscription_status: string;
    is_trial: number;
    is_active: number;
    limits: PlanLimits;
    features: PlanFeatures;
    unitPricesByType: Record<string, number>;
};

export type FeatureKey = keyof PlanFeatures;
export type LimitKey = keyof PlanLimits;

export default function useSubscription(landlordId?: number | string) {
    const swrKey = landlordId
        ? `/api/landlord/subscription/active/${landlordId}`
        : null;

    const { data, error, isLoading, mutate } = useSWR<Subscription>(swrKey, fetcher, {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        revalidateIfStale: true,
        dedupingInterval: 5_000,
        keepPreviousData: true,
    });

    const upgradeSubscriptionOptimistic = async (updatedFields: Partial<Subscription>) => {
        if (!data) return;

        const previous = data;

        await mutate({ ...data, ...updatedFields }, false);

        try {
            await mutate();
        } catch {
            await mutate(previous, false);
        }
    };

    const refreshSubscription = async () => {
        await mutate();
    };

    const isUnlimited = (value: number | null | undefined) =>
        value === null || value === undefined;

    const hasFeature = (feature: FeatureKey) =>
        data?.features?.[feature] === true;

    const hasLimitAvailable = (limit: LimitKey, currentCount: number) => {
        const max = data?.limits?.[limit];
        if (isUnlimited(max)) return true;
        return currentCount < (max ?? 0);
    };

    return {
        subscription: data ?? null,
        loadingSubscription: isLoading,
        errorSubscription: error
            ? error.response?.data?.error ?? error.response?.data?.message ?? "Failed to fetch subscription."
            : null,
        refreshSubscription,
        mutateSubscription: mutate,
        upgradeSubscriptionOptimistic,
        hasFeature,
        hasLimitAvailable,
        isUnlimited,
    };
}
