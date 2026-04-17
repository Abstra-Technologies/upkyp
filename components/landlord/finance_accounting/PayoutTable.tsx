"use client";

import { MaterialReactTable, MRT_ColumnDef } from "material-react-table";
import { useMemo } from "react";

export default function PayoutTable({
                                        data,
                                        onEdit,
                                        onDelete,
                                        onViewProperties,
                                    }: any) {

    const columns = useMemo<MRT_ColumnDef<any>[]>(() => [
        {
            accessorKey: "bank_name",
            header: "Bank",
        },
        {
            accessorKey: "account_name",
            header: "Account Name",
        },
        {
            accessorKey: "account_number",
            header: "Account Number",
            Cell: ({ cell }) => (
                <span className="font-mono text-sm tracking-wide">
                    {cell.getValue<string>()}
                </span>
            ),
        },
        {
            accessorKey: "is_active",
            header: "Status",
            Cell: ({ cell }) => {
                const active = cell.getValue() === 1;
                return (
                    <span
                        className={`px-2 py-1 text-xs rounded-full font-semibold
                        ${active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                    >
                        {active ? "Active" : "Inactive"}
                    </span>
                );
            },
        },
        {
            id: "actions",
            header: "Actions",
            Cell: ({ row }) => {
                const acc = row.original;
                const isActive = acc.is_active === 1;

                return (
                    <div className="flex flex-wrap gap-2">

                        {/* VIEW LINKED PROPERTIES */}
                        <button
                            onClick={() => onViewProperties(acc)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg
                            bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition"
                        >
                            View Linked Properties
                        </button>

                        {/* EDIT */}
                        <button
                            onClick={() => onEdit(acc)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg
                            bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
                        >
                            Edit
                        </button>

                        {/* DELETE */}
                        <button
                            onClick={() => onDelete(acc)}
                            disabled={isActive}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition
                            ${isActive
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-red-100 text-red-700 hover:bg-red-200"
                            }`}
                        >
                            Delete
                        </button>

                    </div>
                );
            },
        },
    ], [onEdit, onDelete, onViewProperties]);

    return (
        <MaterialReactTable
            columns={columns}
            data={data}
            enableSorting
            enableColumnActions={false}
            enableDensityToggle={false}

            initialState={{
                pagination: { pageSize: 5, pageIndex: 0 },
            }}

            muiTablePaperProps={{
                sx: {
                    borderRadius: "12px",
                    border: "1px solid #e5e7eb",
                    boxShadow: "none",
                },
            }}

            muiTableBodyCellProps={{
                sx: {
                    fontSize: "0.875rem",
                },
            }}
        />
    );
}