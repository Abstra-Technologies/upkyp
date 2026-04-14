"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function LeaseSigningPageContent() {
    const searchParams = useSearchParams();
    const envelopeId = searchParams.get("envelopeId");
    const [signUrl, setSignUrl] = useState<string | null>(null);
    console.log("envelope id:", envelopeId);

    useEffect(() => {
        if (!envelopeId) return;

        const fetchSigningUrl = async () => {
            try {
                const res = await fetch("/api/tenant/lease/signing", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ envelopeId }),
                });
                const data = await res.json();
                if (data.url) {
                    setSignUrl(data.url);
                }
            } catch (err) {
                console.error("Error fetching signing URL:", err);
            }
        };

        fetchSigningUrl();
    }, [envelopeId]);

    if (!envelopeId) {
        return <div className="p-6 text-center">❌ Missing envelope ID</div>;
    }

    if (!signUrl) {
        return <div className="p-6 text-center">Loading signing session…</div>;
    }

    // Option A: Embed DocuSign in iframe
    return (
        <div className="w-full h-screen">
            <iframe
                src={signUrl}
                className="w-full h-full border-0"
                title="Lease Signing"
            />
        </div>
    );

    // Option B (if you want full-page redirect instead of iframe)
    // window.location.href = signUrl;
    // return null;
}

export default function LeaseSigningPage() {
    return (
        <Suspense fallback={<div className="p-6 text-center">Loading...</div>}>
            <LeaseSigningPageContent />
        </Suspense>
    );
}