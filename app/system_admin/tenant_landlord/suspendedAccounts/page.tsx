"use client";

import { useEffect, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TextField,
    Button,
} from "@mui/material";
import Swal from "sweetalert2";
import LoadingScreen from "../../../../components/loadingScreen";

type SuspendedAccount = {
    user_id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    userType?: string;
    updatedAt?: string;
};

export default function SuspendedAccounts() {
    const [accounts, setAccounts] = useState<SuspendedAccount[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    /* =====================================================
       FETCH SUSPENDED ACCOUNTS
    ===================================================== */
    const fetchSuspendedAccounts = async () => {
        try {
            setLoading(true);
            const res = await fetch(
                "/api/systemadmin/users/getAllSuspendAccounts"
            );

            if (!res.ok) {
                throw new Error("Failed to fetch suspended accounts.");
            }

            const data = await res.json();
            setAccounts(data || []);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const handleForceDelete = async (user_id: string, userType?: string) => {
        const { isConfirmed } = await Swal.fire({
            title: "⚠️ Permanent Deletion",
            html: `
            <p>This action <strong>cannot be undone</strong>.</p>
            <p>The account and all related data will be permanently deleted.</p>
        `,
            icon: "error",
            showCancelButton: true,
            confirmButtonText: "Yes, delete the account permanently",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#d33",
        });

        if (!isConfirmed) return;

        try {
            const res = await fetch(
                "/api/systemadmin/users/forceDeleteAccount",
                {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ user_id, userType }),
                }
            );

            const data = await res.json();

            if (!data.success) {
                throw new Error("Force delete failed");
            }

            // ✅ Optimistic UI update (remove row instantly)
            setAccounts((prev) =>
                prev.filter((acc) => acc.user_id !== user_id)
            );

            await Swal.fire({
                title: "Deleted!",
                text: "Account has been permanently deleted.",
                icon: "success",
            });
        } catch (err) {
            console.error(err);
            await Swal.fire({
                title: "Error!",
                text: "Failed to delete account. Please try again.",
                icon: "error",
            });
        }
    };


    useEffect(() => {
        fetchSuspendedAccounts();
    }, []);

    /* =====================================================
       FILTER
    ===================================================== */
    const filteredAccounts = accounts.filter((account) => {
        const q = searchQuery.toLowerCase();

        return (
            account.firstName?.toLowerCase().includes(q) ||
            account.lastName?.toLowerCase().includes(q) ||
            account.email?.toLowerCase().includes(q) ||
            account.userType?.toLowerCase().includes(q)
        );
    });

    /* =====================================================
       REACTIVATE ACCOUNT
    ===================================================== */
    const handleReactivate = async (user_id: string, userType?: string) => {
        const { isConfirmed } = await Swal.fire({
            title: "Are you sure?",
            text: "Do you want to reactivate this account?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, Reactivate",
            cancelButtonText: "Cancel",
        });

        if (!isConfirmed) return;

        try {
            const res = await fetch(
                "/api/systemadmin/reactivate",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ user_id, userType }),
                }
            );

            const data = await res.json();

            if (!data.success) {
                throw new Error("Failed to reactivate account.");
            }

            // ✅ Optimistic UI update (no refresh)
            setAccounts((prev) =>
                prev.filter((acc) => acc.user_id !== user_id)
            );

            await Swal.fire({
                title: "Reactivated!",
                text: "Account has been successfully reactivated.",
                icon: "success",
            });
        } catch (err) {
            console.error(err);
            await Swal.fire({
                title: "Error!",
                text: "Failed to reactivate account. Please try again.",
                icon: "error",
            });
        }
    };

    /* =====================================================
       GUARDS
    ===================================================== */
    if (loading) return <LoadingScreen />;
    if (error)
        return <p className="text-red-500 p-6">Error: {error}</p>;

    /* =====================================================
       RENDER
    ===================================================== */
    return (
        <div className="flex">
            <div className="w-full p-6 max-w-6xl mx-auto">
                <h1 className="text-2xl font-semibold text-blue-600 mb-6">
                    Suspended Accounts
                </h1>

                <TextField
                    label="Search suspended accounts..."
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />

                <TableContainer
                    component={Paper}
                    style={{ maxHeight: 450, overflow: "auto" }}
                >
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>First Name</strong></TableCell>
                                <TableCell><strong>Last Name</strong></TableCell>
                                <TableCell><strong>Email</strong></TableCell>
                                <TableCell><strong>User Type</strong></TableCell>
                                <TableCell><strong>Date Suspended</strong></TableCell>
                                <TableCell align="center"><strong>Action</strong></TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {filteredAccounts.length > 0 ? (
                                filteredAccounts.map((account) => (
                                    <TableRow key={account.user_id} hover>
                                        <TableCell>
                                            {account.firstName || "-"}
                                        </TableCell>
                                        <TableCell>
                                            {account.lastName || "-"}
                                        </TableCell>
                                        <TableCell>
                                            {account.email || "-"}
                                        </TableCell>
                                        <TableCell>
                                            {account.userType || "-"}
                                        </TableCell>
                                        <TableCell>
                                            {account.updatedAt
                                                ? new Date(
                                                    account.updatedAt
                                                ).toLocaleString()
                                                : "-"}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                size="small"
                                                onClick={() =>
                                                    handleReactivate(
                                                        account.user_id,
                                                        account.userType
                                                    )
                                                }
                                            >
                                                Re-Activate
                                            </Button>
                                            <Button
                                                variant="contained"
                                                color="error"
                                                size="small"
                                                onClick={() =>
                                                    handleForceDelete(account.user_id, account.userType)
                                                }
                                            >
                                                Force Delete
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        align="center"
                                        className="text-gray-500"
                                    >
                                        No suspended accounts found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </div>
        </div>
    );
}
