"use client";

import dynamic from "next/dynamic";

const RevenuePerformanceChart = dynamic(
  () => import("../analytics/revenuePerformance"),

);

interface Props {
    landlordId: string;
}

export default function MobileLandlordDashboard({ landlordId }: Props) {
    return (
        <div className="block md:hidden w-full space-y-6 pb-6 pt-10">
            <RevenuePerformanceChart landlordId={landlordId} />
        </div>
    );
}