"use client";

import React, { useMemo, useState } from "react";
import {
    Home,
    Edit2,
    Trash2,
    Eye,
    Globe,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import axios from "axios";
import { QrCode } from "lucide-react";

import {
    MaterialReactTable,
    MRT_ColumnDef,
} from "material-react-table";

interface UnitsTabProps {
    units: any[];
    isLoading: boolean;
    propertyId: string | number;
    handleEditUnit: (unitId: number) => void;
    handleDeleteUnit: (unitId: number) => void;
    handleAddUnitClick: () => void;
    onPublishToggle: (unitId: number, publish: boolean) => void;
}

const ITEMS_PER_PAGE = 5;

const UnitsTab: React.FC<UnitsTabProps> = ({
                                               units,
                                               isLoading,
                                               propertyId,
                                               handleEditUnit,
                                               handleDeleteUnit,
                                               handleAddUnitClick,
                                               onPublishToggle,
                                           }) => {
    const router = useRouter();

    /* ------------------------------------------------------------------ */
    /* MOBILE PAGINATION STATE                                            */
    /* ------------------------------------------------------------------ */
    const [mobilePage, setMobilePage] = useState(1);
    const totalPages = Math.ceil(units.length / ITEMS_PER_PAGE);

    const pagedUnits = units.slice(
        (mobilePage - 1) * ITEMS_PER_PAGE,
        mobilePage * ITEMS_PER_PAGE
    );

    /* ------------------------------------------------------------------ */
    /* PUBLISH TOGGLE                                                     */
    /* ------------------------------------------------------------------ */
    const handleTogglePublish = async (
        unitId: number,
        currentValue: boolean
    ) => {
        const next = !currentValue;
        onPublishToggle(unitId, next);

        try {
            await axios.put("/api/unitListing/publish", {
                unit_id: unitId,
                publish: next,
            });

            Swal.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                title: next ? "Unit published" : "Unit hidden",
                showConfirmButton: false,
                timer: 1500,
            });
        } catch (error: any) {
            onPublishToggle(unitId, currentValue);

            Swal.fire({
                toast: true,
                position: "top-end",
                icon: "error",
                title: "Update failed",
                text:
                    error.response?.data?.message ||
                    "Unable to update unit status.",
                showConfirmButton: false,
                timer: 2500,
            });
        }
    };

    /* ------------------------------------------------------------------ */
    /* DESKTOP TABLE COLUMNS                                              */
    /* ------------------------------------------------------------------ */
    const getStatusBadge = (status: string) => {
        const statusColors: Record<string, string> = {
            available: "bg-emerald-100 text-emerald-700 border-emerald-200",
            occupied: "bg-blue-100 text-blue-700 border-blue-200",
            maintenance: "bg-amber-100 text-amber-700 border-amber-200",
            unavailable: "bg-red-100 text-red-700 border-red-200",
            reserved: "bg-purple-100 text-purple-700 border-purple-200",
        };
        const colorClass = statusColors[status?.toLowerCase()] || "bg-gray-100 text-gray-700 border-gray-200";
        
        return (
            <span className={`px-2 py-1 rounded-full text-[10px] font-semibold border capitalize ${colorClass}`}>
                {status || "Unknown"}
            </span>
        );
    };

    const columns = useMemo<MRT_ColumnDef<any>[]>(
        () => [
            {
                accessorKey: "unit_name",
                header: "Unit",
                size: 220,
                Cell: ({ row }) => (
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Home className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate">
                                {row.original.unit_name || "Untitled Unit"}
                            </p>
                            <div className="mt-1">
                                {getStatusBadge(row.original.status)}
                            </div>
                        </div>
                    </div>
                ),
            },
            {
                accessorKey: "rent_amount",
                header: "Rent",
                size: 120,
                Cell: ({ cell }) =>
                    `₱${Number(cell.getValue() || 0).toLocaleString()}`,
            },
            {
                accessorKey: "publish",
                header: "Published",
                size: 140,
                Cell: ({ row }) => (
                    <button
                        onClick={() =>
                            handleTogglePublish(
                                row.original.unit_id,
                                !!row.original.publish
                            )
                        }
                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold border
              ${
                            row.original.publish
                                ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                                : "bg-gray-100 text-gray-600 border-gray-300"
                        }`}
                    >
                        <Globe className="inline w-4 h-4 mr-1" />
                        {row.original.publish ? "Published" : "Hidden"}
                    </button>
                ),
            },
            {
                id: "actions",
                header: "Actions",
                size: 280,
                Cell: ({ row }) => (
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => router.push(`/landlord/properties/${propertyId}/units/details/${row.original.unit_id}`)}
                            className="px-3 py-1.5 rounded-lg text-sm text-blue-600 hover:bg-blue-50"
                        >
                            <Eye className="inline w-4 h-4 mr-1" />
                            View
                        </button>
                        <button
                            onClick={() => handleEditUnit(row.original.unit_id)}
                            className="px-3 py-1.5 rounded-lg text-sm text-orange-600 hover:bg-orange-50"
                        >
                            <Edit2 className="inline w-4 h-4 mr-1" />
                            Edit
                        </button>
                        <button
                            onClick={() => handleDeleteUnit(row.original.unit_id)}
                            className="px-3 py-1.5 rounded-lg text-sm text-red-600 hover:bg-red-50"
                        >
                            <Trash2 className="inline w-4 h-4 mr-1" />
                            Delete
                        </button>
                        {row.original.qr_code_url && (
                            <button
                                onClick={() =>
                                    window.open(row.original.qr_code_url, "_blank")
                                }
                                className="px-3 py-1.5 rounded-lg text-sm
                           bg-gray-900 text-white hover:bg-black"
                            >
                                <QrCode className="inline w-4 h-4 mr-1" />
                                View QR
                            </button>
                        )}
                    </div>
                ),
            },
        ],
        [propertyId]
    );

    /* ------------------------------------------------------------------ */
    /* LOADING / EMPTY                                                    */
    /* ------------------------------------------------------------------ */
    if (isLoading) {
        return (
            <div className="p-4 space-y-3">
                {[...Array(4)].map((_, i) => (
                    <div
                        key={i}
                        className="h-12 rounded-md bg-gray-100 animate-pulse"
                    />
                ))}
            </div>
        );
    }

    if (!units || units.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <Home className="w-10 h-10 text-blue-500 mb-3" />
                <p className="text-lg font-semibold text-gray-900">
                    No units yet
                </p>
                <p className="text-sm text-gray-500 mb-5">
                    Add your first unit to get started.
                </p>
                <button
                    onClick={handleAddUnitClick}
                    className="px-5 py-2.5 rounded-lg text-sm font-semibold
          bg-gradient-to-r from-blue-600 to-emerald-600 text-white"
                >
                    Add Unit
                </button>
            </div>
        );
    }

    return (
        <div className="w-full">

            {/* =============================================================== */}
            {/* MOBILE: STACKED LIST + PAGINATION                               */}
            {/* =============================================================== */}
            <div className="md:hidden divide-y divide-gray-200">
                {pagedUnits.map((unit) => (
                    <div
                        key={unit.unit_id}
                        className="px-3 py-3 flex items-center gap-3"
                    >
                        <div className="w-9 h-9 rounded-md bg-blue-50 flex items-center justify-center">
                            <Home className="w-4 h-4 text-blue-600" />
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                                {unit.unit_name || "Untitled Unit"}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[11px] text-gray-500">
                                    ₱{Number(unit.rent_amount || 0).toLocaleString()}
                                </span>
                                {getStatusBadge(unit.status)}
                            </div>

                            {/* ACTIONS */}
                            <div className="flex gap-3 mt-1 text-[11px] font-semibold">
                                <button
                                    onClick={() => router.push(`/landlord/properties/${propertyId}/units/details/${unit.unit_id}`)}
                                    className="text-blue-600"
                                >
                                    View
                                </button>
                                <button
                                    onClick={() => handleEditUnit(unit.unit_id)}
                                    className="text-orange-600"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDeleteUnit(unit.unit_id)}
                                    className="text-red-600"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={() =>
                                handleTogglePublish(unit.unit_id, !!unit.publish)
                            }
                            className={`px-2 py-1 text-[10px] font-semibold rounded-md border
                ${
                                unit.publish
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                    : "bg-gray-50 text-gray-600 border-gray-300"
                            }`}
                        >
                            {unit.publish ? "Live" : "Hidden"}
                        </button>
                    </div>
                ))}

                {/* MOBILE PAGINATION */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-3 py-2">
                        <button
                            disabled={mobilePage === 1}
                            onClick={() => setMobilePage((p) => p - 1)}
                            className="text-xs flex items-center gap-1 disabled:opacity-50"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Prev
                        </button>
                        <span className="text-xs text-gray-500">
              Page {mobilePage} of {totalPages}
            </span>
                        <button
                            disabled={mobilePage === totalPages}
                            onClick={() => setMobilePage((p) => p + 1)}
                            className="text-xs flex items-center gap-1 disabled:opacity-50"
                        >
                            Next
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* =============================================================== */}
            {/* DESKTOP: MATERIAL REACT TABLE (WITH PAGINATION)                 */}
            {/* =============================================================== */}
            <div className="hidden md:block">
                <MaterialReactTable
                    columns={columns}
                    data={units}
                    enableSorting={false}
                    enableColumnActions={false}
                    layoutMode="grid"
                    enableColumnResizing={false}
                    muiTableContainerProps={{
                        sx: { overflowX: "hidden" },
                    }}
                    initialState={{
                        pagination: { pageSize: 10, pageIndex: 0 },
                    }}
                />
            </div>
        </div>
    );
};

export default UnitsTab;
