"use client";

import { useState } from "react";

import { usePayout } from "@/hooks/landlord/finance/usePayout";
import { usePayoutProperty } from "@/hooks/landlord/finance/useAssignProperty";

import PayoutTable from "@/components/landlord/finance_accounting/PayoutTable";
import PayoutMobileList from "@/components/landlord/finance_accounting/PayoutMobileList";
import PayoutModal from "@/components/landlord/finance_accounting/PayoutModal";
import AddPayoutAccount from "@/components/landlord/finance_accounting/AddPayoutAccount";
import EditPayoutAccountModal from "@/components/landlord/finance_accounting/EditPayoutAccountModal";

export default function Page() {

    const {
        accounts,
        setAccounts,
        deleteAccount,
        updateAccount,
    } = usePayout();

    const { getAssignedProperties } = usePayoutProperty();

    const [modalOpen, setModalOpen] = useState(false);

    //  assigned properties
    const [properties, setProperties] = useState([]);

    //  all landlord properties
    const [allProperties, setAllProperties] = useState([]);

    const [editOpen, setEditOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<any>(null);

    /* ======================
       FETCH ALL PROPERTIES
    ====================== */
    const fetchAllProperties = async () => {
        try {
            const res = await fetch("/api/propertyListing/getPropertyperLandlord");
            const data = await res.json();
            return Array.isArray(data) ? data : [];
        } catch (err) {
            console.error("Failed to fetch all properties", err);
            return [];
        }
    };

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
                setSelectedAccount(acc);
                setModalOpen(true);

                // 🔥 fetch BOTH in parallel
                const [assigned, all] = await Promise.all([
                    getAssignedProperties(acc.payout_id),
                    fetchAllProperties(),
                ]);

                setProperties(Array.isArray(assigned) ? assigned : []);
                setAllProperties(Array.isArray(all) ? all : []);

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
                    accounts={accounts}
                    actions={actions}
                />

            </div>

            {/* 🔥 VIEW / MANAGE PROPERTIES MODAL */}
            <PayoutModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                properties={properties}
                allProperties={allProperties} // 🔥 REQUIRED FIX
                payout_id={selectedAccount?.payout_id}
                setProperties={setProperties}
            />

            {/* EDIT MODAL */}
            <EditPayoutAccountModal
                open={editOpen}
                onClose={() => setEditOpen(false)}
                account={selectedAccount}
                onSave={updateAccount}
            />

        </div>
    );
}