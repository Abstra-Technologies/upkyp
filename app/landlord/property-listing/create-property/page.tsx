"use client";

import React, { useEffect, useState } from "react";
import {
    X,
    Check,
    Loader2,
    Building2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import axios from "axios";

import useAuthStore from "@/zustand/authStore";
import usePropertyStore from "@/zustand/property/usePropertyStore";
import useSubscription from "@/hooks/landlord/useSubscription";
import StepOneCreateProperty from "@/components/landlord/createProperty/StepOnePropertyDetails";

export default function AddNewProperty() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);

    const { fetchSession, user } = useAuthStore();
    const { subscription, loadingSubscription } = useSubscription(
        user?.landlord_id
    );

    const { property, photos, reset } = usePropertyStore();

    /* ================= SESSION ================= */
    useEffect(() => {
        if (!user) fetchSession();
    }, [user, fetchSession]);

    /* ================= SUBSCRIPTION CHECK ================= */
    useEffect(() => {
        if (loadingSubscription || !user?.landlord_id || !subscription) return;

        if (subscription.is_active !== 1) {
            Swal.fire({
                title: "Subscription Required",
                text: "You need an active subscription to add a property.",
                icon: "info",
                confirmButtonText: "Go Back",
            }).then(() => {
                router.replace("/pages/landlord/property-listing");
            });
        }
    }, [subscription, loadingSubscription, user, router]);

    /* ================= VALIDATION ================= */
    const validate = () => {
        if (
            !property.propertyName?.trim() ||
            !property.propertyType ||
            !property.street?.trim() ||
            !property.city?.trim() ||
            !property.province?.trim() ||
            !property.zipCode ||
            !property.waterBillingType ||
            !property.electricityBillingType
        ) {
            Swal.fire(
                "Missing Required Fields",
                "Please complete all required property details.",
                "warning"
            );
            return false;
        }


        return true;
    };

    /* ================= CANCEL ================= */
    const handleCancel = () => {
        Swal.fire({
            title: "Cancel Property Setup?",
            text: "All progress will be lost.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            confirmButtonText: "Yes, cancel",
        }).then((result) => {
            if (result.isConfirmed) {
                reset();
                router.replace("/pages/landlord/property-listing");
            }
        });
    };

    /* ================= SUBMIT ================= */
    const handleSubmit = async () => {
        if (!validate()) return;

        setSubmitting(true);

        try {
            const formData = new FormData();

            const normalizedProperty = {
                ...property,
                floorArea: property.floorArea ?? null,
                propDesc: property.propDesc?.trim() || null,
            };

            formData.append("landlord_id", String(user.landlord_id));
            formData.append("property", JSON.stringify(normalizedProperty));

            photos?.forEach((p) => formData.append("photos", p.file));

            await axios.post(
                "/api/propertyListing/createFullProperty",
                formData
            );

            Swal.fire(
                "Success!",
                "Property submitted successfully!",
                "success"
            ).then(() => {
                reset();
                router.replace("/pages/landlord/property-listing");
            });

        } catch (error: any) {
            Swal.fire(
                "Error",
                error?.response?.data?.message || "Failed to submit property.",
                "error"
            );
        } finally {
            setSubmitting(false);
        }
    };

    /* ================= RENDER ================= */
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-emerald-50/30 pb-28 sm:pb-8">
            <div className="px-3 sm:px-6 pt-20 sm:pt-6 max-w-6xl mx-auto">

                {/* HEADER */}
                <div className="flex gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                        <Building2 className="w-6 h-6 text-white" />
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Add New Property
                        </h1>
                        <p className="text-sm text-gray-600">
                            Fill in the details to create your listing
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 mb-6">
                    <div className="p-6">
                        <StepOneCreateProperty />
                    </div>
                </div>

                {/* FOOTER */}
                <div className="fixed bottom-0 left-0 right-0 sm:static bg-white border-t sm:border rounded-t-2xl sm:rounded-2xl shadow-lg p-4 flex justify-between items-center">

                    <button
                        disabled={submitting}
                        onClick={handleCancel}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-medium"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                <Check className="w-4 h-4 inline mr-2" />
                                Submit Listing
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}