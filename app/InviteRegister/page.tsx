'use client';

import useAuthStore from '@/zustand/authStore';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

function TenantInviteJoinPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const inviteCode = searchParams.get('invite');

    const { user, loading } = useAuthStore();

    const [inviteDetails, setInviteDetails] = useState<any>(null);
    const [expired, setExpired] = useState(false);
    const [loadingInvite, setLoadingInvite] = useState(true);

    useEffect(() => {
        async function fetchInviteDetails() {
            try {
                const res = await fetch(`/api/invite/${inviteCode}`);
                if (!res.ok) throw new Error();
                const data = await res.json();
                setInviteDetails(data.invite);
            } catch {
                setExpired(true);
            } finally {
                setLoadingInvite(false);
            }
        }

        if (inviteCode) fetchInviteDetails();
    }, [inviteCode]);

    /* --------------------------------------------------
       LOGIN REDIRECT (if not authenticated)
    -------------------------------------------------- */
    const handleLoginRedirect = () => {
        const callback = `/pages/InviteRegister?invite=${inviteCode}`;
        router.push(`/login?callback=${encodeURIComponent(callback)}`);
    };

    /* --------------------------------------------------
       ACCEPT INVITE (authenticated users only)
    -------------------------------------------------- */
    const handleJoin = async () => {
        if (!user) return;

        try {
            const res = await fetch('/api/invite/accept', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    inviteCode,
                    userId: user.user_id,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                router.push('/pages/tenant/my-unit');
            } else {
                alert(data.error || 'Failed to join unit.');
            }
        } catch (error) {
            console.error('Join failed:', error);
            alert('An error occurred while joining the unit.');
        }
    };

    /* --------------------------------------------------
       LOADING STATE
    -------------------------------------------------- */
    if (loading || loadingInvite) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-emerald-50">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
        );
    }

    /* --------------------------------------------------
       EXPIRED INVITE
    -------------------------------------------------- */
    if (expired || !inviteDetails) {
        return (
            <div className="min-h-screen flex items-center justify-center text-red-600">
                Invite link is invalid or has expired.
            </div>
        );
    }

    /* --------------------------------------------------
       MAIN UI
    -------------------------------------------------- */
    return (
        <div
            className="min-h-screen flex items-center justify-center relative"
            style={{
                backgroundImage: `url(${inviteDetails.property_photo || "/placeholder.jpg"})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
            }}
        >
            <div className="absolute inset-0 bg-black/70" />

            <div className="relative z-10 bg-white/90 backdrop-blur-md rounded-3xl p-8 max-w-md w-[90%] text-center shadow-2xl">
                <h1 className="text-2xl font-extrabold mb-2">You’re Invited 🎉</h1>

                <p className="text-gray-600 mb-6">
                    Join your new rental unit and manage your lease, payments, and updates.
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
                    <p className="font-semibold text-blue-800">
                        {inviteDetails.property_name}
                    </p>
                    <p className="text-lg font-bold text-emerald-600 mt-1">
                        Unit {inviteDetails.unit_name}
                    </p>
                </div>

                {/* 🔐 AUTH CONDITIONAL CTA */}
                {!user ? (
                    <>
                        <p className="text-sm text-gray-600 mb-4">
                            Please log in or create an account to accept this invitation.
                        </p>

                        <button
                            onClick={handleLoginRedirect}
                            className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 text-white py-3 rounded-xl font-semibold"
                        >
                            Login / Register to Continue
                        </button>
                    </>
                ) : (
                    <button
                        onClick={handleJoin}
                        className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 text-white py-3 rounded-xl font-semibold"
                    >
                        Accept Invitation & Join Unit
                    </button>
                )}
            </div>
        </div>
    );
}

export default function InviteRegisterPage() {
    return (
        <Suspense fallback={<div className="p-4 text-center">Loading invite…</div>}>
            <TenantInviteJoinPage />
        </Suspense>
    );
}
