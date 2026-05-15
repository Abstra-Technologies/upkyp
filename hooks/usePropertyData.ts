// landlord side
//  used in viewUnits page

import useSWR, { SWRConfiguration } from "swr";
import axios from "axios";

const fetcher = (url: string) => axios.get(url).then(res => res.data);

const defaultConfig: SWRConfiguration = {
    dedupingInterval: 60_000,
    keepPreviousData: true,
    revalidateOnFocus: true,
    refreshInterval: 60_000,
};

export function usePropertyData(propertyId: string, landlordId?: string, config?: SWRConfiguration) {
    const mergedConfig = { ...defaultConfig, ...config };

    const { data: property } = useSWR(
        propertyId ? `/api/propertyListing/viewDetailedProperty/${propertyId}` : null,
        fetcher,
        mergedConfig
    );

    const { data: subscription, isLoading: loadingSubscription } = useSWR(
        landlordId ? `/api/landlord/subscription/active/${landlordId}` : null,
        fetcher,
        mergedConfig
    );

    const { data: units, error, isLoading } = useSWR(
        propertyId ? `/api/unitListing/getUnitListings?property_id=${propertyId}` : null,
        fetcher,
        mergedConfig
    );

    return { property, subscription, units, error, isLoading, loadingSubscription };
}
