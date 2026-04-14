"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ReviewForm from "@/components/tenant/currentRent/feedbackForm";
import useAuthStore from "@/zustand/authStore";
import LoadingScreen from "@/components/loadingScreen";

function ReviewPageContent() {
    const { user, admin, fetchSession } = useAuthStore();
    const [reviewSubmitted, setReviewSubmitted] = useState(false);
    const [loading, setLoading] = useState(true);
    const searchParams = useSearchParams();
    const agreementId = searchParams.get("agreement_id");

    useEffect(() => {
        const load = async () => {
            if (!user && !admin) await fetchSession();
            setLoading(false);
        };
        load();
    }, [user, admin, fetchSession]);

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80">
                <LoadingScreen message="Loading feedback form..." />
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-6">
            <div className="bg-white shadow-lg rounded-lg p-6 max-w-lg w-full text-center">
                {reviewSubmitted ? (
                    <p className="text-green-600 font-semibold">
                        Thank you for your review!
                    </p>
                ) : (
                    <ReviewForm
                        tenant_id={user?.tenant_id}
                        agreement_id={agreementId}
                        onReviewSubmitted={() => setReviewSubmitted(true)}
                    />
                )}
            </div>
        </div>
    );
}

export default function SubmitReviewPage() {
    return (
        <Suspense fallback={<LoadingScreen message="Loading feedback form..." />}>
            <ReviewPageContent />
        </Suspense>
    );
}
