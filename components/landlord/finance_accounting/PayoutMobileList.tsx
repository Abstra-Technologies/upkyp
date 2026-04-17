"use client";

import PayoutCard from "./PayoutCard";

export default function PayoutMobileList({
                                             accounts,
                                             actions,
                                         }: any) {
    return (
        <div className="space-y-3">
            {accounts.length === 0 ? (
                <p className="text-center text-sm text-gray-500 py-6">
                    No payout accounts yet
                </p>
            ) : (
                accounts.map((acc: any) => (
                    <PayoutCard
                        key={acc.payout_id}
                        acc={acc}
                        actions={actions}
                    />
                ))
            )}
        </div>
    );
}