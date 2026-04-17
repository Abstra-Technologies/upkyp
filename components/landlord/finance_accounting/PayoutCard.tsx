
export default function PayoutCard({ acc, actions }: any) {
    const isActive = acc.is_active === 1;

    return (
        <div
            className={`rounded-xl border px-3 py-3 space-y-2
            ${isActive
                ? "bg-gradient-to-br from-blue-600 to-emerald-600 text-white"
                : "bg-white"
            }`}
        >
            {/* HEADER */}
            <div className="flex justify-between items-center">
                <div>
                    <p className="font-semibold text-sm leading-tight">
                        {acc.bank_name}
                    </p>
                    <p className="text-xs opacity-80">
                        {acc.account_name}
                    </p>
                </div>

                {isActive && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20">
                        ACTIVE
                    </span>
                )}
            </div>

            {/* ACCOUNT NUMBER */}
            <p className="font-mono text-sm tracking-wide">
                {acc.account_number}
            </p>

            {/* ACTIONS */}
            <div className="flex gap-2 pt-1">

                {!isActive && (
                    <button
                        onClick={() => actions.setActive(acc)}
                        className="flex-1 text-xs py-1.5 rounded-lg
                        bg-blue-600 text-white hover:bg-blue-700 transition"
                    >
                        Set Active
                    </button>
                )}

                <button
                    onClick={() => actions.viewProperties(acc)}
                    className={`flex-1 text-xs py-1.5 rounded-lg transition
                    ${isActive
                        ? "bg-white/20 text-white hover:bg-white/30"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                >
                   View Assigned Properties
                </button>

            </div>
        </div>
    );
}