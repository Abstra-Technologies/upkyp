"use client";

import { useState } from "react";
import { Landmark } from "lucide-react";

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

                //  fetch BOTH in parallel FIRST
                const [assigned, all] = await Promise.all([
                    getAssignedProperties(acc.payout_id),
                    fetchAllProperties(),
                ]);

                setProperties(Array.isArray(assigned) ? assigned : []);
                setAllProperties(Array.isArray(all) ? all : []);

                // THEN open modal
                setModalOpen(true);

            } catch (error) {
                console.error("Failed to fetch properties", error);
            }
        },
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/25">
                            <Landmark className="w-6 h-6 text-white" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-xl font-bold text-gray-900 truncate">
                                Bank Accounts Linked
                            </h1>
                            <p className="text-sm text-gray-500 truncate">
                                Manage bank accounts and linked properties
                            </p>
                        </div>
                    </div>

                    <div className="sm:ml-auto w-full sm:w-auto">
                        <AddPayoutAccount
                            onSuccess={(newAccount: any) =>
                                setAccounts((prev: any) => [newAccount, ...prev])
                            }
                        />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="px-4 sm:px-6 py-6 pb-24">
                <div className="max-w-6xl mx-auto space-y-4">
                    {/* Desktop Table */}
                    <div className="hidden sm:block bg-white border border-gray-300 rounded-lg shadow-[inset_0_1px_0_rgba(255,255,255,1),0_1px_2px_rgba(0,0,0,0.05)] p-4">
                        <PayoutTable
                            data={accounts}
                            onEdit={actions.edit}
                            onDelete={actions.delete}
                            onViewProperties={actions.viewProperties}
                        />
                    </div>

                    {/* Mobile List */}
                    <div className="sm:hidden">
                        <PayoutMobileList
                            accounts={accounts}
                            actions={actions}
                        />
                    </div>
                </div>
            </div>

            {/*  VIEW / MANAGE PROPERTIES MODAL */}
            <PayoutModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                properties={properties}
                allProperties={allProperties}
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
