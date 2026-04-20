"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import axios from "axios";

interface Props {
    user_id: string;
    userType: "tenant" | "landlord";
}

export default function DeleteAccountButton({ user_id, userType }: Props) {
    const router = useRouter();
    const [deleting, setDeleting] = useState(false);

    const handleDeleteAccount = async () => {
        try {
            setDeleting(true);

            await axios.delete("/api/auth/deleteAccount", {
                data: { user_id, userType },
                withCredentials: true,
                headers: {
                    "Content-Type": "application/json",
                },
            });

            await Swal.fire({
                icon: "success",
                title: "Account Deactivated",
                text: "Your account has been successfully deactivated.",
                confirmButtonColor: "#10b981",
            });

            router.push("/auth/login");
            window.location.reload();
        } catch (error: any) {
            console.error("Account deletion failed:", error);

            await Swal.fire({
                icon: "error",
                title: "Deletion Failed",
                text:
                    error?.response?.data?.error ||
                    "You cannot deactivate your account because you still have active leases.",
                confirmButtonColor: "#ef4444",
            });
        } finally {
            setDeleting(false);
        }
    };

    const confirmDelete = async () => {
        const result = await Swal.fire({
            title: "Are you sure?",
            text:
                userType === "landlord"
                    ? "You cannot deactivate your account if you still have active leases."
                    : "This action is irreversible once completed.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Yes, deactivate my account",
            cancelButtonText: "Cancel",
        });

        if (result.isConfirmed) {
            handleDeleteAccount();
        }
    };

    return (
        <div className="flex flex-col items-center">
            <button
                onClick={confirmDelete}
                disabled={deleting}
                className={`px-4 py-2 rounded-md text-white transition
          ${
                    deleting
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-red-600 hover:bg-red-700"
                }`}
            >
                {deleting ? "Processing..." : "Delete Account"}
            </button>
        </div>
    );
}
