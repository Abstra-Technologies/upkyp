"use client";

import LandlordPropertyMarqueeMobile from "@/components/landlord/main_dashboard/LandlordPropertyMarqueeMobile";

interface Props {
    landlordId: string;
}

export default function MobileLandlordDashboard({ landlordId }: Props) {
    return (
        <div className="block md:hidden w-full space-y-6 pb-6 pt-10">
            {/* Property Carousel */}
            <LandlordPropertyMarqueeMobile landlordId={landlordId} />
        </div>
    );
}