"use client";

import { useState, useEffect, useCallback } from "react";
import useAuthStore from "@/zustand/authStore";
import { formatDateTime } from "@/lib/utils";
import Swal from "sweetalert2";

export type Invite = {
    code: string;
    propertyName: string;
    unitName: string;
    createdAt: string;
    expiresAt: string;
};

export function useTenantInvites() {
    const { user } = useAuthStore();

    const [invites, setInvites] = useState<Invite[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingCode, setProcessingCode] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchInvites = useCallback(async () => {
        if (!user?.email) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const res = await fetch(
                `/api/invite/getAllInvitation?email=${user.email}`
            );

            if (!res.ok) throw new Error("Failed to fetch invitations");

            const data = await res.json();
            setInvites(data.invites || []);
        } catch (err) {
            console.error(err);
            setError("Unable to load invitations.");
        } finally {
            setLoading(false);
        }
    }, [user?.email]);

    useEffect(() => {
        fetchInvites();
    }, [fetchInvites]);

    const acceptInvite = useCallback(async (code: string) => {
        if (!user?.user_id) return;

        setProcessingCode(code);

        try {
            Swal.fire({
                title: "Accepting Invitation…",
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading(),
            });

            const res = await fetch("/api/invite/accept", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    inviteCode: code,
                    userId: user.user_id,
                }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            Swal.fire("Success", "Invitation accepted!", "success");
            setInvites((prev) => prev.filter((i) => i.code !== code));
        } catch (err: any) {
            Swal.fire("Error", err.message || "Failed to accept invite.", "error");
        } finally {
            setProcessingCode(null);
        }
    }, [user?.user_id]);

    const rejectInvite = useCallback(async (code: string) => {
        const confirm = await Swal.fire({
            icon: "warning",
            title: "Reject Invitation?",
            text: "This unit will be released.",
            showCancelButton: true,
            confirmButtonText: "Reject",
            confirmButtonColor: "#ef4444",
        });

        if (!confirm.isConfirmed) return;

        setProcessingCode(code);

        try {
            Swal.fire({
                title: "Rejecting Invitation…",
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading(),
            });

            const res = await fetch("/api/invite/reject", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ inviteCode: code }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            Swal.fire("Rejected", "Invitation declined.", "success");
            setInvites((prev) => prev.filter((i) => i.code !== code));
        } catch (err: any) {
            Swal.fire("Error", err.message || "Failed to reject invite.", "error");
        } finally {
            setProcessingCode(null);
        }
    }, []);

    const refetch = useCallback(async () => {
        await fetchInvites();
    }, [fetchInvites]);

    return {
        invites,
        loading,
        error,
        processingCode,
        acceptInvite,
        rejectInvite,
        refetch,
        formatDateTime,
    };
}