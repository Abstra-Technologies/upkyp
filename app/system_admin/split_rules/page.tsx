"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { CheckCircle, XCircle, RefreshCcw } from "lucide-react";

type Plan = {
    plan_id: number;
    plan_code: string;
    name: string;
    platform_fee: number;
    split_rule_id?: string | null;
};

export default function SplitRulesAdminPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

    const [splitName, setSplitName] = useState("");
    const [splitType, setSplitType] = useState<"flat" | "percent">("percent");
    const [amount, setAmount] = useState("");

    useEffect(() => {
        fetchPlans();
    }, []);

    async function fetchPlans() {
        setLoading(true);
        const res = await axios.get(
            "/api/systemadmin/subscription_programs/getPlans"
        );
        setPlans(res.data);
        setLoading(false);
    }

    async function submitSplitRule() {
        if (!selectedPlan) return;

        await axios.post(
            "/api/systemadmin/subscription_programs/create-split-rule",
            {
                plan_id: selectedPlan.plan_id,
                split_name: splitName,
                split_type: splitType,
                amount,
            }
        );

        setSelectedPlan(null);
        setSplitName("");
        setAmount("");
        fetchPlans();
    }

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-6">
                Split Payment Rules
            </h1>

            <div className="bg-white rounded-xl shadow overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-100">
                    <tr>
                        <th className="p-4">Plan</th>
                        <th className="p-4">Platform Fee %</th>
                        <th className="p-4">Split Rule ID</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Actions</th>
                    </tr>
                    </thead>

                    <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan={5} className="p-6 text-center">
                                Loading...
                            </td>
                        </tr>
                    ) : (
                        plans.map((plan) => (
                            <tr key={plan.plan_id} className="border-t">
                                <td className="p-4 font-medium">
                                    {plan.name}
                                </td>

                                <td className="p-4">
                                    {plan.platform_fee}%
                                </td>

                                <td className="p-4 text-sm text-gray-500">
                                    {plan.split_rule_id || "Not Created"}
                                </td>

                                <td className="p-4">
                                    {plan.split_rule_id ? (
                                        <span className="text-green-600 flex gap-2 items-center">
                                                <CheckCircle size={16} />
                                                Active
                                            </span>
                                    ) : (
                                        <span className="text-red-500 flex gap-2 items-center">
                                                <XCircle size={16} />
                                                Missing
                                            </span>
                                    )}
                                </td>

                                <td className="p-4">
                                    {!plan.split_rule_id && (
                                        <button
                                            onClick={() =>
                                                setSelectedPlan(plan)
                                            }
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg"
                                        >
                                            <RefreshCcw size={16} />
                                            Create
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>

            {/* 🔥 MODAL */}
            {selectedPlan && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-xl w-96 space-y-4">
                        <h2 className="text-lg font-semibold">
                            Create Split Rule
                        </h2>

                        <input
                            placeholder="Split Name"
                            value={splitName}
                            onChange={(e) => setSplitName(e.target.value)}
                            className="w-full border p-2 rounded"
                        />

                        <div className="flex gap-4">
                            <label>
                                <input
                                    type="radio"
                                    checked={splitType === "percent"}
                                    onChange={() =>
                                        setSplitType("percent")
                                    }
                                />
                                Percentage
                            </label>

                            <label>
                                <input
                                    type="radio"
                                    checked={splitType === "flat"}
                                    onChange={() => setSplitType("flat")}
                                />
                                Flat
                            </label>
                        </div>

                        <input
                            placeholder={
                                splitType === "percent"
                                    ? "Percent (e.g. 5)"
                                    : "Flat Amount"
                            }
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full border p-2 rounded"
                        />

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setSelectedPlan(null)}
                                className="px-4 py-2 bg-gray-200 rounded"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={submitSplitRule}
                                className="px-4 py-2 bg-blue-600 text-white rounded"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}