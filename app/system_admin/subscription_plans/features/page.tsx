"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Plus, Trash2, X, Check, ToggleLeft, ToggleRight, Tag } from "lucide-react";

type FeatureColumn = {
    key: string;
    label: string;
    color: string;
    enabled: boolean;
};

const DEFAULT_FEATURES: FeatureColumn[] = [
    { key: "reports", label: "Reports", color: "from-blue-500 to-cyan-500", enabled: true },
    { key: "pdc_management", label: "PDC Management", color: "from-emerald-500 to-teal-500", enabled: true },
    { key: "ai_unit_generator", label: "AI Unit Generator", color: "from-purple-500 to-indigo-500", enabled: true },
    { key: "bulk_import", label: "Bulk Import", color: "from-amber-500 to-orange-500", enabled: true },
    { key: "announcements", label: "Announcements", color: "from-pink-500 to-rose-500", enabled: true },
    { key: "asset_management", label: "Asset Management", color: "from-violet-500 to-purple-500", enabled: true },
    { key: "financial_insights", label: "Financial Insights", color: "from-green-500 to-emerald-500", enabled: true },
];

export default function PlanFeaturesPage() {
    const [features, setFeatures] = useState<FeatureColumn[]>(DEFAULT_FEATURES);
    const [showAddModal, setShowAddModal] = useState(false);
    const [saving, setSaving] = useState(false);

    const [newFeature, setNewFeature] = useState({
        key: "",
        label: "",
        color: "from-blue-500 to-cyan-500",
    });

    const COLORS = [
        "from-blue-500 to-cyan-500",
        "from-emerald-500 to-teal-500",
        "from-purple-500 to-indigo-500",
        "from-amber-500 to-orange-500",
        "from-pink-500 to-rose-500",
        "from-violet-500 to-purple-500",
        "from-green-500 to-emerald-500",
        "from-red-500 to-orange-500",
        "from-yellow-500 to-amber-500",
        "from-slate-500 to-gray-500",
    ];

    const handleAddFeature = async () => {
        if (!newFeature.key || !newFeature.label) {
            Swal.fire("Error", "Field name and label are required", "error");
            return;
        }

        const keyRegex = /^[a-z_]+$/;
        if (!keyRegex.test(newFeature.key.toLowerCase())) {
            Swal.fire("Error", "Field name must be lowercase letters and underscores only", "error");
            return;
        }

        if (features.some((f) => f.key === newFeature.key.toLowerCase())) {
            Swal.fire("Error", "This field already exists", "error");
            return;
        }

        setSaving(true);
        try {
            await axios.post("/api/systemadmin/plan-features/columns", {
                key: newFeature.key.toLowerCase(),
                label: newFeature.label,
                color: newFeature.color,
            });

            const newCol: FeatureColumn = {
                key: newFeature.key.toLowerCase(),
                label: newFeature.label,
                color: newFeature.color,
                enabled: true,
            };

            setFeatures((prev) => [...prev, newCol]);
            setShowAddModal(false);
            setNewFeature({ key: "", label: "", color: "from-blue-500 to-cyan-500" });

            Swal.fire("Success", "Feature field added", "success");
        } catch (err: any) {
            Swal.fire("Error", err.response?.data?.error || "Failed to add feature", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteFeature = async (key: string) => {
        const confirm = await Swal.fire({
            title: `Delete "${key}"?`,
            text: "This will remove the feature column from all plans.",
            icon: "warning",
            showCancelButton: true,
        });

        if (!confirm.isConfirmed) return;

        try {
            await axios.delete(`/api/systemadmin/plan-features/columns/${key}`);
            setFeatures((prev) => prev.filter((f) => f.key !== key));
            Swal.fire("Deleted", "Feature removed", "success");
        } catch (err: any) {
            Swal.fire("Error", err.response?.data?.error || "Failed to delete", "error");
        }
    };

    const enabledFeatures = features.filter((f) => f.enabled);

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
            <div className="max-w-4xl mx-auto">

                {/* HEADER */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                            Plan Feature Fields
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Manage dynamic feature columns in the PlanFeatures table
                        </p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                        <Plus size={16} />
                        Add Field
                    </button>
                </div>

                {/* FEATURES GRID */}
                <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b">
                        <Tag size={16} className="text-gray-500" />
                        <h2 className="font-semibold text-gray-700">
                            Active Fields ({enabledFeatures.length})
                        </h2>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {features.filter((f) => f.enabled).map((feature) => (
                            <div
                                key={feature.key}
                                className={`relative p-4 rounded-xl bg-gradient-to-br ${feature.color} bg-opacity-10 border border-transparent hover:border-current transition-all group`}
                                style={{
                                    borderColor: `transparent`,
                                }}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-800 text-sm truncate">
                                            {feature.label}
                                        </p>
                                        <p className="text-xs text-gray-500 font-mono mt-0.5 truncate">
                                            {feature.key}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteFeature(feature.key)}
                                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-100 text-red-500 transition-all"
                                        title="Delete field"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {enabledFeatures.length === 0 && (
                            <div className="col-span-full text-center py-10 text-gray-400">
                                No active feature fields.
                            </div>
                        )}
                    </div>
                </div>

                {/* ALL FEATURES TABLE */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="p-3 sm:p-4 text-left font-semibold text-gray-700">
                                        Field Name
                                    </th>
                                    <th className="p-3 sm:p-4 text-left font-semibold text-gray-700 hidden sm:table-cell">
                                        Label
                                    </th>
                                    <th className="p-3 sm:p-4 text-center font-semibold text-gray-700">
                                        Status
                                    </th>
                                    <th className="p-3 sm:p-4 text-right font-semibold text-gray-700">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {features.map((feature) => (
                                    <tr
                                        key={feature.key}
                                        className="border-t hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="p-3 sm:p-4">
                                            <code className="text-xs bg-gray-100 px-2 py-1 rounded text-blue-700 font-mono">
                                                {feature.key}
                                            </code>
                                        </td>
                                        <td className="p-3 sm:p-4 text-gray-600 hidden sm:table-cell">
                                            {feature.label}
                                        </td>
                                        <td className="p-3 sm:p-4 text-center">
                                            {feature.enabled ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                                                    <Check size={12} />
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400">
                                                    <X size={12} />
                                                    Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-3 sm:p-4 text-right">
                                            <button
                                                onClick={() => handleDeleteFeature(feature.key)}
                                                className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                                title="Delete field"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ADD MODAL */}
                {showAddModal && (
                    <div
                        className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
                        onClick={(e) => {
                            if (e.target === e.currentTarget) setShowAddModal(false);
                        }}
                    >
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                            <div className="p-5 sm:p-6 border-b">
                                <h2 className="text-lg font-bold text-gray-900">
                                    Add Feature Field
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Adds a new column to PlanFeatures table
                                </p>
                            </div>

                            <div className="p-5 sm:p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                        Field Name
                                    </label>
                                    <input
                                        type="text"
                                        value={newFeature.key}
                                        onChange={(e) =>
                                            setNewFeature({
                                                ...newFeature,
                                                key: e.target.value.toLowerCase().replace(/[^a-z_]/g, ""),
                                            })
                                        }
                                        placeholder="e.g., report_builder"
                                        className="w-full border rounded-xl px-3 py-2.5 text-sm font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">
                                        Lowercase letters and underscores only
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                        Display Label
                                    </label>
                                    <input
                                        type="text"
                                        value={newFeature.label}
                                        onChange={(e) =>
                                            setNewFeature({ ...newFeature, label: e.target.value })
                                        }
                                        placeholder="e.g., Report Builder"
                                        className="w-full border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                        Color
                                    </label>
                                    <div className="grid grid-cols-5 gap-2">
                                        {COLORS.map((color) => (
                                            <button
                                                key={color}
                                                onClick={() =>
                                                    setNewFeature({ ...newFeature, color })
                                                }
                                                className={`w-full h-8 rounded-lg bg-gradient-to-br ${color} ${
                                                    newFeature.color === color
                                                        ? "ring-2 ring-offset-2 ring-gray-400"
                                                        : ""
                                                } transition-all`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="p-5 sm:p-6 border-t bg-gray-50 flex gap-3 rounded-b-2xl">
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 text-sm font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddFeature}
                                    disabled={saving}
                                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
                                >
                                    {saving ? "Adding..." : "Add Field"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}