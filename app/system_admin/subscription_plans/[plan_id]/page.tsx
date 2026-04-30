"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import Swal from "sweetalert2";
import { BackButton } from "@/components/navigation/backButton";

interface Feature {
    reports: number;
    pdc_management: number;
    ai_unit_generator: number;
    bulk_import: number;
    announcements: number;
    asset_management: number;
    financial_insights: number;
}

interface PlanLimits {
    max_storage: string;
    max_assets_per_property: number | null;
    financial_history_years: number | null;
}

interface UnitPriceByType {
    residential: string;
    commercial: string;
    mixed: string;
}

const PROPERTY_TYPES = [
    { value: "residential", label: "Residential" },
    { value: "commercial", label: "Commercial" },
    { value: "mixed", label: "Mixed Use" },
];

export default function EditPlanPage() {
    const params = useParams();
    const planId = params?.plan_id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [plan, setPlan] = useState({
        plan_code: "",
        name: "",
        price: "",
        billing_cycle: "monthly",
        platform_fee: "",
        fee_type: "percentage",
        is_active: 1,
    });

    const [limits, setLimits] = useState<PlanLimits>({
        max_storage: "",
        max_assets_per_property: null,
        financial_history_years: null,
    });

    const [features, setFeatures] = useState<Feature>({
        reports: 0,
        pdc_management: 0,
        ai_unit_generator: 0,
        bulk_import: 0,
        announcements: 0,
        asset_management: 0,
        financial_insights: 0,
    });

    const [unitPricesByType, setUnitPricesByType] = useState<UnitPriceByType>({
        residential: "",
        commercial: "",
        mixed: "",
    });

    const fetchPlan = async () => {
        try {
            const res = await axios.get(
                `/api/systemadmin/subscription_programs/gerPlanDetails/${planId}`
            );

            const data = res.data;

            setPlan({
                plan_code: data.plan?.plan_code || "",
                name: data.plan?.name || "",
                price: String(data.plan?.price || ""),
                billing_cycle: data.plan?.billing_cycle || "monthly",
                platform_fee: String(data.plan?.platform_fee || ""),
                fee_type: data.plan?.fee_type || "percentage",
                is_active: data.plan?.is_active ?? 1,
            });

            setLimits({
                max_storage: data.limits?.max_storage || "",
                max_assets_per_property: data.limits?.max_assets_per_property ?? null,
                financial_history_years: data.limits?.financial_history_years ?? null,
            });

            setFeatures({
                reports: data.features?.reports || 0,
                pdc_management: data.features?.pdc_management || 0,
                ai_unit_generator: data.features?.ai_unit_generator || 0,
                bulk_import: data.features?.bulk_import || 0,
                announcements: data.features?.announcements || 0,
                asset_management: data.features?.asset_management || 0,
                financial_insights: data.features?.financial_insights || 0,
            });

            const pricesByType: UnitPriceByType = { residential: "", commercial: "", mixed: "" };
            (data.unitPricesByType || []).forEach((item: any) => {
                pricesByType[item.property_type] = String(item.unit_price || "");
            });
            setUnitPricesByType(pricesByType);
        } catch (err) {
            console.error("Error fetching plan:", err);
            Swal.fire("Error", "Failed to load plan", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (planId) fetchPlan();
    }, [planId]);

    const handleUpdate = async () => {
        setSaving(true);
        try {
            await axios.put(
                `/api/systemadmin/subscription_programs/gerPlanDetails/${planId}`,
                {
                    plan,
                    limits,
                    features,
                    unitPricesByType,
                }
            );

            Swal.fire("Success", "Plan updated successfully", "success");
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            Swal.fire(
                "Error",
                error.response?.data?.message || "Failed to update plan",
                "error"
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        const result = await Swal.fire({
            title: "Delete Plan",
            text: `Are you sure you want to delete "${plan.name}"? This action cannot be undone.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            confirmButtonText: "Delete",
            cancelButtonText: "Cancel",
        });

        if (result.isConfirmed) {
            setSaving(true);
            try {
                await axios.delete(
                    `/api/systemadmin/subscription_programs/gerPlanDetails/${planId}`
                );

                Swal.fire("Deleted", "Plan deleted successfully", "success");

                window.location.href = "/system_admin/subscription_plans";
            } catch (err: unknown) {
                const error = err as { response?: { data?: { message?: string } } };
                Swal.fire(
                    "Error",
                    error.response?.data?.message || "Failed to delete plan",
                    "error"
                );
            } finally {
                setSaving(false);
            }
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
            <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-xl border border-gray-100">

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
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Plan Code</label>
                            <input
                                type="text"
                                value={plan.plan_code}
                                onChange={(e) =>
                                    setPlan({ ...plan, plan_code: e.target.value.toUpperCase() })
                                }
                                className="border p-3 rounded-xl w-full"
                                placeholder="Plan Code"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
                            <input
                                type="text"
                                value={plan.name}
                                onChange={(e) => setPlan({ ...plan, name: e.target.value })}
                                className="border p-3 rounded-xl w-full"
                                placeholder="Plan Name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Base Price (Monthly)</label>
                            <input
                                type="number"
                                value={plan.price}
                                onChange={(e) => setPlan({ ...plan, price: e.target.value })}
                                className="border p-3 rounded-xl w-full"
                                placeholder="Base Price"
                            />
                        </div>


                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Billing Cycle</label>
                            <select
                                value={plan.billing_cycle}
                                onChange={(e) => setPlan({ ...plan, billing_cycle: e.target.value })}
                                className="border p-3 rounded-xl w-full"
                            >
                                <option value="monthly">Monthly</option>
                                <option value="yearly">Yearly</option>
                                <option value="lifetime">Lifetime</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Platform Fee</label>
                            <input
                                type="number"
                                step="0.01"
                                value={plan.platform_fee}
                                onChange={(e) => setPlan({ ...plan, platform_fee: e.target.value })}
                                className="border p-3 rounded-xl w-full"
                                placeholder="Platform Fee %"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fee Type</label>
                            <select
                                value={plan.fee_type}
                                onChange={(e) => setPlan({ ...plan, fee_type: e.target.value })}
                                className="border p-3 rounded-xl w-full"
                            >
                                <option value="percentage">Percentage</option>
                                <option value="flat">Flat</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-3 col-span-2">
                            <input
                                type="checkbox"
                                checked={plan.is_active === 1}
                                onChange={(e) => setPlan({ ...plan, is_active: e.target.checked ? 1 : 0 })}
                            />
                            <label>Active</label>
                        </div>
                    </div>
                </div>

                {/* ================= UNIT PRICING BY PROPERTY TYPE ================= */}
                <div className="mb-10">
                    <h2 className="text-lg font-semibold mb-4">Unit Pricing by Property Type</h2>
                    <p className="text-sm text-gray-500 mb-4">
                        Set per-unit prices for each property type. These apply in addition to the base price.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        {PROPERTY_TYPES.map((type) => (
                            <div key={type.value} className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    {type.label} - Per Unit Monthly
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
                                    <input
                                        type="number"
                                        value={unitPricesByType[type.value as keyof UnitPriceByType]}
                                        onChange={(e) => setUnitPricesByType({
                                            ...unitPricesByType,
                                            [type.value]: e.target.value
                                        })}
                                        className="w-full pl-8 pr-4 py-2.5 border border-blue-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ================= LIMITS ================= */}
                <div className="mb-10">
                    <h2 className="text-lg font-semibold mb-4">Plan Limits</h2>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Max Storage</label>
                            <input
                                type="text"
                                value={limits.max_storage}
                                onChange={(e) => setLimits({ ...limits, max_storage: e.target.value })}
                                className="border p-3 rounded-xl w-full"
                                placeholder="e.g., 5GB"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Max Assets/Property</label>
                            <input
                                type="number"
                                value={limits.max_assets_per_property ?? ""}
                                onChange={(e) => setLimits({
                                    ...limits,
                                    max_assets_per_property: e.target.value ? Number(e.target.value) : null
                                })}
                                className="border p-3 rounded-xl w-full"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Financial History (Years)</label>
                            <input
                                type="number"
                                value={limits.financial_history_years ?? ""}
                                onChange={(e) => setLimits({
                                    ...limits,
                                    financial_history_years: e.target.value ? Number(e.target.value) : null
                                })}
                                className="border p-3 rounded-xl w-full"
                            />
                        </div>
                    </div>
                </div>

                {/* ================= FEATURES ================= */}
                <div className="mb-12">
                    <h2 className="text-lg font-semibold mb-4">Plan Features</h2>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(features).map(([feature, value]) => {
                            const isEnabled = value === 1;
                            const label = feature.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

                            return (
                                <div
                                    key={feature}
                                    onClick={() => setFeatures({ ...features, [feature]: isEnabled ? 0 : 1 })}
                                    className={`cursor-pointer rounded-xl p-4 border transition-all ${
                                        isEnabled ? "bg-emerald-50 border-emerald-300" : "bg-white border-gray-200"
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">{label}</span>
                                        <div className={`w-10 h-5 rounded-full p-0.5 ${isEnabled ? "bg-emerald-500" : "bg-gray-300"}`}>
                                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isEnabled ? "translate-x-5" : ""}`} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={handleUpdate}
                        disabled={saving}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-emerald-600 text-white py-3 rounded-xl font-semibold shadow-md hover:opacity-90 transition disabled:opacity-50"
                    >
                        {saving ? "Saving..." : "Update Plan"}
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={saving}
                        className="px-6 bg-red-600 text-white py-3 rounded-xl font-semibold shadow-md hover:bg-red-700 transition disabled:opacity-50"
                    >
                        Delete Plan
                    </button>
                </div>
            </div>
        </div>
    );
}