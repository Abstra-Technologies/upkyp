"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Plus, Trash2, X, Check, Tag, Database, Hash, Type } from "lucide-react";

type LimitColumn = {
    key: string;
    label: string;
    data_type: string;
    nullable: boolean;
    default: any;
};

const DEFAULT_LIMITS: LimitColumn[] = [
    { key: "max_storage", label: "Max Storage", data_type: "varchar", nullable: true, default: null },
    { key: "max_assets_per_property", label: "Max Assets Per Property", data_type: "int", nullable: true, default: null },
    { key: "financial_history_years", label: "Financial History Years", data_type: "int", nullable: true, default: null },
];

export default function PlanLimitsPage() {
    const [columns, setColumns] = useState<LimitColumn[]>(DEFAULT_LIMITS);
    const [loading, setLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [saving, setSaving] = useState(false);

    const [newCol, setNewCol] = useState({
        key: "",
        label: "",
        data_type: "int",
        default: "",
        nullable: true,
    });

    const DATA_TYPES = [
        { value: "int", label: "Integer", icon: Hash },
        { value: "varchar", label: "Text", icon: Type },
        { value: "decimal", label: "Decimal", icon: Database },
        { value: "tinyint", label: "Boolean", icon: Check },
    ];

    const fetchColumns = async () => {
        setLoading(true);
        try {
            const res = await axios.get("/api/systemadmin/plan-limits/columns");
            if (res.data?.columns?.length > 0) {
                setColumns(res.data.columns);
            }
        } catch (err) {
            console.error("Failed to load columns", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchColumns();
    }, []);

    const handleAddColumn = async () => {
        if (!newCol.key || !newCol.label) {
            Swal.fire("Error", "Field name and label are required", "error");
            return;
        }

        const keyRegex = /^[a-z_]+$/;
        if (!keyRegex.test(newCol.key.toLowerCase())) {
            Swal.fire("Error", "Field name must be lowercase letters and underscores only", "error");
            return;
        }

        if (columns.some((c) => c.key === newCol.key.toLowerCase())) {
            Swal.fire("Error", "This field already exists", "error");
            return;
        }

        setSaving(true);
        try {
            await axios.post("/api/systemadmin/plan-limits/columns", {
                key: newCol.key.toLowerCase(),
                label: newCol.label,
                data_type: newCol.data_type,
                nullable: newCol.nullable ? 1 : 0,
                default: newCol.default || null,
            });

            const added: LimitColumn = {
                key: newCol.key.toLowerCase(),
                label: newCol.label,
                data_type: newCol.data_type,
                nullable: Boolean(newCol.nullable),
                default: newCol.default || null,
            };

            setColumns((prev) => [...prev, added]);
            setShowAddModal(false);
            setNewCol({ key: "", label: "", data_type: "int", default: "", nullable: true });

            Swal.fire("Success", "Limit field added", "success");
        } catch (err: any) {
            Swal.fire("Error", err.response?.data?.error || "Failed to add field", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteColumn = async (key: string) => {
        const confirm = await Swal.fire({
            title: `Delete "${key}"?`,
            text: "This will permanently remove the column from the PlanLimits table.",
            icon: "warning",
            showCancelButton: true,
        });

        if (!confirm.isConfirmed) return;

        try {
            await axios.delete(`/api/systemadmin/plan-limits/columns/${key}`);
            setColumns((prev) => prev.filter((c) => c.key !== key));
            Swal.fire("Deleted", "Column removed", "success");
        } catch (err: any) {
            Swal.fire("Error", err.response?.data?.error || "Failed to delete", "error");
        }
    };

    const getDataTypeIcon = (type: string) => {
        const dt = DATA_TYPES.find((d) => d.value === type);
        return dt ? <dt.icon size={14} /> : <Type size={14} />;
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
            <div className="max-w-4xl mx-auto">

                {/* HEADER */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                            Plan Limit Fields
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Manage dynamic limit columns in the PlanLimits table
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

                {/* COLUMNS GRID */}
                <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b">
                        <Database size={16} className="text-gray-500" />
                        <h2 className="font-semibold text-gray-700">
                            Active Fields ({columns.length})
                        </h2>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {columns.map((col) => (
                            <div
                                key={col.key}
                                className="relative p-4 rounded-xl bg-gradient-to-br from-slate-500 to-gray-600 bg-opacity-5 border border-gray-200 hover:border-gray-300 transition-all group"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-800 text-sm truncate">
                                            {col.label}
                                        </p>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 font-mono">
                                                {getDataTypeIcon(col.data_type)}
                                            </span>
                                            <span className="text-xs text-gray-400 font-mono truncate">
                                                {col.data_type}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteColumn(col.key)}
                                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-100 text-red-500 transition-all"
                                        title="Delete field"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {columns.length === 0 && (
                            <div className="col-span-full text-center py-10 text-gray-400">
                                No limit fields configured.
                            </div>
                        )}
                    </div>
                </div>

                {/* ALL COLUMNS TABLE */}
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
                                        Data Type
                                    </th>
                                    <th className="p-3 sm:p-4 text-center font-semibold text-gray-700">
                                        Nullable
                                    </th>
                                    <th className="p-3 sm:p-4 text-right font-semibold text-gray-700">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-gray-500">
                                            Loading...
                                        </td>
                                    </tr>
                                ) : (
                                    columns.map((col) => (
                                        <tr key={col.key} className="border-t hover:bg-gray-50 transition-colors">
                                            <td className="p-3 sm:p-4">
                                                <code className="text-xs bg-gray-100 px-2 py-1 rounded text-blue-700 font-mono">
                                                    {col.key}
                                                </code>
                                            </td>
                                            <td className="p-3 sm:p-4 text-gray-600 hidden sm:table-cell">
                                                {col.label}
                                            </td>
                                            <td className="p-3 sm:p-4 text-center">
                                                <span className="inline-flex items-center gap-1.5 text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                                                    {getDataTypeIcon(col.data_type)}
                                                    {col.data_type}
                                                </span>
                                            </td>
                                            <td className="p-3 sm:p-4 text-center">
                                                {col.nullable ? (
                                                    <span className="text-xs font-medium text-green-600">Yes</span>
                                                ) : (
                                                    <span className="text-xs font-medium text-red-500">No</span>
                                                )}
                                            </td>
                                            <td className="p-3 sm:p-4 text-right">
                                                <button
                                                    onClick={() => handleDeleteColumn(col.key)}
                                                    className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                                    title="Delete field"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
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
                                    Add Limit Field
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Adds a new column to PlanLimits table
                                </p>
                            </div>

                            <div className="p-5 sm:p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                        Field Name
                                    </label>
                                    <input
                                        type="text"
                                        value={newCol.key}
                                        onChange={(e) =>
                                            setNewCol({
                                                ...newCol,
                                                key: e.target.value.toLowerCase().replace(/[^a-z_]/g, ""),
                                            })
                                        }
                                        placeholder="e.g., max_tenants"
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
                                        value={newCol.label}
                                        onChange={(e) =>
                                            setNewCol({ ...newCol, label: e.target.value })
                                        }
                                        placeholder="e.g., Max Tenants"
                                        className="w-full border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                        Data Type
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {DATA_TYPES.map((dt) => (
                                            <button
                                                key={dt.value}
                                                onClick={() =>
                                                    setNewCol({ ...newCol, data_type: dt.value })
                                                }
                                                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border-2 text-sm transition-all ${
                                                    newCol.data_type === dt.value
                                                        ? "border-blue-500 bg-blue-50 text-blue-700"
                                                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                                                }`}
                                            >
                                                <dt.icon size={14} />
                                                {dt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={newCol.nullable}
                                            onChange={(e) =>
                                                setNewCol({ ...newCol, nullable: e.target.checked })
                                            }
                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-600">Allow NULL values</span>
                                    </label>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                        Default Value
                                        <span className="text-gray-400 font-normal ml-1">(Optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={newCol.default}
                                        onChange={(e) =>
                                            setNewCol({ ...newCol, default: e.target.value })
                                        }
                                        placeholder="e.g., 10 or unlimited"
                                        className="w-full border rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    />
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
                                    onClick={handleAddColumn}
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