"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import Swal from "sweetalert2";
import { BackButton } from "@/components/navigation/backButton";

export default function EditPlanPage() {
    const params = useParams();
    const id = params?.plan_id as string | undefined;

    const [loading, setLoading] = useState(true);

    const [plan, setPlan] = useState({
        plan_code: "",
        name: "",
        price: "",
        billing_cycle: "monthly",
        platform_fee: "",
        fee_type: "percentage",
        is_active: 1,
    });

    const [maxUnits, setMaxUnits] = useState<number | null>(null);
    const [features, setFeatures] = useState<any>({});

    const fetchPlan = async () => {
        try {
            const res = await axios.get(
                `/api/systemadmin/subscription_programs/gerPlanDetails/${id}`
            );

            const data = res.data;

            setPlan({
                plan_code: data.plan.plan_code,
                name: data.plan.name,
                price: String(data.plan.price),
                billing_cycle: data.plan.billing_cycle,
                platform_fee: String(data.plan.platform_fee),
                fee_type: data.plan.fee_type,
                is_active: data.plan.is_active,
            });

            setMaxUnits(data.limits?.max_units ?? null);
            setFeatures(data.features || {});
        } catch {
            Swal.fire("Error", "Failed to load plan", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchPlan();
    }, [id]);

    const handleUpdate = async () => {
        try {
            await axios.put(
                `/api/systemadmin/subscription_programs/gerPlanDetails/${id}`,
                {
                    plan,
                    max_units: maxUnits,
                    features,
                }
            );

            Swal.fire("Success", "Plan updated successfully", "success");
        } catch (err: any) {
            Swal.fire(
                "Error",
                err.response?.data?.message || "Failed",
                "error"
            );
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                Loading...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
            <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-xl border border-gray-100">

                <BackButton label="Back to Plans" />

                <h1 className="text-2xl font-bold mt-6 mb-8">
                    Edit {plan?.name} Plan
                </h1>

                {/* ================= BASIC INFO ================= */}
                <div className="mb-10">
                    <h2 className="text-lg font-semibold mb-4">
                        Basic Information
                    </h2>

                    <div className="grid md:grid-cols-2 gap-4">
                        <input
                            type="text"
                            value={plan.plan_code}
                            onChange={(e) =>
                                setPlan({
                                    ...plan,
                                    plan_code: e.target.value.toUpperCase(),
                                })
                            }
                            className="border p-3 rounded-xl"
                            placeholder="Plan Code"
                        />

                        <input
                            type="text"
                            value={plan.name}
                            onChange={(e) =>
                                setPlan({
                                    ...plan,
                                    name: e.target.value,
                                })
                            }
                            className="border p-3 rounded-xl"
                            placeholder="Plan Name"
                        />

                        <input
                            type="number"
                            value={plan.price}
                            onChange={(e) =>
                                setPlan({
                                    ...plan,
                                    price: e.target.value,
                                })
                            }
                            className="border p-3 rounded-xl"
                            placeholder="Subscription Price"
                        />

                        <select
                            value={plan.billing_cycle}
                            onChange={(e) =>
                                setPlan({
                                    ...plan,
                                    billing_cycle: e.target.value,
                                })
                            }
                            className="border p-3 rounded-xl"
                        >
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
                            <option value="lifetime">Lifetime</option>
                        </select>

                        <input
                            type="number"
                            value={plan.platform_fee}
                            onChange={(e) =>
                                setPlan({
                                    ...plan,
                                    platform_fee: e.target.value,
                                })
                            }
                            className="border p-3 rounded-xl"
                            placeholder="Platform Fee"
                        />

                        <select
                            value={plan.fee_type}
                            onChange={(e) =>
                                setPlan({
                                    ...plan,
                                    fee_type: e.target.value,
                                })
                            }
                            className="border p-3 rounded-xl"
                        >
                            <option value="percentage">Percentage</option>
                            <option value="flat">Flat</option>
                        </select>

                        <div className="flex items-center gap-3 col-span-2">
                            <input
                                type="checkbox"
                                checked={plan.is_active === 1}
                                onChange={(e) =>
                                    setPlan({
                                        ...plan,
                                        is_active: e.target.checked ? 1 : 0,
                                    })
                                }
                            />
                            <label>Active</label>
                        </div>
                    </div>
                </div>

                {/* ================= DOOR LIMIT ================= */}
                <div className="mb-10">
                    <h2 className="text-lg font-semibold mb-4">
                        Door Allocation (Max Units)
                    </h2>

                    <input
                        type="number"
                        value={maxUnits ?? ""}
                        onChange={(e) =>
                            setMaxUnits(
                                e.target.value === ""
                                    ? null
                                    : Number(e.target.value)
                            )
                        }
                        className="border p-3 rounded-xl w-full"
                        placeholder="Maximum number of doors"
                    />

                    <p className="text-sm text-gray-500 mt-2">
                        Leave empty for unlimited doors.
                    </p>
                </div>

                {/* ================= FEATURES ================= */}
                {/* ================= FEATURES ================= */}
                <div className="mb-12">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-gray-800">
                            Plan Features
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Toggle features included in this subscription.
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {Object.entries(features)
                            .filter(([key]) => key !== "id" && key !== "plan_id")
                            .map(([feature, value]) => {
                                const isEnabled = value === 1;

                                const formattedLabel = feature
                                    .replace(/_/g, " ")
                                    .replace(/\b\w/g, (c) => c.toUpperCase());

                                return (
                                    <div
                                        key={feature}
                                        onClick={() =>
                                            setFeatures({
                                                ...features,
                                                [feature]: isEnabled ? 0 : 1,
                                            })
                                        }
                                        className={`cursor-pointer rounded-2xl p-5 border shadow-sm transition-all duration-200 hover:shadow-md
                            ${
                                            isEnabled
                                                ? "bg-gradient-to-br from-blue-50 to-emerald-50 border-emerald-300"
                                                : "bg-white border-gray-200 hover:border-gray-300"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-semibold text-gray-800">
                                                    {formattedLabel}
                                                </h3>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {isEnabled
                                                        ? "Enabled for this plan"
                                                        : "Not included"}
                                                </p>
                                            </div>

                                            {/* Toggle */}
                                            <div
                                                className={`w-12 h-6 flex items-center rounded-full p-1 transition-all duration-300
                                    ${
                                                    isEnabled
                                                        ? "bg-emerald-500"
                                                        : "bg-gray-300"
                                                }`}
                                            >
                                                <div
                                                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-all duration-300
                                        ${
                                                        isEnabled
                                                            ? "translate-x-6"
                                                            : "translate-x-0"
                                                    }`}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>
                <button
                    onClick={handleUpdate}
                    className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 text-white py-3 rounded-xl font-semibold shadow-md hover:opacity-90 transition"
                >
                    Update Plan
                </button>
            </div>
        </div>
    );
}