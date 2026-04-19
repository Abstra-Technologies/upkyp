/**
 * useBillingPropertyList Hook
 * 
 * Used by: app/landlord/billing/page.js
 * 
 * Provides functionality for the billing property list page.
 * - Fetches properties with units for billing management
 * - Handles search and filtering
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import axios from "axios";

import useAuthStore from "@/zustand/authStore";

interface PropertyUnit {
    unit_id: number;
    unit_name: string;
    status: string;
}

interface Property {
    property_id: string;
    property_name: string;
    city: string;
    province: string;
    status: string;
    units: PropertyUnit[];
}

export function useBillingPropertyList() {
    const { user } = useAuthStore();
    
    const [properties, setProperties] = useState<Property[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProperties = async () => {
            setLoading(true);
            try {
                const response = await axios.get(
                    `/api/landlord/billing/getPropertyUnits?landlordId=${user?.landlord_id}`
                );
                if (Array.isArray(response.data)) {
                    setProperties(response.data);
                } else {
                    console.error("Invalid API response:", response.data);
                    setProperties([]); 
                }
            } catch (error) {
                console.error("Error fetching properties:", error);
                setProperties([]);
            } finally {
                setLoading(false);
            }
        };

        if (user?.landlord_id) {
            fetchProperties();
        }
    }, [user?.landlord_id]);

    const filteredProperties = useMemo(() => {
        return properties.filter(
            (property) =>
                property.property_name &&
                property.property_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
                (filterStatus === "all" || property.status === filterStatus)
        );
    }, [properties, searchTerm, filterStatus]);

    const formatProvince = (province: string): string => {
        return province
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    };

    return {
        loading,
        properties,
        filteredProperties,
        searchTerm,
        setSearchTerm,
        filterStatus,
        setFilterStatus,
        formatProvince,
    };
}