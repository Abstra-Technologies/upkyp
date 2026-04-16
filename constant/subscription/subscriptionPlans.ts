// constants/subscriptionPlans.ts

export interface UnitBand {
    range: string;
    minUnits: number;
    maxUnits: number;
    monthlyPrice: number;
    annualPrice: number;
}

export interface SubscriptionPlan {
    id: number;
    name: string;
    price: number;
    trialDays: number;
    popular: boolean;
    features: string[];
    transactionFeeRate: number;
    discountedFeeRate: number;
    isLifetime?: boolean;
    unitBands?: UnitBand[];
}

export const UNIT_BANDS: UnitBand[] = [
    { range: "1–20", minUnits: 1, maxUnits: 20, monthlyPrice: 0, annualPrice: 0 },
    { range: "21–50", minUnits: 21, maxUnits: 50, monthlyPrice: 0, annualPrice: 0 },
    { range: "51–100", minUnits: 51, maxUnits: 100, monthlyPrice: 0, annualPrice: 0 },
    { range: "101–200", minUnits: 101, maxUnits: 200, monthlyPrice: 0, annualPrice: 0 },
];

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
    {
        id: 1,
        name: "Starter Plan",
        price: 200,
        trialDays: 0,
        popular: false,
        transactionFeeRate: 4.8,
        discountedFeeRate: 4.0,
        features: [
            "20 units floor cap.",
            "Maintenance Management",
            "Announcement and Messaging",
            "Billing Management",
            "2GB Document Storage"
        ],
    },
    {
        id: 2,
        name: "Growth Plan",
        price: 1499,
        trialDays: 60,
        popular: true,
        transactionFeeRate: 4.8,
        discountedFeeRate: 4.5,
        unitBands: [
            { range: "1–20", minUnits: 1, maxUnits: 20, monthlyPrice: 1499, annualPrice: 14388 },
            { range: "21–50", minUnits: 21, maxUnits: 50, monthlyPrice: 1999, annualPrice: 19188 },
            { range: "51–100", minUnits: 51, maxUnits: 100, monthlyPrice: 3499, annualPrice: 33588 },
            { range: "101–200", minUnits: 101, maxUnits: 200, monthlyPrice: 5999, annualPrice: 57588 },
        ],
        features: [
            "60-day Free Trial",
            "Analytics Reports",
            "BIR Compliance Report ",
            "2GB Document Storage",
            "Open API Access ",
        ],
    },
    {
        id: 3,
        name: "Pro Plan",
        price: 2499,
        trialDays: 60,
        popular: false,
        transactionFeeRate: 4.8,
        discountedFeeRate: 4.5,
        unitBands: [
            { range: "1–20", minUnits: 1, maxUnits: 20, monthlyPrice: 2499, annualPrice: 23988 },
            { range: "21–50", minUnits: 21, maxUnits: 50, monthlyPrice: 2999, annualPrice: 28788 },
            { range: "51–100", minUnits: 51, maxUnits: 100, monthlyPrice: 5499, annualPrice: 52788 },
            { range: "101–200", minUnits: 101, maxUnits: 200, monthlyPrice: 9999, annualPrice: 95988 },
        ],
        features: [
            "60-day Free Trial",
            "Analytics Reports",
            "Open API Access ",
            "2GB Document Storage",
            "BIR Compliance Report ",

        ],
    },
    {
        id: 4,
        name: "Lifetime License",
        price: 0,
        trialDays: 0,
        popular: false,
        transactionFeeRate: 4.8,
        discountedFeeRate: 4.5,
        isLifetime: true,
        unitBands: [
            { range: "1–20", minUnits: 1, maxUnits: 20, monthlyPrice: 29999, annualPrice: 287988 },
            { range: "21–50", minUnits: 21, maxUnits: 50, monthlyPrice: 49999, annualPrice: 479988 },
            { range: "51–100", minUnits: 51, maxUnits: 100, monthlyPrice: 79999, annualPrice: 767988 },
            { range: "101–200", minUnits: 101, maxUnits: 200, monthlyPrice: 149999, annualPrice: 1439988 },
        ],
        features: [
            "One-time payment, lifetime access",
            "Analytics Reports",
            "Open API Access ",
            "BIR Compliance Report ",

        ],
    },
];