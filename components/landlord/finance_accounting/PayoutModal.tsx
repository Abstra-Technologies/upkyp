"use client";

import { useState } from "react";
import { usePayoutProperty } from "@/hooks/landlord/finance/useAssignProperty";

export default function PayoutModal({
                                        open,
                                        onClose,
                                        properties,
                                        allProperties, // 🔥 NEW
                                        payout_id,
                                        setProperties,
                                    }: any) {

    const { assignProperty, deassignProperty } = usePayoutProperty();

    const [selectedProperty, setSelectedProperty] = useState("");

    if (!open) return null;

    const safeProperties = Array.isArray(properties) ? properties : [];
    const safeAllProperties = Array.isArray(allProperties) ? allProperties : [];

    /* ======================
       FILTER AVAILABLE
    ====================== */
    const assignedIds = safeProperties.map((p: any) => p.property_id);

    const availableProperties = safeAllProperties.filter(
        (p: any) => !assignedIds.includes(p.property_id)
    );

    /* ======================
       ASSIGN
    ====================== */
    const handleAssign = async () => {
        if (!selectedProperty) return;

        const property = safeAllProperties.find(
            (p: any) => p.property_id === selectedProperty
        );

        if (!property) return;

        await assignProperty(payout_id, property.property_id);

        // optimistic UI
        setProperties((prev: any[]) => [...prev, property]);

        setSelectedProperty("");
    };

    /* ======================
       DEASSIGN
    ====================== */
    const handleDeassign = async (property: any) => {
        await deassignProperty(payout_id, property.property_id);

        setProperties((prev: any[]) =>
            prev.filter((p) => p.property_id !== property.property_id)
        );
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">

            <div className="bg-white w-full max-w-md rounded-2xl shadow-lg flex flex-col max-h-[85vh]">

                {/* HEADER */}
                <div className="px-5 py-4 border-b">
                    <h2 className="font-semibold text-gray-900">
                        Assigned Properties ({safeProperties.length})
                    </h2>
                    <p className="text-xs text-gray-500">
                        Manage properties linked to this payout account
                    </p>
                </div>

                {/* 🔥 ADD PROPERTY */}
                <div className="p-4 border-b space-y-2">
                    <p className="text-xs text-gray-500">Add Property</p>

                    <div className="flex gap-2">
                        <select
                            value={selectedProperty}
                            onChange={(e) => setSelectedProperty(e.target.value)}
                            className="flex-1 border rounded-lg px-3 py-2 text-sm"
                        >
                            <option value="">Select property</option>

                            {availableProperties.map((p: any) => (
                                <option key={p.property_id} value={p.property_id}>
                                    {p.property_name}
                                </option>
                            ))}
                        </select>

                        <button
                            onClick={handleAssign}
                            disabled={!selectedProperty}
                            className="px-3 py-2 text-sm rounded-lg
                            bg-emerald-600 text-white hover:bg-emerald-700
                            disabled:opacity-50 transition"
                        >
                            Add
                        </button>
                    </div>
                </div>

                {/* CONTENT */}
                <div className="p-4 space-y-2 overflow-y-auto">

                    {safeProperties.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-6">
                            No properties assigned
                        </p>
                    ) : (
                        safeProperties.map((p: any) => (
                            <div
                                key={p.property_id}
                                className="flex justify-between items-center border rounded-lg px-3 py-2 text-sm hover:bg-gray-50 transition"
                            >
                                <span className="text-gray-800">
                                    {p.property_name}
                                </span>

                                <button
                                    onClick={() => handleDeassign(p)}
                                    className="text-xs px-2 py-1 rounded-md
                                    bg-red-100 text-red-700 hover:bg-red-200 transition"
                                >
                                    Remove
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* FOOTER */}
                <div className="p-4 border-t">
                    <button
                        onClick={onClose}
                        className="w-full py-2 rounded-xl text-sm font-semibold
                        bg-gray-900 text-white hover:bg-black transition"
                    >
                        Close
                    </button>
                </div>

            </div>
        </div>
    );
}