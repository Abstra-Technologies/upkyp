"use client";

import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Swal from "sweetalert2";
import {
  Eye,
  Users,
  MoreVertical,
  MessageCircle,
  Archive,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import useAuthStore from "@/zustand/authStore";
import {
  CardSkeleton,
  TableSkeleton,
} from "@/components/Commons/SkeletonLoaders";

/* =====================================================
   TYPES
===================================================== */
type TenantStatus = "pending" | "approved" | "disapproved";

interface Tenant {
  id: number;
  tenant_id: number;
  unit_id: number;
  user_id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  profilePicture?: string;
  unit_name?: string;
  status: TenantStatus;
}

/* =====================================================
   PAGE
===================================================== */
export default function InterestedTenants({
  propertyId,
}: {
  propertyId: number;
}) {
  const router = useRouter();
  const { fetchSession, user } = useAuthStore();

  const [tab, setTab] = useState<"active" | "archived">("active");
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  /* =====================================================
       SESSION
    ===================================================== */
  useEffect(() => {
    if (!user) fetchSession();
  }, [user, fetchSession]);

  /* =====================================================
       FETCH
    ===================================================== */
  const fetchTenants = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `/api/landlord/prospective/interestedTenants?propertyId=${propertyId}`,
      );
      setTenants(res.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to load tenants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (propertyId) fetchTenants();
  }, [propertyId]);

  /* =====================================================
       CLOSE MENU ON OUTSIDE CLICK
    ===================================================== */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      // Close dropdown when clicking outside
      const target = e.target as HTMLElement;
      if (!target.closest(".action-menu-container")) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* =====================================================
       ACTIONS
    ===================================================== */
  const handleView = (t: Tenant) => {
    router.push(
      `/landlord/properties/${propertyId}/prospectives/details?tenant_id=${t.tenant_id}&unit_id=${t.unit_id}`,
    );
  };

  const updateStatus = async (t: Tenant, status: TenantStatus) => {
    await axios.put("/api/landlord/prospective/updateStatus", {
      id: t.id,
      status,
    });
    fetchTenants();
  };

  const archiveTenant = async (t: Tenant) => {
    const res = await Swal.fire({
      title: "Remove from list?",
      text: "This will move the applicant to Archived.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Remove",
    });

    if (!res.isConfirmed) return;

    await axios.put("/api/landlord/prospective/archive", { id: t.id });
    fetchTenants();
  };

  /* =====================================================
       FILTER BY TAB
    ===================================================== */
  const filteredTenants = tenants.filter((t) =>
    tab === "active" ? t.status !== "disapproved" : t.status === "disapproved",
  );

  /* =====================================================
       UI HELPERS
    ===================================================== */
  const statusBadge = (status: TenantStatus) => {
    const base =
      "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full border";
    if (status === "approved")
      return (
        <span
          className={`${base} bg-emerald-50 text-emerald-700 border-emerald-200`}
        >
          <CheckCircle className="w-3 h-3" /> Approved
        </span>
      );
    if (status === "disapproved")
      return (
        <span className={`${base} bg-red-50 text-red-700 border-red-200`}>
          <XCircle className="w-3 h-3" /> Archived
        </span>
      );
    return (
      <span className={`${base} bg-amber-50 text-amber-700 border-amber-200`}>
        <Clock className="w-3 h-3" /> Pending
      </span>
    );
  };

  /* =====================================================
       LOADING & ERROR STATES
    ===================================================== */
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        {/* HEADER SKELETON */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-6 bg-gray-200 rounded w-48 animate-pulse" />
            <div className="h-4 bg-gray-100 rounded w-32 animate-pulse" />
          </div>
        </div>

        {/* TABS SKELETON */}
        <div className="flex gap-2 mb-4">
          <div className="h-10 w-20 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse" />
        </div>

        {/* MOBILE CARDS SKELETON */}
        <div className="block md:hidden">
          <CardSkeleton count={5} />
        </div>

        {/* DESKTOP TABLE SKELETON */}
        <div className="hidden md:block">
          <TableSkeleton rows={5} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center p-6 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  /* =====================================================
       RENDER
    ===================================================== */
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 pb-24 md:pb-6">
      {/* HEADER */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center">
          <Users className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            Prospective Tenants
          </h1>
          <p className="text-xs text-gray-600 mt-0.5">
            {filteredTenants.length} applicants found
          </p>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab("active")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === "active"
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setTab("archived")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === "archived"
              ? "bg-gray-700 text-white shadow-sm"
              : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"
          }`}
        >
          Archived
        </button>
      </div>

      {/* MOBILE CARDS VIEW */}
      <div className="block md:hidden space-y-3">
        {filteredTenants.length === 0 ? (
          <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-900 font-semibold text-base mb-1">
              No applicants found
            </p>
            <p className="text-gray-500 text-sm">
              {tab === "active"
                ? "No active applicants at the moment."
                : "No archived applicants."}
            </p>
          </div>
        ) : (
          filteredTenants.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
            >
              {/* Top Section */}
              <div className="flex items-start gap-3 mb-3">
                <Image
                  src={
                    t.profilePicture ||
                    "https://cdn-icons-png.flaticon.com/512/847/847969.png"
                  }
                  alt="Profile"
                  width={48}
                  height={48}
                  className="rounded-full border border-gray-200"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-base">
                    {t.firstName} {t.lastName}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {t.unit_name || "No unit assigned"}
                  </p>
                </div>
                {statusBadge(t.status)}
              </div>

              {/* Contact Info */}
              <div className="space-y-1 mb-3 pb-3 border-b border-gray-100">
                <div className="text-sm text-gray-700">{t.email}</div>
                <div className="text-sm text-gray-600">{t.phoneNumber}</div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleView(t)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  View Details
                </button>

                {tab === "active" && (
                  <ActionMenu
                    tenant={t}
                    openMenuId={openMenuId}
                    setOpenMenuId={setOpenMenuId}
                    updateStatus={updateStatus}
                    archive={archiveTenant}
                    router={router}
                  />
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block bg-white rounded-xl border shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y">
            <thead className="bg-gray-50 text-xs uppercase text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">Tenant</th>
                <th className="px-4 py-3 text-left">Contact</th>
                <th className="px-4 py-3 text-left">Unit</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-900 font-semibold text-base mb-1">
                      No applicants found
                    </p>
                    <p className="text-gray-500 text-sm">
                      {tab === "active"
                        ? "No active applicants at the moment."
                        : "No archived applicants."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTenants.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Image
                          src={
                            t.profilePicture ||
                            "https://cdn-icons-png.flaticon.com/512/847/847969.png"
                          }
                          alt="Profile"
                          width={40}
                          height={40}
                          className="rounded-full border border-gray-200"
                        />
                        <span className="font-semibold text-gray-900">
                          {t.firstName} {t.lastName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="text-gray-700">{t.email}</div>
                      <div className="text-xs text-gray-500">
                        {t.phoneNumber}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {t.unit_name || "—"}
                    </td>
                    <td className="px-4 py-3">{statusBadge(t.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleView(t)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-4 h-4" /> View
                        </button>

                        {tab === "active" && (
                          <ActionMenu
                            tenant={t}
                            openMenuId={openMenuId}
                            setOpenMenuId={setOpenMenuId}
                            updateStatus={updateStatus}
                            archive={archiveTenant}
                            router={router}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   ACTION MENU
===================================================== */
function ActionMenu({
  tenant,
  openMenuId,
  setOpenMenuId,
  updateStatus,
  archive,
  router,
}: any) {
  const isOpen = openMenuId === tenant.id;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY + 8,
        right: window.innerWidth - rect.right + window.scrollX,
      });
    }
  }, [isOpen]);

  return (
    <div className="action-menu-container relative">
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          setOpenMenuId(isOpen ? null : tenant.id);
        }}
        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
      >
        <MoreVertical className="w-4 h-4 text-gray-600" />
      </button>

      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed bg-white border border-gray-200 rounded-lg shadow-xl z-[9999] w-48"
          style={{
            top: `${menuPosition.top}px`,
            right: `${menuPosition.right}px`,
          }}
        >
          <button
            onClick={() => {
              router.push(`/chat/${tenant.user_id}`);
              setOpenMenuId(null);
            }}
            className="w-full px-4 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 text-gray-700 transition-colors rounded-t-lg"
          >
            <MessageCircle className="w-4 h-4" /> Message
          </button>

          {tenant.status === "pending" && (
            <>
              <button
                onClick={() => {
                  updateStatus(tenant, "approved");
                  setOpenMenuId(null);
                }}
                className="w-full px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 flex items-center gap-2 transition-colors"
              >
                <CheckCircle className="w-4 h-4" /> Approve
              </button>
              <button
                onClick={() => {
                  updateStatus(tenant, "disapproved");
                  setOpenMenuId(null);
                }}
                className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
              >
                <XCircle className="w-4 h-4" /> Reject
              </button>
            </>
          )}

          <div className="border-t border-gray-200 my-1" />

          <button
            onClick={() => {
              archive(tenant);
              setOpenMenuId(null);
            }}
            className="w-full px-4 py-2 text-sm text-red-600 flex items-center gap-2 hover:bg-red-50 transition-colors rounded-b-lg"
          >
            <Archive className="w-4 h-4" /> Remove from list
          </button>
        </div>
      )}
    </div>
  );
}
