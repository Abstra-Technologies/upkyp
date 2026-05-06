"use client";

import useSubscription, { FeatureKey } from "./useSubscription";

interface UseFeatureAccessProps {
    landlordId?: number | string;
    feature: FeatureKey;
}

export function useFeatureAccess({ landlordId, feature }: UseFeatureAccessProps) {
    const { subscription, loadingSubscription, hasFeature } = useSubscription(landlordId);

    const isLocked = loadingSubscription ? false : !hasFeature(feature);

    return {
        subscription,
        loadingSubscription,
        isLocked,
        hasAccess: !isLocked,
    };
}
