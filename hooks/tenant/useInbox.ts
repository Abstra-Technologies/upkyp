"use client";

import { useState, useEffect, useCallback } from "react";
import useAuthStore from "@/zustand/authStore";

export interface Notification {
    id: string;
    title: string;
    body: string;
    type: "urgent" | "success" | "info" | "default";
    is_read: boolean;
    created_at: string;
    timestamp?: string;
}

export interface Announcement {
    id: number;
    subject: string;
    description: string;
    property_name: string;
    unit_name: string;
    created_at: string;
    photos?: string[];
    landlord?: {
        firstName: string;
        lastName: string;
        profilePicture: string;
    };
}

export function useInbox() {
    const { user } = useAuthStore();

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    const fetchData = useCallback(async (showLoading = true) => {
        if (!user || !user.user_id) {
            setError("User not authenticated");
            setIsLoading(false);
            return;
        }

        if (showLoading) setIsLoading(true);
        setError(null);

        try {
            const notifResponse = await fetch(
                `/api/notification/getNotifications?userId=${user.user_id}`
            );
            if (!notifResponse.ok) throw new Error("Failed to fetch notifications");
            const notifData = await notifResponse.json();
            const sortedNotifications = (
                Array.isArray(notifData) ? notifData : []
            ).sort(
                (a, b) =>
                    new Date(b.created_at || b.timestamp).getTime() -
                    new Date(a.created_at || a.timestamp).getTime()
            );
            setNotifications(sortedNotifications);

            if (user.tenant_id) {
                const announcementResponse = await fetch(
                    `/api/tenant/activeRent/announcement?tenant_id=${user.tenant_id}`
                );
                if (!announcementResponse.ok)
                    throw new Error("Failed to fetch announcements");
                const announcementData = await announcementResponse.json();
                setAnnouncements(announcementData.announcements || []);
            }
        } catch (err) {
            console.error("Error fetching data:", err);
            setError("Failed to load data");
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filter]);

    const markAsRead = useCallback(async (id: string) => {
        try {
            const response = await fetch("/api/notification/markSingleRead", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });

            if (!response.ok) throw new Error("Failed to mark as read");

            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
            );
        } catch (err) {
            console.error("Error:", err);
        }
    }, []);

    const markAllAsRead = useCallback(async () => {
        const unreadNotifications = notifications.filter((n) => !n.is_read);
        if (unreadNotifications.length === 0) return;

        try {
            const response = await fetch("/api/notification/markAllAsRead", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ids: unreadNotifications.map((n) => n.id),
                }),
            });

            if (!response.ok) throw new Error("Failed to mark all as read");

            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        } catch (err) {
            console.error("Error:", err);
        }
    }, [notifications]);

    const deleteNotification = useCallback(async (id: string) => {
        try {
            const response = await fetch(`/api/notification/delete/${id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                setNotifications((prev) => prev.filter((n) => n.id !== id));
            }
        } catch (err) {
            console.error("Error:", err);
        }
    }, []);

    const filteredNotifications =
        filter === "unread"
            ? notifications.filter((n) => !n.is_read)
            : filter === "read"
            ? notifications.filter((n) => n.is_read)
            : notifications;

    const combinedItems = [...filteredNotifications, ...announcements].sort(
        (a, b) =>
            new Date(b.created_at || (b as any).timestamp).getTime() -
            new Date(a.created_at || (a as any).timestamp).getTime()
    );

    const totalPages = Math.ceil(combinedItems.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = combinedItems.slice(startIndex, endIndex);

    const unreadCount = notifications.filter((n) => !n.is_read).length;

    return {
        notifications,
        announcements,
        combinedItems,
        isLoading,
        error,
        filter,
        setFilter,
        currentPage,
        setCurrentPage,
        paginatedItems,
        totalPages,
        unreadCount,
        itemsPerPage,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        fetchData,
    };
}