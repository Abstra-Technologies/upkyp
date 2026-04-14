"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function HousePolicyPage() {
    const router = useRouter();
    const { agreement_id } = useParams<{ agreement_id: string }>();

    const [policy, setPolicy] = useState<string>("");
    const [loading, setLoading] = useState(true);

    /* ================= LOAD ================= */
    useEffect(() => {
        if (!agreement_id) return;

        axios
            .get("/api/properties/house-policy", {
                params: { agreement_id },
            })
            .then((res) => {
                setPolicy(res.data.house_policy || "");
            })
            .catch(() => {
                Swal.fire("Error", "Failed to load house policy", "error");
            })
            .finally(() => setLoading(false));
    }, [agreement_id]);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* HEADER */}
            <div className="bg-white border-b">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-lg hover:bg-gray-100"
                    >
                        <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-900">
                        House Rules & Policy
                    </h1>
                </div>
            </div>

            {/* CONTENT */}
            <div className="max-w-5xl mx-auto px-4 py-8">
                {loading ? (
                    <p className="text-sm text-gray-500">Loading policy…</p>
                ) : policy ? (
                    <div className="bg-white rounded-xl border p-6">
                        <article
                            className="prose prose-gray max-w-none
                                       prose-h1:text-2xl
                                       prose-h2:text-xl
                                       prose-h3:text-lg
                                       prose-p:leading-relaxed
                                       prose-li:marker:text-gray-400"
                            dangerouslySetInnerHTML={{ __html: policy }}
                        />
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border p-6 text-center text-sm text-gray-500">
                        No house rules or policies have been published for this
                        property.
                    </div>
                )}
            </div>
        </div>
    );
}
