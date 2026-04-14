"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Rocket, Mail, User, Sparkles, ShieldCheck } from "lucide-react";
import useAuthStore from "@/zustand/authStore";
import axios from "axios";
import Swal from "sweetalert2";

export default function JoinBetaPage() {
    const router = useRouter();
    const { user, fetchSession } = useAuthStore();

    const MAX_SLOTS = 20;

    const [loading, setLoading] = useState(false);
    const [slotsTaken, setSlotsTaken] = useState<number>(0);
    const [loadingSlots, setLoadingSlots] = useState(true);

    /** Fetch session */
    useEffect(() => {
        if (!user) fetchSession();
    }, [user, fetchSession]);

    /** Redirect non-landlords */
    useEffect(() => {
        if (user && user.userType !== "landlord") {
            router.replace("/pages/error/accessDenied");
        }
    }, [user, router]);

    /** Fetch Beta Count */
    useEffect(() => {
        async function fetchCount() {
            try {
                const res = await axios.get("/api/landlord/beta/count");
                setSlotsTaken(res.data.count);
            } catch (err) {
                console.error("Failed to fetch beta count");
            } finally {
                setLoadingSlots(false);
            }
        }

        fetchCount();
    }, []);

    const remainingSlots = MAX_SLOTS - slotsTaken;
    const percentageFilled = (slotsTaken / MAX_SLOTS) * 100;
    const isFull = remainingSlots <= 0;

    const handleActivate = async () => {
        if (!user) return;

        if (isFull) {
            Swal.fire({
                icon: "error",
                title: "Beta Full",
                text: "All 50 beta slots have been claimed.",
            });
            return;
        }

        setLoading(true);

        try {
            await axios.post("/api/landlord/beta", {
                user_id: user.user_id,
            });

            await Swal.fire({
                icon: "success",
                title: "Beta Activated 🎉",
                text: "Your 60-day Beta access has started successfully!",
                confirmButtonColor: "#2563eb",
            });

            router.push("/pages/landlord/dashboard");

        } catch (err: any) {
            await Swal.fire({
                icon: "info",
                title: "Already Subscribed",
                text:
                    err.response?.data?.error ||
                    "You already have an active subscription.",
                confirmButtonColor: "#2563eb",
            });

            router.push("/pages/landlord/subscription");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 px-4 py-8">
            <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl border border-gray-100 p-8">

                {/* Header */}
                <div className="text-center mb-6">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
                        bg-gradient-to-r from-blue-600 to-emerald-600 text-white text-xs font-bold shadow">
                        🚀 BETA ACCESS PROGRAM 1.0
                    </span>

                    <h1 className="mt-4 text-3xl font-extrabold text-gray-900">
                        UpKyp Beta Program
                    </h1>

                    <p className="mt-3 text-sm text-gray-600">
                        Exclusive early access for landlords.
                    </p>
                </div>

                {/* 🔥 SLOT DISPLAY */}
                {!loadingSlots && (
                    <div className="mb-8 text-center">
                        <p className="text-sm font-semibold text-gray-700">
                            {isFull ? (
                                <span className="text-red-600">
                                    Beta is currently full.
                                </span>
                            ) : (
                                <>
                                    Only{" "}
                                    <span className="text-blue-600 font-bold">
                                        {remainingSlots}
                                    </span>{" "}
                                    of 20 spots remaining
                                </>
                            )}
                        </p>

                        <div className="mt-3 w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-blue-600 to-emerald-600 transition-all duration-500"
                                style={{ width: `${percentageFilled}%` }}
                            />
                        </div>

                        <p className="text-xs text-gray-500 mt-2">
                            {slotsTaken} / 20 beta slots claimed
                        </p>
                    </div>
                )}

                {/* Info Section */}
                <div className="space-y-6">
                    <Feature
                        icon={<Sparkles className="w-5 h-5 text-blue-600" />}
                        title="60 Days Free Premium Access"
                        description="Unlock premium  features at no cost for 60 days."
                    />


                    <Feature
                        icon={<Rocket className="w-5 h-5 text-purple-600" />}
                        title="Early Feature Access"
                        description="Be the first to experience new platform upgrades."
                    />
                </div>

                {/* User Info */}
                <div className="mt-8 bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-200">
                    <InfoField
                        label="Full Name"
                        value={`${user?.firstName ?? ""} ${user?.lastName ?? ""}`}
                        icon={<User className="w-4 h-4 text-gray-400" />}
                    />
                    <InfoField
                        label="Email Address"
                        value={user?.email ?? ""}
                        icon={<Mail className="w-4 h-4 text-gray-400" />}
                    />
                </div>

                {/* CTA */}
                <button
                    onClick={handleActivate}
                    disabled={loading || isFull}
                    className={`w-full mt-8 px-6 py-3 rounded-xl text-white font-semibold shadow-lg transition
                        ${isFull
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700"
                    }`}
                >
                    {isFull
                        ? "Beta Full"
                        : loading
                            ? "Activating..."
                            : "Activate Beta Program"}
                </button>

                <p className="mt-5 text-center text-xs text-gray-500">
                    Limited to 50 landlords. Beta expires automatically after 60 days.
                </p>
            </div>
        </div>
    );
}


/* ================= COMPONENTS ================= */

function Feature({ icon, title, description }: any) {
    return (
        <div className="flex items-start gap-4">
            <div className="bg-gray-100 p-2 rounded-lg">{icon}</div>
            <div>
                <h3 className="font-semibold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-600">{description}</p>
            </div>
        </div>
    );
}

function InfoField({ label, value, icon }: any) {
    return (
        <div>
            <label className="text-xs text-gray-500">{label}</label>
            <div className="flex items-center gap-2 mt-1 text-sm font-medium text-gray-800">
                {icon}
                {value}
            </div>
        </div>
    );
}
