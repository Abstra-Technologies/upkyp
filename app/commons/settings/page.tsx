"use client";

import React, { useEffect } from "react";
import { Settings } from "lucide-react";
import useAuthStore from "@/zustand/authStore";
import NotificationManager from "@/components/Commons/setttings/notification";
import CookiePermissionStatus from "@/components/Commons/setttings/cookieStatus";

const UserSettingsPage = () => {
    const { user, admin, fetchSession, loading } = useAuthStore();

    useEffect(() => {
        if (!user && !admin) {
            fetchSession();
        }
    }, [user, admin, fetchSession]);

    if (loading || (!user && !admin)) {
        return <p>Loading...</p>;
    }

    const user_id = user?.user_id || admin?.user_id;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 md:px-6 lg:px-8 py-4 lg:py-6">
                <div className="flex items-center gap-3 lg:gap-4">
                    <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl lg:rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/25">
                        <Settings className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
                            Other Settings
                        </h1>
                        <p className="text-sm text-gray-500">
                            Manage notifications, cookies, and preferences.
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="px-4 md:px-6 lg:px-8 py-6 pb-24 lg:pb-8">
                <div className="max-w-5xl mx-auto space-y-4">
                    {user_id && <NotificationManager user_id={user_id} />}
                    <CookiePermissionStatus />
                </div>
            </div>
        </div>
    );
};

export default UserSettingsPage;
