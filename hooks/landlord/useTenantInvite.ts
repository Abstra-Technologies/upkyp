/**
 * useTenantInvite Hook
 * 
 * Used by: app/landlord/invite-tenant/page.tsx
 * 
 * Provides functionality for inviting tenants to units with lease details.
 * - Fetches landlord properties
 * - Fetches units based on selected property
 * - Handles sending tenant invitations
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Swal from "sweetalert2";

import useAuthStore from "@/zustand/authStore";

interface Property {
    property_id: string;
    property_name: string;
}

interface Unit {
    unit_id: number;
    unit_name: string;
    status: string;
}

export function useTenantInvite() {
    const router = useRouter();
    const { user, fetchSession } = useAuthStore();

    const [properties, setProperties] = useState<Property[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [selectedProperty, setSelectedProperty] = useState("");
    const [selectedUnit, setSelectedUnit] = useState("");
    const [tenantEmail, setTenantEmail] = useState("");

    const [leaseStart, setLeaseStart] = useState("");
    const [leaseEnd, setLeaseEnd] = useState("");
    const [setDatesLater, setSetDatesLater] = useState(false);

    const [loading, setLoading] = useState(true);

    const landlordId = user?.landlord_id;

    useEffect(() => {
        if (!landlordId) {
            fetchSession();
            return;
        }

        const fetchProperties = async () => {
            setLoading(true);
            try {
                const res = await axios.get(
                    `/api/landlord/${landlordId}/properties`
                );
                setProperties(res.data.data || []);
            } catch (err) {
                console.error("Error fetching properties", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProperties();
    }, [landlordId, fetchSession]);

    useEffect(() => {
        if (!selectedProperty) {
            setUnits([]);
            setSelectedUnit("");
            return;
        }

        const fetchUnits = async () => {
            try {
                const res = await axios.get(
                    `/api/unitListing/getUnitListings?property_id=${selectedProperty}`
                );
                setUnits(res.data || []);
            } catch (err) {
                console.error("Error fetching units", err);
                setUnits([]);
            }
        };

        fetchUnits();
    }, [selectedProperty]);

    const handlePropertyChange = useCallback((propertyId: string) => {
        setSelectedProperty(propertyId);
        setSelectedUnit("");
    }, []);

    const handleSendInvite = useCallback(async () => {
        if (!tenantEmail || !selectedProperty || !selectedUnit) {
            Swal.fire("Missing Fields", "Please complete required fields.", "warning");
            return;
        }

        if (!setDatesLater && (!leaseStart || !leaseEnd)) {
            Swal.fire(
                "Lease Dates Required",
                "Provide lease dates or choose to set them later.",
                "warning"
            );
            return;
        }

        const property = properties.find(p => p.property_id === selectedProperty);
        const unit = units.find(u => u.unit_id === selectedUnit);

        try {
            Swal.fire({
                title: "Sending Invite...",
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading(),
            });

            const payload = {
                email: tenantEmail,
                unitId: selectedUnit,
                propertyName: property?.property_name,
                unitName: unit?.unit_name,

                startDate: setDatesLater ? null : leaseStart,
                endDate: setDatesLater ? null : leaseEnd,
                datesDeferred: setDatesLater,
            };

            const res = await axios.post("/api/invite", payload);
            Swal.close();

            if (res.data.success) {
                Swal.fire("Success", "Invitation sent!", "success");

                setTenantEmail("");
                setSelectedProperty("");
                setSelectedUnit("");
                setLeaseStart("");
                setLeaseEnd("");
                setSetDatesLater(false);
                setUnits([]);
            } else {
                throw new Error();
            }
        } catch (err) {
            Swal.fire("Error", "Failed to send invitation.", "error");
        }
    }, [tenantEmail, selectedProperty, selectedUnit, setDatesLater, leaseStart, leaseEnd, properties, units]);

    const handleDatesLaterToggle = useCallback((checked: boolean) => {
        setSetDatesLater(checked);
        if (checked) {
            setLeaseStart("");
            setLeaseEnd("");
        }
    }, []);

    return {
        loading,
        properties,
        units,
        selectedProperty,
        setSelectedProperty: handlePropertyChange,
        selectedUnit,
        setSelectedUnit,
        tenantEmail,
        setTenantEmail,
        leaseStart,
        setLeaseStart,
        leaseEnd,
        setLeaseEnd,
        setDatesLater,
        setDatesLaterValue,
        handleSendInvite,
    };
}