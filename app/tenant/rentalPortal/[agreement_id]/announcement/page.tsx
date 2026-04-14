"use client";

import { Suspense } from "react";
import Announcements from "@/components/annoucements/announcementList";
import { useSearchParams } from "next/navigation";
import useAuthStore from "@/zustand/authStore";

function AnnouncementWrapper() {
    const searchParams = useSearchParams();
    const agreementId = searchParams.get("agreement_id");

    const { user, fetchSession, loading } = useAuthStore();

    return (
            <Announcements user_id={user?.user_id} agreement_id={agreementId} />
    );
}

export default function TenantAnnouncements() {
    return (
        <Suspense fallback={<div>Loading announcements...</div>}>
            <AnnouncementWrapper />
        </Suspense>
    );
}
