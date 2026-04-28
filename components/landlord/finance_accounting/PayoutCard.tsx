"use client";

import { Trash2, Pencil } from "lucide-react";

export default function PayoutCard({ acc, actions }: any) {
    return (
        <div className="rounded-xl border bg-white px-3 py-2.5 shadow-sm relative">
            {/* DELETE ICON - TOP RIGHT */}
            <button
                onClick={() => actions.delete(acc)}
                disabled={acc.is_active === 1}
                className={`absolute top-2 right-2 p-1.5 rounded-lg transition ${
                    acc.is_active === 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-400 hover:text-red-600 hover:bg-red-50"
                }`}
            >
                <Trash2 className="w-4 h-4" />
            </button>

            {/* HEADER */}
            <div className="flex items-center justify-between gap-2 pr-8">
                <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide leading-none">Bank</p>
                    <p className="font-semibold text-sm text-gray-900 leading-tight truncate mt-0.5">
                        {acc.bank_name}
                    </p>
                </div>
                <span
                    className={`px-2 py-0.5 text-[10px] rounded-full font-semibold flex-shrink-0
                    ${acc.is_active === 1
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                >
                    {acc.is_active === 1 ? "Active" : "Inactive"}
                </span>
            </div>

            {/* ACCOUNT NAME & NUMBER */}
            <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide leading-none">Account Name</p>
                    <p className="text-xs text-gray-900 truncate mt-0.5">
                        {acc.account_name}
                    </p>
                </div>
                <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide leading-none">Account Number</p>
                    <p className="font-mono text-xs tracking-wide text-gray-900 mt-0.5">
                        {acc.account_number}
                    </p>
                </div>
            </div>

            {/* BOTTOM ACTIONS */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                <button
                    onClick={() => actions.viewProperties(acc)}
                    className="flex-1 text-xs py-1.5 rounded-lg font-medium text-center px-2
                    bg-indigo-600 text-white hover:bg-indigo-700 transition"
                >
                    View Linked Properties
                </button>
                <button
                    onClick={() => actions.edit(acc)}
                    className="ml-2 p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
                >
                    <Pencil className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}