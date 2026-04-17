// components/payout/PayoutMobileList.tsx
"use client";

import PayoutCard from "./PayoutCard";

export default function PayoutMobileList({
                                             activeAccount,
                                             otherAccounts,
                                             actions,
                                         }: any) {
    return (
        <div className="space-y-4">
            {activeAccount && (
                <PayoutCard acc={activeAccount} actions={actions} />
            )}
            {otherAccounts.map((acc: any) => (
                <PayoutCard key={acc.payout_id} acc={acc} actions={actions} />
            ))}
        </div>
    );
}