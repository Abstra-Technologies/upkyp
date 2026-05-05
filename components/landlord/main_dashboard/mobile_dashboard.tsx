"use client";

import dynamic from "next/dynamic";
import LeaseOccupancyCard from "./LeaseOccupancyCard";

const RevenuePerformanceChart = dynamic(
  () => import("../analytics/revenuePerformance"),
);

interface Props {
    landlordId: string;
}

export default function MobileLandlordDashboard({ landlordId }: Props) {
    return (
        <div className="block md:hidden w-full space-y-4 pb-6 pt-10 px-3">
            <RevenuePerformanceChart landlordId={landlordId} />
            <LeaseOccupancyCard landlord_id={landlordId} />
        </div>
    );
}