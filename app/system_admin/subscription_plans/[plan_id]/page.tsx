"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import Swal from "sweetalert2";
import { BackButton } from "@/components/navigation/backButton";

interface UnitBand {
    id?: number;
    unit_range: string;
    min_units: number;
    max_units: number;
    monthly_price: string;
    annual_price: string;
}

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

    const [unitBands, setUnitBands] = useState<UnitBand[]>([]);
    const [newBand, setNewBand] = useState<UnitBand>({
        unit_range: "",
        min_units: 0,
        max_units: 0,
        monthly_price: "",
        annual_price: "",
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

            const bands = (data.prices || []).map((band: Partial<UnitBand>) => ({
                ...band,
                monthly_price: band.monthly_price || "",
                annual_price: band.annual_price || "",
            }));
            setUnitBands(bands);
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
                    prices: unitBands,
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

    const addUnitBand = () => {
        if (!newBand.unit_range || !newBand.monthly_price) {
            Swal.fire("Error", "Please fill in unit range and price", "warning");
            return;
        }
        setUnitBands([...unitBands, { ...newBand }]);
        setNewBand({
            unit_range: "",
            min_units: 0,
            max_units: 0,
            monthly_price: "",
            annual_price: "",
        });
    };

    const removeUnitBand = (index: number) => {
        setUnitBands(unitBands.filter((_, i) => i !== index));
    };

    const updateUnitBand = (index: number, field: keyof UnitBand, value: string | number) => {
        const updated = [...unitBands];
        updated[index] = { ...updated[index], [field]: value };
        setUnitBands(updated);
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Base Price</label>
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

                {/* ================= UNIT-BASED PRICING ================= */}
                <div className="mb-10">
                    <h2 className="text-lg font-semibold mb-4">
                        Unit-Based Pricing
                    </h2>
                    <p className="text-sm text-gray-500 mb-4">
                        Set different prices based on the number of units.
                    </p>

                    <div className="space-y-4 mb-4">
                        <div className="grid grid-cols-[1fr_70px_70px_100px_100px_40px] gap-2 bg-gray-100 p-3 rounded-xl text-sm font-medium text-gray-600">
                            <div>Range</div>
                            <div>Min</div>
                            <div>Max</div>
                            <div>Monthly</div>
                            <div>Annual</div>
                            <div></div>
                        </div>
                        {unitBands.map((band, index) => (
                            <div key={index} className="grid grid-cols-[1fr_70px_70px_100px_100px_40px] gap-2 items-center bg-gray-50 p-3 rounded-xl">
                                <input
                                    type="text"
                                    value={band.unit_range}
                                    onChange={(e) => updateUnitBand(index, "unit_range", e.target.value)}
                                    className="border p-2 rounded"
                                    placeholder="e.g., 1-20"
                                />
                                <input
                                    type="number"
                                    value={band.min_units}
                                    onChange={(e) => updateUnitBand(index, "min_units", Number(e.target.value))}
                                    className="border p-2 rounded"
                                    placeholder="Min"
                                />
                                <input
                                    type="number"
                                    value={band.max_units}
                                    onChange={(e) => updateUnitBand(index, "max_units", Number(e.target.value))}
                                    className="border p-2 rounded"
                                    placeholder="Max"
                                />
                                <input
                                    type="number"
                                    value={band.monthly_price}
                                    onChange={(e) => updateUnitBand(index, "monthly_price", e.target.value)}
                                    className="border p-2 rounded"
                                    placeholder="Monthly"
                                />
                                <input
                                    type="number"
                                    value={band.annual_price}
                                    onChange={(e) => updateUnitBand(index, "annual_price", e.target.value)}
                                    className="border p-2 rounded"
                                    placeholder="Annual"
                                />
                                <button
                                    onClick={() => removeUnitBand(index)}
                                    className="text-red-500 hover:text-red-700 p-2"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-[1fr_70px_70px_100px_100px_auto] gap-2 items-end bg-blue-50 p-3 rounded-xl">
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Range</label>
                            <input
                                type="text"
                                value={newBand.unit_range}
                                onChange={(e) => setNewBand({ ...newBand, unit_range: e.target.value })}
                                className="border p-2 rounded w-full"
                                placeholder="e.g., 21-50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Min</label>
                            <input
                                type="number"
                                value={newBand.min_units}
                                onChange={(e) => setNewBand({ ...newBand, min_units: Number(e.target.value) })}
                                className="border p-2 rounded w-full"
                                placeholder="Min"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Max</label>
                            <input
                                type="number"
                                value={newBand.max_units}
                                onChange={(e) => setNewBand({ ...newBand, max_units: Number(e.target.value) })}
                                className="border p-2 rounded w-full"
                                placeholder="Max"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Monthly</label>
                            <input
                                type="number"
                                value={newBand.monthly_price}
                                onChange={(e) => setNewBand({ ...newBand, monthly_price: e.target.value })}
                                className="border p-2 rounded w-full"
                                placeholder="Monthly"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Annual</label>
                            <input
                                type="number"
                                value={newBand.annual_price}
                                onChange={(e) => setNewBand({ ...newBand, annual_price: e.target.value })}
                                className="border p-2 rounded w-full"
                                placeholder="Annual"
                            />
                        </div>
                        <button
                            onClick={addUnitBand}
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 h-10"
                        >
                            Add
                        </button>
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