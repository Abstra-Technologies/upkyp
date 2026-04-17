"use client";

import { useState, useEffect } from "react";
import useAuthStore from "@/zustand/authStore";
import { getSessionUser } from "@/lib/auth/auth";

export default function useSubscriptionData() {
    const { user, isAuthenticated } = useAuthStore();

    const [trialUsed, setTrialUsed] = useState<boolean | null>(null);
    const [currentSubscription, setCurrentSubscription] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            if (!user || !isAuthenticated) {
                setLoading(false);
                return;
            }

            const session = await getSessionUser();
            if (!session || String(session.landlord_id) !== String(user.landlord_id)) {
                setError("Unauthorized: Invalid session");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);
            try {
                const trialRes = await fetch("/api/landlord/subscription/freeTrialTest", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ landlord_id: user.landlord_id, plan_name: "" }),
                });
                const trialJson = await trialRes.json();
                setTrialUsed(trialJson?.is_trial_used);

                const subRes = await fetch(`/api/landlord/subscription/active/${user.landlord_id}`);
                if (subRes.ok) {
                    const subJson = await subRes.json();
                    setCurrentSubscription(subJson);
                }
            } catch (err) {
                console.error("Error fetching subscription:", err);
                setError("Failed to fetch subscription data");
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [user, isAuthenticated]);

    return { trialUsed, currentSubscription, loading, error };
}
