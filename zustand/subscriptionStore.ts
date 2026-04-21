import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SelectedPlan {
    id: number;
    planCode?: string;
    name: string;
    price: number;
    unitBandIndex?: number;
    bandRange?: string;
    monthlyPrice?: number;
    proratedAmount?: number;
}

interface SubscriptionStore {
    selectedPlan: SelectedPlan | null;
    setSelectedPlan: (plan: SelectedPlan | null) => void;
    clearSelectedPlan: () => void;
}

export const useSubscriptionStore = create<SubscriptionStore>()(
    persist(
        (set) => ({
            selectedPlan: null,
            setSelectedPlan: (plan) => set({ selectedPlan: plan }),
            clearSelectedPlan: () => set({ selectedPlan: null }),
        }),
        {
            name: "subscription-selection",
        }
    )
);