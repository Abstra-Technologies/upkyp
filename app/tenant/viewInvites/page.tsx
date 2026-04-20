"use client";

import { useRouter } from "next/navigation";
import LoadingScreen from "@/components/loadingScreen";

import {
    EnvelopeIcon,
    HomeIcon,
    MapPinIcon,
    CalendarIcon,
    ArrowLeftIcon,
    CheckCircleIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";

import { useTenantInvites } from "@/hooks/tenant/useTenantInvites";

function InfoBlock({
    icon,
    label,
    value,
    mono,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    mono?: boolean;
}) {
    return (
        <div className="flex items-start gap-3 bg-gray-50 rounded-lg p-3 border">
            <div className="text-gray-500 w-5 h-5">{icon}</div>
            <div className="min-w-0">
                <p className="text-xs uppercase font-semibold text-gray-500">
                    {label}
                </p>
                <p
                    className={`text-sm font-semibold truncate ${
                        mono ? "font-mono" : ""
                    }`}
                >
                    {value}
                </p>
            </div>
        </div>
    );
}

export default function TenantInvitesPage() {
    const router = useRouter();
    const {
        invites,
        loading,
        error,
        processingCode,
        acceptInvite,
        rejectInvite,
        formatDateTime,
    } = useTenantInvites();

    if (loading) {
        return <LoadingScreen message="Loading invitations…" />;
    }

    return (
        <div className="min-h-screen bg-gray-50 px-4 py-6">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-lg bg-white border hover:bg-gray-50"
                    >
                        <ArrowLeftIcon className="w-5 h-5" />
                    </button>

                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold">
                            Property Invitations
                        </h1>
                        <p className="text-sm text-gray-500">
                            Review and manage your invitations
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                        {error}
                    </div>
                )}

                {!error && invites.length === 0 && (
                    <div className="bg-white border rounded-xl p-8 text-center">
                        <EnvelopeIcon className="w-10 h-10 mx-auto text-gray-400 mb-3" />
                        <h3 className="font-semibold mb-1">No Invitations</h3>
                        <p className="text-sm text-gray-500">
                            You don't have any pending invites.
                        </p>
                    </div>
                )}

                <div className="space-y-4">
                    {invites.map((invite) => (
                        <div
                            key={invite.code}
                            className="bg-white border rounded-xl p-4 shadow-sm"
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                <InfoBlock
                                    icon={<HomeIcon />}
                                    label="Property"
                                    value={invite.propertyName}
                                />
                                <InfoBlock
                                    icon={<MapPinIcon />}
                                    label="Unit"
                                    value={invite.unitName}
                                />
                                <InfoBlock
                                    icon={<CalendarIcon />}
                                    label="Sent On"
                                    value={formatDateTime(invite.createdAt)}
                                />
                                <InfoBlock
                                    icon={<CalendarIcon />}
                                    label="Expires"
                                    value={formatDateTime(invite.expiresAt)}
                                />
                                <InfoBlock
                                    icon={<EnvelopeIcon />}
                                    label="Code"
                                    value={invite.code}
                                    mono
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <button
                                    onClick={() => acceptInvite(invite.code)}
                                    disabled={processingCode === invite.code}
                                    className="flex items-center justify-center gap-2 py-3 rounded-lg
                    bg-gradient-to-r from-blue-600 to-emerald-600 text-white
                    font-semibold disabled:opacity-50"
                                >
                                    <CheckCircleIcon className="w-5 h-5" />
                                    Accept
                                </button>

                                <button
                                    onClick={() => rejectInvite(invite.code)}
                                    disabled={processingCode === invite.code}
                                    className="flex items-center justify-center gap-2 py-3 rounded-lg
                    border border-red-300 text-red-600 hover:bg-red-50
                    font-semibold disabled:opacity-50"
                                >
                                    <XMarkIcon className="w-5 h-5" />
                                    Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}