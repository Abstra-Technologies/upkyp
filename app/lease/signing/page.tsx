"use client";

import useAuthStore from "@/zustand/authStore";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";

function LeaseSigningPageContent() {
    const searchParams = useSearchParams();
    const agreementId = searchParams.get("agreementId");
    const [signUrl, setSignUrl] = useState<string | null>(null);
    const { user } = useAuthStore();

    useEffect(() => {
        if (!agreementId || !user?.email) return;

        (async () => {
            const res = await fetch("/api/leaseAgreement/signingUrl", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    agreementId,
                    role: "landlord",
                    landlordEmail: user.email,
                }),
            });

            const data = await res.json();
            if (res.ok && data.url) {
                setSignUrl(data.url);
            } else {
                console.error("Failed to get signing URL", data);
            }
        })();
    }, [agreementId, user?.email]);

    return (
        <div className="max-w-5xl mx-auto mt-10 bg-white shadow-lg rounded-xl p-6">
            <h1 className="text-2xl font-bold mb-6">Lease Signing</h1>
            {!signUrl ? (
                <p className="text-gray-600 text-sm">Preparing signing session...</p>
            ) : (
                <iframe
                    src={signUrl}
                    title="DocuSign Signing"
                    className="w-full h-[700px] border rounded-lg"
                />
            )}
        </div>
    );
}

export default function LeaseSigningPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LeaseSigningPageContent />
        </Suspense>
    );
}