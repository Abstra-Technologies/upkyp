/**
 * useAnnouncementsList Hook
 * 
 * Used by: app/landlord/announcement/page.tsx
 * 
 * Provides functionality for the announcements list page.
 * - Fetches all announcements for the landlord
 * - Handles search and property filtering
 * - Checks subscription feature access for creating announcements
 */

"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

import useAuthStore from "@/zustand/authStore";
import useSubscription from "@/hooks/landlord/useSubscription";
import { subscriptionConfig } from "@/constant/subscription/limits";

interface Announcement {
    id: string | number;
    subject: string;
    description: string;
    property: string;
    created_at?: string;
}

export function useAnnouncementsList() {
    const router = useRouter();
    const { fetchSession, user } = useAuthStore();
    
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [selectedProperty, setSelectedProperty] = useState<string>("all");

    useEffect(() => {
        if (!user) {
            fetchSession();
        }
    }, [user, fetchSession]);

    const landlordId = user?.landlord_id;
    const { subscription, loadingSubscription } = useSubscription(landlordId);

    const planName = subscription?.plan_name;
    const canUseAnnouncements = useMemo(() => {
        return planName && subscriptionConfig[planName]?.features?.announcements === true;
    }, [planName]);

    useEffect(() => {
        async function fetchAnnouncements() {
            try {
                const response = await fetch(
                    `/api/landlord/announcement/getAllAnnouncements?landlord_id=${user?.landlord_id}`,
                );

                if (!response.ok) {
                    throw new Error("Failed to fetch announcements");
                }

                const data = await response.json();
                setAnnouncements(data);
            } catch (error) {
                console.error("Error fetching announcements:", error);
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "Unable to load announcements.",
                    confirmButtonColor: "#3b82f6",
                });
            } finally {
                setLoading(false);
            }
        }

        if (user?.landlord_id) {
            fetchAnnouncements();
        }
    }, [user]);

    const handleCreate = useCallback(() => {
        router.push(`/landlord/announcement/create-announcement`);
    }, [router]);

    const uniqueProperties = useMemo(() => {
        return [...new Set(announcements.map((ann) => ann.property))];
    }, [announcements]);

    const filteredAnnouncements = useMemo(() => {
        return announcements.filter((announcement) => {
            const matchesSearch =
                announcement.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                announcement.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesProperty =
                selectedProperty === "all" || announcement.property === selectedProperty;
            return matchesSearch && matchesProperty;
        });
    }, [announcements, searchTerm, selectedProperty]);

    const formatDate = (dateString?: string): string => {
        if (!dateString) return "No date";
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const clearFilters = useCallback(() => {
        setSearchTerm("");
        setSelectedProperty("all");
    }, []);

    return {
        loading,
        announcements,
        filteredAnnouncements,
        uniqueProperties,
        searchTerm,
        setSearchTerm,
        selectedProperty,
        setSelectedProperty,
        canUseAnnouncements,
        
        handleCreate,
        formatDate,
        clearFilters,
    };
}