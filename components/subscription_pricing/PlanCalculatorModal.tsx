"use client";

import { useState, useEffect } from "react";
import { X, Calculator } from "lucide-react";
import axios from "axios";

interface PlanFromDB {
    plan_id: number;
    plan_code: string;
    name: string;
    price: number;
    billing_cycle: string;
    is_active: number;
    platform_fee: number;
    fee_type: string;
    max_storage: string | null;
    max_assets_per_property: number | null;
    financial_history_years: number | null;
    unitPricesByType?: Record<string, number>;
}

interface PlanCalculatorModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function PlanCalculatorModal({ isOpen, onClose }: PlanCalculatorModalProps) {
    const [plans, setPlans] = useState<PlanFromDB[]>([]);
    const [loading, setLoading] = useState(true);
    const [numUnits, setNumUnits] = useState<number>(1);
    const [selectedPlanIndex, setSelectedPlanIndex] = useState<number>(0);
    const [selectedPropertyType, setSelectedPropertyType] = useState<string>("residential");

    useEffect(() => {
        if (isOpen) {
            const fetchPlans = async () => {
                try {
                    const res = await axios.get("/api/systemadmin/subscription_programs/getPlans");
                    const activePlans = (res.data || []).filter((p: PlanFromDB) => p.is_active === 1 && p.price > 0);
                    setPlans(activePlans);
                    if (activePlans.length > 0) {
                        setSelectedPlanIndex(0);
                    }
                } catch (err) {
                    console.error("Error fetching plans:", err);
                } finally {
                    setLoading(false);
                }
            };
            fetchPlans();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const calculateCost = (plan: PlanFromDB, units: number, propertyType: string) => {
        const baseCost = Number(plan.price);
        const unitPrices = plan.unitPricesByType || {};
        const perUnitPrice = unitPrices[propertyType] || 0;
        const unitCost = units * perUnitPrice;
        const subtotal = Math.max(baseCost, unitCost);
        const platformFeeAmount = subtotal * (Number(plan.platform_fee) / 100);
        const total = subtotal + platformFeeAmount;

        return {
            baseCost,
            perUnitPrice,
            unitCost,
            subtotal,
            platformFeeAmount,
            total,
        };
    };

    const propertyTypes = plans.length > 0 && plans[0].unitPricesByType
        ? Object.keys(plans[0].unitPricesByType)
        : ["residential", "commercial", "mixed"];

    const propertyTypeLabels: Record<string, string> = {
        residential: "Residential",
        commercial: "Commercial",
        mixed: "Mixed Use",
    };

    const selectedPlan = plans[selectedPlanIndex];
    const calculation = selectedPlan ? calculateCost(selectedPlan, numUnits, selectedPropertyType) : null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={handleOverlayClick}
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                            <Calculator className="w-5 h-5 text-blue-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Plan Calculator</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {loading ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500">Loading plans...</p>
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Number of Units
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    value={numUnits}
                                    onChange={(e) => setNumUnits(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Property Type
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {propertyTypes.map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => setSelectedPropertyType(type)}
                                            className={`py-3 px-2 rounded-xl text-sm font-semibold transition-all ${
                                                selectedPropertyType === type
                                                    ? "bg-blue-500 text-white shadow-md"
                                                    : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                                            }`}
                                        >
                                            {propertyTypeLabels[type] || type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Select Plan
                                </label>
                                <div className="space-y-2">
                                    {plans.map((plan, idx) => (
                                        <button
                                            key={plan.plan_id}
                                            onClick={() => setSelectedPlanIndex(idx)}
                                            className={`w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all text-left flex justify-between items-center ${
                                                selectedPlanIndex === idx
                                                    ? "bg-blue-500 text-white shadow-md"
                                                    : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                                            }`}
                                        >
                                            <span>{plan.name}</span>
                                            <span className="text-xs opacity-80">
                                                ₱{Number(plan.price).toLocaleString()}/mo
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {calculation && (
                                <>
                                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                                        <h3 className="text-sm font-semibold text-gray-700 mb-4">Cost Breakdown</h3>
                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Base Price</span>
                                                <span className="font-medium text-gray-900">
                                                    ₱{calculation.baseCost.toLocaleString()}
                                                </span>
                                            </div>
                                            {calculation.perUnitPrice > 0 && (
                                                <>
                                                    <div className="flex justify-between text-xs text-gray-500">
                                                        <span>Per unit price ({propertyTypeLabels[selectedPropertyType]})</span>
                                                        <span>₱{calculation.perUnitPrice.toLocaleString()}/unit</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">
                                                            Unit Cost ({numUnits} units × ₱{calculation.perUnitPrice.toLocaleString()})
                                                        </span>
                                                        <span className="font-medium text-gray-900">
                                                            ₱{calculation.unitCost.toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-blue-600 bg-blue-50 rounded-lg p-2">
                                                        {calculation.unitCost >= calculation.baseCost
                                                            ? "Unit cost exceeds base — unit pricing applies"
                                                            : "Unit cost below base — base floor price applies"}
                                                    </div>
                                                </>
                                            )}
                                            <div className="border-t border-gray-200 pt-3 flex justify-between font-semibold">
                                                <span className="text-gray-700">Subtotal</span>
                                                <span className="text-gray-900">
                                                    ₱{calculation.subtotal.toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-500">Platform Fee ({selectedPlan.platform_fee}%)</span>
                                                <span className="text-gray-600">
                                                    ₱{calculation.platformFeeAmount.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-5 text-white">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-blue-100">Estimated Monthly Total</span>
                                            <span className="text-2xl font-bold">
                                                ₱{calculation.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
