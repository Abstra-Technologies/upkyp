// hooks/usePayout.ts
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Swal from "sweetalert2";

export function usePayout() {
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    /* ======================
       LOAD
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
       SET ACTIVE
    ====================== */
    const setActive = async (acc: any) => {
        try {
            await axios.post("/api/landlord/payout/setActive", {
                payout_id: acc.payout_id,
            });

            // optimistic update
            setAccounts((prev) =>
                prev.map((a) => ({
                    ...a,
                    is_active: a.payout_id === acc.payout_id ? 1 : 0,
                }))
            );
        } catch (error) {
            console.error(error);
            Swal.fire("Error", "Failed to set active account", "error");
        }
    };

    /* ======================
       DELETE
    ====================== */
    const deleteAccount = async (acc: any) => {
        if (acc.is_active === 1) {
            await Swal.fire(
                "Not allowed",
                "You cannot delete the active account",
                "warning"
            );
            return;
        }

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

            // remove locally
            setAccounts((prev) =>
                prev.filter((a) => a.payout_id !== acc.payout_id)
            );

            Swal.fire("Deleted", "Account removed", "success");
        } catch (error) {
            console.error(error);
            Swal.fire("Error", "Failed to delete account", "error");
        }
    };

    /* ======================
       EDIT
    ====================== */
    const updateAccount = async (
        payout_id: number,
        data: { account_name: string; account_number: string }
    ) => {
        if (!data.account_name || !data.account_number) {
            Swal.fire("Missing fields", "Complete all fields", "warning");
            return;
        }

        try {
            await axios.put("/api/landlord/payout/updateAccount", {
                payout_id,
                ...data,
            });

            // update locally
            setAccounts((prev) =>
                prev.map((a) =>
                    a.payout_id === payout_id ? { ...a, ...data } : a
                )
            );

            Swal.fire("Updated", "Account updated", "success");
        } catch (error) {
            console.error(error);
            Swal.fire("Error", "Failed to update account", "error");
        }
    };

    /* ======================
       DERIVED STATE
    ====================== */
    const activeAccount = useMemo(
        () => accounts.find((a) => a.is_active === 1),
        [accounts]
    );

    const otherAccounts = useMemo(
        () => accounts.filter((a) => a.is_active === 0),
        [accounts]
    );

    return {
        accounts,
        activeAccount,
        otherAccounts,
        setAccounts,
        loading,

        // 🔥 actions
        setActive,
        deleteAccount,
        updateAccount,
    };
}