"use client";

import { useState, useEffect } from "react";
import useAuthStore from "@/zustand/authStore";

export function useFeeds() {
    const { user, fetchSession } = useAuthStore();
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    useEffect(() => {
        async function loadAuth() {
            if (!user) {
                await fetchSession();
            }
            setIsInitialLoad(false);
        }
        loadAuth();
    }, [user, fetchSession]);

    return {
        user,
        isInitialLoad,
    };
}