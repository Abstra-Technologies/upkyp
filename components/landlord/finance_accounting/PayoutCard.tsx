"use client";

export default function PayoutCard({ acc, actions }: any) {

    return (
        <div className="rounded-xl border bg-white px-3 py-3 space-y-2 shadow-sm">

            {/* HEADER */}
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-semibold text-sm text-gray-900 leading-tight">
                        {acc.bank_name}
                    </p>
                    <p className="text-xs text-gray-500">
                        {acc.account_name}
                    </p>
                </div>
            </div>

            {/* ACCOUNT NUMBER */}
            <p className="font-mono text-sm tracking-wide text-gray-800">
                {acc.account_number}
            </p>

            {/* ACTIONS */}
            <div className="flex gap-1.5 pt-1">

                {/* VIEW */}
                <button
                    onClick={() => actions.viewProperties(acc)}
                    className="flex-1 text-[11px] py-1.5 rounded-lg
                    bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition"
                >
                    View
                </button>

                {/* EDIT */}
                <button
                    onClick={() => actions.edit(acc)}
                    className="flex-1 text-[11px] py-1.5 rounded-lg
                    bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
                >
                    Edit
                </button>

                {/* DELETE */}
                <button
                    onClick={() => actions.delete(acc)}
                    className="flex-1 text-[11px] py-1.5 rounded-lg
                    bg-red-100 text-red-700 hover:bg-red-200 transition"
                >
                    Delete
                </button>

            </div>
        </div>
    );
}