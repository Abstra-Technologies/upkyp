"use client"; // make sure this is a client component

import React, { useEffect } from "react";
import SideNavProfile from "../../../../components/navigation/sidebar-profile";
import useAuthStore from "../../../../zustand/authStore";
import NotificationManager from "../../../../components/Commons/setttings/notification";
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

    const user_id = user?.user_id || admin?.user_id; // use user or admin

    return (
        <div className="flex flex-col md:flex-row min-h-screen">
            <div className="max-w-4xl mx-auto p-4">
                <h1 className="text-2xl font-bold mb-4">Other Settings</h1>
                {user_id && <NotificationManager user_id={user_id} />}
                < CookiePermissionStatus />
            </div>
        </div>
    );
};

export default UserSettingsPage;
