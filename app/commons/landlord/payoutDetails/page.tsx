'use client'

import { useState } from "react";
import axios from "axios";

import { usePayout } from "@/hooks/landlord/finance/usePayout";
import PayoutTable from "@/components/landlord/finance_accounting/PayoutTable";
import PayoutMobileList from "@/components/landlord/finance_accounting/PayoutMobileList";
import PayoutModal from "@/components/landlord/finance_accounting/PayoutModal";
import AddPayoutAccount from "@/components/landlord/finance_accounting/AddPayoutAccount";
import EditPayoutAccountModal from "@/components/landlord/finance_accounting/EditPayoutAccountModal";

export default function Page() {

    const {
        accounts,
        activeAccount,
        otherAccounts,
        setAccounts,
        deleteAccount,
        updateAccount,
    } = usePayout();

    const [modalOpen, setModalOpen] = useState(false);
    const [properties, setProperties] = useState([]);

    // 🔥 EDIT STATE
    const [editOpen, setEditOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<any>(null);

    /* ======================
       ACTIONS
    ====================== */
    const actions = {

        edit: (acc: any) => {
            setSelectedAccount(acc);
            setEditOpen(true);
        },

        delete: deleteAccount,

        viewProperties: async (acc: any) => {
            try {
                setModalOpen(true);

                const res = await axios.get(
                    "/api/landlord/payout/getAssignedProperties",
                    {
                        params: { payout_id: acc.payout_id },
                    }
                );

                setProperties(res.data || []);
            } catch (error) {
                console.error("Failed to fetch properties", error);
            }
        },
    };

    /* ======================
       HEADER
    ====================== */
    const Header = ({ isMobile = false }: { isMobile?: boolean }) => (
        <div className="bg-white border rounded-2xl px-4 py-4 shadow-sm">
            <div className="flex justify-between items-center">

                <div>
                    <h2 className={`${isMobile ? "text-lg" : "text-xl"} font-bold text-gray-900`}>
                        Accounting
                    </h2>
                    <p className={`${isMobile ? "text-xs" : "text-sm"} text-gray-500`}>
                        Manage your bank accounts and linked properties where money is sent
                    </p>
                </div>

                <AddPayoutAccount
                    onSuccess={(newAccount: any) =>
                        setAccounts((prev: any) => [newAccount, ...prev])
                    }
                />

            </div>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto p-4 space-y-4">

            {/* DESKTOP */}
            <div className="hidden md:block space-y-4">

                <Header />

                <div className="bg-white border rounded-2xl p-4 shadow-sm">
                    <PayoutTable
                        data={accounts}
                        onEdit={actions.edit}
                        onDelete={actions.delete}
                        onViewProperties={actions.viewProperties}
                    />
                </div>

            </div>

            {/* MOBILE */}
            <div className="md:hidden space-y-4">

                <Header isMobile />

                <PayoutMobileList
                    activeAccount={activeAccount}
                    otherAccounts={otherAccounts}
                    actions={actions}
                />

            </div>

            {/* VIEW PROPERTIES MODAL */}
            <PayoutModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                properties={properties}
            />

            {/*  EDIT MODAL */}
            <EditPayoutAccountModal
                open={editOpen}
                onClose={() => setEditOpen(false)}
                account={selectedAccount}
                onSave={updateAccount}
            />

        </div>
    );
}