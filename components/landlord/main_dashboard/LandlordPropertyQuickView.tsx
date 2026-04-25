"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  MapPin,
  Home,
  PlusCircle,
  Building2,
  AlertTriangle,
} from "lucide-react";
import Swal from "sweetalert2";

import usePropertyStore from "@/zustand/property/usePropertyStore";
import useSubscription from "@/hooks/landlord/useSubscription";
import {
  CUSTOM_SCROLLBAR,
} from "@/constant/design-constants";

interface Props {
  landlordId: number | undefined;
}

type VerificationStatus =
  | "approved"
  | "pending"
  | "rejected"
  | "not verified"
  | null;

export default function LandlordPropertyMarquee({ landlordId }: Props) {
  const router = useRouter();
  const { properties, loading, fetchAllProperties } = usePropertyStore();
  const { subscription, loadingSubscription } =
    useSubscription(landlordId);

  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus>(null);

  const monthLabel = new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" });

  /* =========================
          FETCH PROPERTIES
    ========================== */
  useEffect(() => {
    if (landlordId) fetchAllProperties(landlordId);
  }, [landlordId, fetchAllProperties]);

  /* =========================
          FETCH VERIFICATION STATUS
    ========================== */
  useEffect(() => {
    if (!landlordId) return;

    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/landlord/${landlordId}/profileStatus`);
        const data = await res.json();
        setVerificationStatus(data.status);
      } catch {
        setVerificationStatus("not verified");
      }
    };

    fetchStatus();
  }, [landlordId]);

  /* =========================
          DERIVED STATE
    ========================== */
  const isVerified = verificationStatus === "approved";
  const isPending = verificationStatus === "pending";
  const isRejected = verificationStatus === "rejected";

  const maxProperties = subscription?.limits?.maxProperties ?? null;
  const totalCount = properties?.length || 0;
  const isLimitReached = maxProperties !== null && totalCount >= maxProperties;

  const isAddDisabled = !isVerified || isLimitReached;

  /* =========================
          HANDLERS
    ========================== */
  const handleAddProperty = () => {
    if (!isVerified) {
      let title = "Account Not Verified";
      let message = "You must verify your account before adding properties.";
      let action = "Go to Verification";

      if (isPending) {
        title = "Verification Pending";
        message = "Your verification is currently under review.";
        action = "View Status";
      }

      if (isRejected) {
        title = "Verification Rejected";
        message = "Your verification was rejected. Please resubmit documents.";
        action = "Resubmit Verification";
      }

      Swal.fire({
        icon: "warning",
        title,
        html: `<p class="text-gray-600">${message}</p>`,
        confirmButtonText: action,
        showCancelButton: true,
        confirmButtonColor: "#2563eb",
      }).then((res) => {
        if (res.isConfirmed) {
          router.push("/landlord/verification");
        }
      });

      return;
    }

    if (isLimitReached) {
      Swal.fire({
        icon: "warning",
        title: "Property Limit Reached",
        html: `<p class="text-gray-600">
          You've reached your plan limit of <strong>${maxProperties}</strong> properties.
        </p>`,
        confirmButtonText: "Upgrade Plan",
        showCancelButton: true,
      }).then((res) => {
        if (res.isConfirmed) {
          router.push("/landlord/subscription");
        }
      });

      return;
    }

    router.push("/landlord/properties/create-property");
  };

  /* =========================
          LOADING STATE
    ========================== */
  if (loading || loadingSubscription) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-full animate-pulse">
        <div className="mb-4">
          <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
          <div className="h-2 bg-gray-200 rounded w-24" />
        </div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  /* =========================
          EMPTY STATE
    ========================== */
  if (!properties || properties.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-full flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
          <Building2 className="w-8 h-8 text-white" />
        </div>

        <h3 className="text-base font-bold text-gray-900 mb-2">No Properties Yet</h3>

        <p className="text-sm text-gray-500 mb-6 max-w-xs">
          Add your first property to start managing units and tenants.
        </p>

        <button
          onClick={handleAddProperty}
          disabled={isAddDisabled}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm
                        shadow-md hover:shadow-lg
                        transition-all duration-300
                        ${
                          isAddDisabled
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-gradient-to-r from-blue-600 to-emerald-600 text-white hover:scale-105 active:scale-95"
                        }`}
        >
          {!isVerified ? (
            <>
              <AlertTriangle className="w-5 h-5" />
              Verify Account
            </>
          ) : (
            <>
              <PlusCircle className="w-5 h-5" />
              Add Property
            </>
          )}
        </button>
      </div>
    );
  }

  /* =========================
          NORMAL STATE
    ========================== */
  const limitedProperties = properties.slice(0, 5);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-full flex flex-col hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Your Properties</h2>
          <p className="text-xs text-gray-500">{monthLabel}</p>
        </div>

        {subscription && (
          <span
            className={`text-xs font-bold px-3 py-1.5 rounded-full
                            ${
                              isLimitReached
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
          >
            {totalCount} / {maxProperties ?? "∞"}
          </span>
        )}
      </div>

      {/* Add Property Button */}
      <button
        onClick={handleAddProperty}
        disabled={isAddDisabled}
        className={`w-full flex items-center justify-center gap-2 
                    py-3 rounded-xl font-bold text-sm mb-3
                    shadow-md hover:shadow-lg
                    transition-all duration-300
                    ${
                      isAddDisabled
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-600 to-emerald-600 text-white hover:scale-[1.02] active:scale-95"
                    }`}
      >
        <PlusCircle className="w-4 h-4" />
        Add New Property
      </button>

      {/* Property List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {limitedProperties.map((property) => (
          <div
            key={property.property_id}
            onClick={() =>
              router.push(`/landlord/properties/${property.property_id}`)
            }
            className="p-3 flex items-center gap-3 cursor-pointer
                            bg-gray-50 rounded-xl border border-gray-100
                            transition-all duration-200
                            hover:-translate-y-[1px] hover:shadow-md hover:ring-blue-200 hover:border-blue-200"
          >
            {/* Property Image */}
            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
              {property.photos?.[0]?.photo_url ? (
                <Image
                  src={property.photos[0].photo_url}
                  alt={property.property_name}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Home className="w-5 h-5" />
                </div>
              )}
            </div>

            {/* Property Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-gray-900 truncate mb-0.5">
                {property.property_name}
              </h3>
              <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 text-blue-500 flex-shrink-0" />
                {[property.street, property.city, property.province]
                  .filter(Boolean)
                  .join(", ") || "Address not specified"}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* View All Button */}
      {properties.length > 5 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <button
            onClick={() => router.push("/landlord/properties")}
            className="w-full text-sm font-semibold text-blue-600 
                            py-2 rounded-lg flex items-center justify-center gap-1
                            hover:bg-blue-50 transition-colors duration-200"
          >
            View All Properties ({properties.length})
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
