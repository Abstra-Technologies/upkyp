"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, Loader2, CheckCircle } from "lucide-react";
import Swal from "sweetalert2";

import useAuthStore from "@/zustand/authStore";
import usePropertyStore from "@/zustand/property/usePropertyStore";
import StepOneCreateProperty from "@/components/landlord/createProperty/StepOnePropertyDetails";
import { GRADIENT_PRIMARY } from "@/constant/design-constants";

export default function CreatePropertyPage() {
    const router = useRouter();
    const { user, fetchSession } = useAuthStore();
    const { property, photos, reset } = usePropertyStore();

    const [submitting, setSubmitting] = useState(false);
    const [step, setStep] = useState<"form" | "success">("form");
    const [createdPropertyId, setCreatedPropertyId] = useState<string | null>(null);

    useEffect(() => {
        if (!user) {
            fetchSession();
        }
    }, [user, fetchSession]);

    const validate = (): boolean => {
        if (!property.propertyName?.trim()) {
            Swal.fire("Required", "Please enter a property name.", "warning");
            return false;
        }
        if (!property.propertyType) {
            Swal.fire("Required", "Please select a property type.", "warning");
            return false;
        }
        if (!property.city?.trim()) {
            Swal.fire("Required", "Please set the property location using the map.", "warning");
            return false;
        }
        if (!property.waterBillingType) {
            Swal.fire("Required", "Please select a water billing type.", "warning");
            return false;
        }
        if (!property.electricityBillingType) {
            Swal.fire("Required", "Please select an electricity billing type.", "warning");
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        if (!user?.landlord_id) {
            Swal.fire("Error", "Landlord profile not found.", "error");
            return;
        }

        setSubmitting(true);

        try {
            const formData = new FormData();
            formData.append("landlord_id", user.landlord_id);
            formData.append("property", JSON.stringify(property));

            for (const photo of photos) {
                formData.append("photos", photo.file);
            }

            const res = await fetch("/api/propertyListing/createFullProperty", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to create property");
            }

            setCreatedPropertyId(data.propertyId);
            setStep("success");
            reset();
        } catch (err: any) {
            Swal.fire("Error", err.message || "Something went wrong.", "error");
        } finally {
            setSubmitting(false);
        }
    };

    if (step === "success") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-emerald-50/30 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-10 h-10 text-emerald-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Property Created!</h2>
                    <p className="text-sm text-gray-600 mb-6">
                        Your property has been successfully added. You can now manage units and settings.
                    </p>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => router.push(`/landlord/properties/${createdPropertyId}`)}
                            className={`w-full py-3 ${GRADIENT_PRIMARY} text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all`}
                        >
                            View Property
                        </button>
                        <button
                            onClick={() => {
                                setStep("form");
                                setCreatedPropertyId(null);
                            }}
                            className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-all"
                        >
                            Add Another Property
                        </button>
                        <button
                            onClick={() => router.push("/landlord/properties")}
                            className="w-full py-3 text-gray-500 rounded-xl font-medium text-sm hover:text-gray-700 transition-all"
                        >
                            Back to Properties
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-emerald-50/30">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                    <button
                        onClick={() => router.push("/landlord/properties")}
                        className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>
                    <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 ${GRADIENT_PRIMARY} rounded-lg flex items-center justify-center`}>
                            <Building2 className="w-4 h-4 text-white" />
                        </div>
                        <h1 className="text-base font-bold text-gray-900">Add Property</h1>
                    </div>
                    <div className="w-16" />
                </div>
            </div>

            {/* Form */}
            <div className="max-w-4xl mx-auto px-4 py-6">
                <StepOneCreateProperty />

                {/* Submit */}
                <div className="sticky bottom-4 mt-8 bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200 p-4">
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className={`w-full py-3.5 ${GRADIENT_PRIMARY} text-white rounded-xl font-bold text-base hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Creating Property...</span>
                            </>
                        ) : (
                            "Create Property"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
