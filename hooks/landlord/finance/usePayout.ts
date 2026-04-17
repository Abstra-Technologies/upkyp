// hooks/usePayout.ts
import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

export function usePayout() {
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    /* ======================
       LOAD ACCOUNTS
    ====================== */
    useEffect(() => {
        let isMounted = true;

        async function load() {
            try {
                const res = await axios.get(
                    "/api/landlord/payout/getAllAccount"
                );

                if (isMounted) {
                    setAccounts(res.data.accounts || []);
                    setLoading(false);
                }
            } catch (error) {
                console.error("Failed to load payout accounts:", error);
                if (isMounted) setLoading(false);
            }
        }

        load();

        return () => {
            isMounted = false;
        };
    }, []);

    /* ======================
       DELETE ACCOUNT
    ====================== */
    const deleteAccount = async (acc: any) => {
        const confirm = await Swal.fire({
            title: "Delete account?",
            text: "This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
        });

        if (!confirm.isConfirmed) return;

        try {
            await axios.delete("/api/landlord/payout/deleteAccount", {
                data: { payout_id: acc.payout_id },
            });

            // optimistic update
            setAccounts((prev) =>
                prev.filter((a) => a.payout_id !== acc.payout_id)
            );

            await Swal.fire("Deleted", "Account removed", "success");
        } catch (error) {
            console.error(error);
            await Swal.fire("Error", "Failed to delete account", "error");
        }
    };

    /* ======================
       UPDATE ACCOUNT
    ====================== */
    const updateAccount = async (
        payout_id: number,
        data: {
            account_name: string;
            account_number: string;
            channel_code?: string;
            bank_name?: string;
        }
    ) => {
        if (!data.account_name || !data.account_number) {
            await Swal.fire("Missing fields", "Complete all fields", "warning");
            return;
        }

        try {
            await axios.put("/api/landlord/payout/updateAccount", {
                payout_id,
                ...data,
            });

            // optimistic update
            setAccounts((prev) =>
                prev.map((a) =>
                    a.payout_id === payout_id ? { ...a, ...data } : a
                )
            );

            await Swal.fire("Updated", "Account updated", "success");
        } catch (error) {
            console.error(error);
            await Swal.fire("Error", "Failed to update account", "error");
        }
    };

    return {
        accounts,
        setAccounts,
        loading,

        // actions
        deleteAccount,
        updateAccount,
    };
}