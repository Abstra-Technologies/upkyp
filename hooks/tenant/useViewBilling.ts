"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import * as htmlToImage from "html-to-image";

export function useViewBilling() {
    const searchParams = useSearchParams();
    const billing_id = searchParams.get("billing_id");

    const [billing, setBilling] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const billingRef = useRef<HTMLDivElement>(null);

    const fetchBilling = useCallback(async () => {
        if (!billing_id) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const res = await axios.get(`/api/tenant/billing/previousBilling/${billing_id}`);
            setBilling(res.data.billing);
        } catch (err) {
            console.error(err);
            setError("Failed to fetch billing.");
        } finally {
            setLoading(false);
        }
    }, [billing_id]);

    useEffect(() => {
        fetchBilling();
    }, [fetchBilling]);

    const downloadImage = useCallback(async () => {
        if (!billingRef.current) return;

        try {
            const dataUrl = await htmlToImage.toPng(billingRef.current, { cacheBust: true });
            const link = document.createElement("a");
            link.href = dataUrl;
            link.download = `billing_${billing_id}.png`;
            link.click();
        } catch (err) {
            console.error("Error generating image:", err);
        }
    }, [billing_id]);

    return {
        billing,
        error,
        loading,
        billingRef,
        downloadImage,
        billing_id,
    };
}