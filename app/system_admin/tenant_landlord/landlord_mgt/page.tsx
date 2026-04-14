"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "../../../../zustand/authStore";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TextField,
    TableSortLabel,
    Button,
} from "@mui/material";
import { Eye } from "lucide-react";
import LoadingScreen from "../../../../components/loadingScreen";
import axios from "axios";
import Swal from "sweetalert2";

export default function LandlordList() {
    const [landlords, setLandlords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState<{
        key: string | null;
        direction: "asc" | "desc";
    }>({ key: null, direction: "asc" });

    const { admin } = useAuthStore();
    const router = useRouter();

    /* =====================================================
       FETCH LANDLORDS
    ===================================================== */
    useEffect(() => {
        fetchLandlords();
    }, []);


    const fetchLandlords = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                "/api/systemadmin/users/getAllLandlords"
            );

            if (!response.ok) {
                throw new Error("Failed to fetch landlords.");
            }

            const data = await response.json();
            setLandlords(data.landlords || []);
        } catch (err: any) {
            setError(err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    /* =====================================================
       SORT HANDLER
    ===================================================== */
    const requestSort = (key: string) => {
        let direction: "asc" | "desc" = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });
    };

    /* =====================================================
       SUSPEND ACCOUNT
    ===================================================== */
    const handleSuspend = async (userId: string, email: string) => {
        const { isConfirmed } = await Swal.fire({
            title: "Are you sure?",
            text: "Do you really want to suspend this account?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, suspend it!",
            cancelButtonText: "Cancel",
        });

        if (!isConfirmed) return;

        const { value: formValues } = await Swal.fire({
            title: "Additional Details",
            html:
                `<input
                id="swal-input1"
                type="email"
                placeholder="Email"
                class="swal2-input"
                value="${email}"
            />` +
                `<textarea
                id="swal-input2"
                placeholder="Message (optional)"
                class="swal2-textarea"
            ></textarea>`,
            preConfirm: () => {
                const emailInput = (
                    document.getElementById("swal-input1") as HTMLInputElement
                ).value;
                const message = (
                    document.getElementById("swal-input2") as HTMLTextAreaElement
                ).value;

                if (!emailInput) {
                    Swal.showValidationMessage("Email is required.");
                    return;
                }

                return { email: emailInput, message };
            },
            showCancelButton: true,
        });

        if (!formValues) return;

        try {
            await axios.post("/api/systemadmin/users/suspendAccounts", {
                userId,
                email: formValues.email,
                message: formValues.message,
            });

            // ✅ Optimistic UI update (no refresh needed)
            setLandlords((prev) =>
                prev.map((landlord) =>
                    landlord.user_id === userId
                        ? { ...landlord, status: "suspended" }
                        : landlord
                )
            );

            await Swal.fire(
                "Suspended!",
                "Account has been suspended.",
                "success"
            );
            await fetchLandlords();

        } catch (error) {
            console.error("Error suspending account:", error);
            await Swal.fire(
                "Error!",
                "Failed to suspend account.",
                "error"
            );
        }
    };

    /* =====================================================
       FILTER + SORT
    ===================================================== */
    const filteredAndSortedLandlords = landlords
        .filter((landlord) => {
            const search = searchTerm.toLowerCase();

            return (
                landlord.user_id?.toLowerCase().includes(search) ||
                landlord.email?.toLowerCase().includes(search) ||
                landlord.status?.toLowerCase().includes(search) ||
                String(landlord.is_verified).includes(search) ||
                (landlord.createdAt &&
                    new Date(landlord.createdAt)
                        .toLocaleDateString()
                        .includes(search)) ||
                (landlord.lastLoginAt &&
                    new Date(landlord.lastLoginAt)
                        .toLocaleDateString()
                        .includes(search))
            );
        })
        .sort((a, b) => {
            if (!sortConfig.key) return 0;

            const aVal = a[sortConfig.key];
            const bVal = b[sortConfig.key];

            if (!aVal && !bVal) return 0;
            if (!aVal) return 1;
            if (!bVal) return -1;

            if (aVal < bVal) {
                return sortConfig.direction === "asc" ? -1 : 1;
            }
            if (aVal > bVal) {
                return sortConfig.direction === "asc" ? 1 : -1;
            }
            return 0;
        });

    /* =====================================================
       STATUS BADGE
    ===================================================== */
    const renderStatusBadge = (status: string) => {
        switch (status) {
            case "active":
                return (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                        Active
                    </span>
                );
            case "suspended":
                return (
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                        Suspended
                    </span>
                );
            case "deactivated":
                return (
                    <span className="px-2 py-1 bg-gray-200 text-gray-800 rounded-full text-xs">
                        Deactivated
                    </span>
                );
            case "archived":
                return (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                        Archived
                    </span>
                );
            default:
                return (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                        Unknown
                    </span>
                );
        }
    };

    /* =====================================================
       GUARDS
    ===================================================== */
    if (loading) return <LoadingScreen />;
    if (error)
        return <p className="text-red-500 p-6">Error: {error}</p>;
    if (!admin)
        return (
            <p className="text-red-500 p-6">
                You need to log in to access the dashboard.
            </p>
        );

    /* =====================================================
        SCORECARDS
    ===================================================== */
    const scorecards = {
        total: landlords.length,
        active: landlords.filter((l) => l.status === "active").length,
        suspended: landlords.filter((l) => l.status === "suspended").length,
        verified: landlords.filter((l) => l.is_verified).length,
    };

    const ScoreCard = ({
        title,
        value,
        accent,
    }: {
        title: string;
        value: number;
        accent: "blue" | "green" | "red" | "yellow";
    }) => {
        const accentClasses = {
            blue: "bg-blue-50 border-blue-200 text-blue-700",
            green: "bg-green-50 border-green-200 text-green-700",
            red: "bg-red-50 border-red-200 text-red-700",
            yellow: "bg-yellow-50 border-yellow-200 text-yellow-700",
        };
        return (
            <div
                className={`rounded-lg border p-3 sm:p-4 ${accentClasses[accent]}`}
            >
                <p className="text-[10px] sm:text-xs opacity-70">{title}</p>
                <p className="text-xl sm:text-2xl font-bold">{value}</p>
            </div>
        );
    };

    /* =====================================================
        RENDER
    ===================================================== */
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="p-4 sm:p-6 max-w-7xl mx-auto">
                <h1 className="text-xl sm:text-2xl font-semibold text-blue-600 mb-4 sm:mb-6">
                    Landlords Management
                </h1>

                {/* Scorecards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
                    <ScoreCard title="Total" value={scorecards.total} accent="blue" />
                    <ScoreCard title="Active" value={scorecards.active} accent="green" />
                    <ScoreCard title="Suspended" value={scorecards.suspended} accent="red" />
                    <ScoreCard title="Verified" value={scorecards.verified} accent="yellow" />
                </div>

                {/* Search */}
                <div className="mb-4">
                    <TextField
                        label="Search landlords..."
                        variant="outlined"
                        fullWidth
                        size="small"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-white"
                    />
                </div>

                {/* Table - Mobile responsive */}
                <div className="overflow-x-auto bg-white rounded-lg shadow -mx-4 sm:mx-0">
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    {[
                                        { key: "index", label: "#" },
                                        { key: "user_id", label: "User ID" },
                                        { key: "email", label: "Email" },
                                        { key: "is_verified", label: "Verified" },
                                        { key: "actions", label: "" },
                                    ].map((col) => (
                                        <TableCell key={col.key} align="center">
                                            {col.key !== "actions" &&
                                            col.key !== "index" ? (
                                                <TableSortLabel
                                                    active={
                                                        sortConfig.key === col.key
                                                    }
                                                    direction={
                                                        sortConfig.key === col.key
                                                            ? sortConfig.direction
                                                            : "asc"
                                                    }
                                                    onClick={() =>
                                                        requestSort(col.key)
                                                    }
                                                >
                                                    {col.label}
                                                </TableSortLabel>
                                            ) : (
                                                col.label
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {filteredAndSortedLandlords.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center">
                                            No landlords found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredAndSortedLandlords.map(
                                        (landlord, index) => (
                                            <TableRow
                                                key={landlord.landlord_id}
                                                hover
                                            >
                                                <TableCell align="center">
                                                    {index + 1}
                                                </TableCell>

                                                <TableCell
                                                    align="center"
                                                    className="text-blue-600 cursor-pointer hover:underline whitespace-nowrap"
                                                    onClick={() =>
                                                        router.push(
                                                            `./viewProfile/landlord/${landlord.user_id}`
                                                        )
                                                    }
                                                >
                                                    {landlord.user_id}
                                                </TableCell>

                                                <TableCell align="center" className="whitespace-nowrap">
                                                    {landlord.email}
                                                </TableCell>


                                                <TableCell align="center">
                                                    {landlord.is_verified ? (
                                                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                                            Yes
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                                                            No
                                                        </span>
                                                    )}
                                                </TableCell>



                                                <TableCell align="center">
                                                    <div className="flex items-center justify-center gap-1 sm:gap-2">
                                                        <Button
                                                            variant="contained"
                                                            size="small"
                                                            onClick={() =>
                                                                router.push(
                                                                    `./viewProfile/landlord/${landlord.user_id}`
                                                                )
                                                            }
                                                            startIcon={
                                                                <Eye size={14} />
                                                            }
                                                            className="!text-xs !py-1 !px-2"
                                                        >
                                                            <span className="hidden sm:inline">View</span>
                                                        </Button>

                                                        {landlord.status ===
                                                            "active" && (
                                                                <Button
                                                                    variant="contained"
                                                                    color="secondary"
                                                                    size="small"
                                                                    onClick={() =>
                                                                        handleSuspend(
                                                                            landlord.user_id,
                                                                            landlord.email
                                                                        )
                                                                    }
                                                                    className="!text-xs !py-1 !px-2"
                                                                >
                                                                    <span className="hidden sm:inline">Suspend</span>
                                                                    <span className="sm:hidden">🚫</span>
                                                                </Button>
                                                            )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    )
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </div>
            </div>
        </div>
    );
}
