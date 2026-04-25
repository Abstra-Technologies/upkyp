"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import Swal from "sweetalert2";
import useEditPropertyStore from "@/zustand/property/useEditPropertyStore";
import useAuthStore from "@/zustand/authStore";
import EditPropertyForm from "@/components/landlord/properties/editProperty/EditPropertyForm";
import { Loader2 } from "lucide-react";
import PropertyPayoutAssignment from "@/components/landlord/finance_accounting/PropertyBankAssignment";

export default function EditProperty() {
    const router = useRouter();
    const params = useParams();
    const propertyId = params?.id;

    const { fetchSession, user, admin } = useAuthStore();
    const store = useEditPropertyStore();

    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);

    useEffect(() => {
        if (!user && !admin) fetchSession();
    }, [user, admin]);


    useEffect(() => {
        if (!propertyId) return;

        store.reset();
        store.setPropertyId(propertyId);

        const fetchData = async () => {
            try {
                const [propRes, photoRes] = await Promise.all([
                    axios.get(`/api/propertyListing/editProperty?property_id=${propertyId}`),
                    axios.get(`/api/propertyListing/propertyPhotos?property_id=${propertyId}`)
                ]);

                if (!propRes.data.length) {
                    await Swal.fire("Not Found", "Property does not exist.", "warning");
                    return router.push("/landlord/properties");
                }

                const propertyData = propRes.data[0];

                store.setFullProperty(propertyData);

                // PHOTOS
                const mapped = photoRes.data.map((p: any) => ({
                    file: null,
                    preview: p.photo_url,
                    photo_id: p.photo_id,
                    isNew: false,
                }));

                store.setPhotos(mapped);

            } catch (err) {
                console.error(err);
                await Swal.fire("Error", "Failed to load property.", "error");
            } finally {
                setDataLoading(false);
            }
        };
        fetchData();
    }, [propertyId]);

    const handleSubmit = async () => {
        const { property, photos } = useEditPropertyStore.getState();

        if (!property.propertyName || !property.city) {
            return Swal.fire("Missing fields", "Complete required fields", "warning");
        }

        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("data", JSON.stringify(property));

            photos
                .filter((p) => p.isNew && p.file)
                .forEach((p) => formData.append("files", p.file));

            await axios.put(
                `/api/propertyListing/updatePropertyDetails?property_id=${propertyId}`,
                formData
            );

            Swal.fire("Updated!", "Property updated successfully.", "success")
                .then(() => router.replace(`/landlord/properties/${propertyId}/editPropertyDetails?id=${propertyId}`));
        } catch (error) {
            console.error(error);
            Swal.fire("Error", "Update failed", "error");
        }

        setLoading(false);
    };

    if (dataLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin w-8 h-8" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24">

            <div className="px-4 pt-4 pb-2">
                <h1 className="text-xl font-bold">Edit Property</h1>
                <p className="text-sm text-gray-500">
                    Update your property details
                </p>
            </div>

            <div className="px-3 mb-4">
                <PropertyPayoutAssignment propertyId={propertyId} />
            </div>

            {/* FORM */}
            <div className="px-3">
                <EditPropertyForm />
            </div>

            {/* STICKY ACTION BAR */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-3 flex justify-between items-center z-50">
                <button
                    onClick={() => router.back()}
                    className="text-sm text-gray-600"
                >
                    Cancel
                </button>

                <button
                    onClick={handleSubmit}
                    className="px-5 py-2 bg-blue-600 text-white rounded-lg"
                >
                    {loading ? "Saving..." : "Save Changes"}
                </button>
            </div>
        </div>
    );
}