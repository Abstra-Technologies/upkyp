"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { IoMailOpen } from "react-icons/io5";
import {
  UserCircle2,
  Building2,
  Search,
  Home,
  User,
  UserPlus,
  Phone,
  Mail,
} from "lucide-react";
import Pagination from "@/components/Commons/Pagination";
import useAuthStore from "@/zustand/authStore";
import { useChatStore } from "@/zustand/chatStore";

type Tenant = {
  tenant_id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  profilePicture?: string;
  units: { unit_id: number; unit_name: string }[];
  property_names: string[];
};

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

// Skeleton Component
const TenantSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div key={i} className="bg-white border rounded-2xl p-5 animate-pulse">
        <div className="flex flex-col items-center mb-4">
          <div className="w-16 h-16 bg-gray-200 rounded-2xl mb-3" />
          <div className="h-5 bg-gray-200 rounded w-32 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-40 mb-1" />
          <div className="h-3 bg-gray-200 rounded w-28" />
        </div>
        <div className="space-y-2 mb-4">
          <div className="h-10 bg-gray-200 rounded-xl" />
          <div className="h-10 bg-gray-200 rounded-xl" />
        </div>
        <div className="flex gap-2">
          <div className="flex-1 h-10 bg-gray-200 rounded-xl" />
          <div className="flex-1 h-10 bg-gray-200 rounded-xl" />
        </div>
      </div>
    ))}
  </div>
);

export default function TenantList({ landlord_id }: { landlord_id: number }) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 6;

  const router = useRouter();
  const { user, admin, fetchSession } = useAuthStore();

  // Fetch tenants
  useEffect(() => {
    if (!landlord_id) return;

    fetch(
      `/api/landlord/properties/getCurrentTenants?landlord_id=${landlord_id}`
    )
      .then((res) => res.json())
      .then((data) => {
        setTenants(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load tenants.");
        setLoading(false);
      });
  }, [landlord_id]);

  useEffect(() => {
    if (!user && !admin) fetchSession();
  }, [user, admin, fetchSession]);

  // Search filter
  const filteredTenants = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return tenants.filter((t) => {
      return (
        `${t.firstName} ${t.lastName}`.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        t.phoneNumber?.toLowerCase().includes(q) ||
        t.property_names.join(", ").toLowerCase().includes(q)
      );
    });
  }, [tenants, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredTenants.length / itemsPerPage);
  const currentTenants = filteredTenants.slice(
    (page - 1) * itemsPerPage,
    (page - 1) * itemsPerPage + itemsPerPage
  );

  // Actions
  const handleMessageTenant = (tenant: Tenant) => {
    const chatRoom = `chat_${[user.user_id, tenant.tenant_id]
      .sort()
      .join("_")}`;
    useChatStore.getState().setPreselectedChat({
      chat_room: chatRoom,
      landlord_id: user.landlord_id,
      tenant_id: tenant.tenant_id,
      name: `${tenant.firstName} ${tenant.lastName}`,
    });
    router.push("/landlord/chat");
  };

  const handleViewDetails = (id: number) =>
    router.push(`/landlord/list_of_tenants/${id}`);
  const handleInviteTenant = () => router.push("/landlord/invite-tenant");

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Skeleton */}
        <div className="bg-white border-b border-gray-200 pt-20 pb-5 md:pt-6 md:pb-5 px-4 md:px-8 lg:px-12 xl:px-16">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse" />
              <div>
                <div className="h-7 bg-gray-200 rounded w-32 animate-pulse mb-2" />
                <div className="h-4 bg-gray-200 rounded w-48 animate-pulse" />
              </div>
            </div>
            <div className="flex gap-3">
              <div className="h-11 bg-gray-200 rounded-xl w-64 animate-pulse" />
              <div className="h-11 bg-gray-200 rounded-xl w-24 animate-pulse" />
            </div>
          </div>
        </div>
        <div className="px-4 md:px-8 lg:px-12 xl:px-16 pt-5">
          <TenantSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Error loading tenants
          </h3>
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-gray-200 pt-20 pb-5 md:pt-6 md:pb-5 px-4 md:px-8 lg:px-12 xl:px-16"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Title */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Tenants</h1>
              <p className="text-gray-600 text-sm">
                {tenants.length} active tenant{tenants.length !== 1 ? "s" : ""}{" "}
                across your properties
              </p>
            </div>
          </div>

          {/* Search + Invite */}
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tenants..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-sm"
              />
            </div>

            <button
              onClick={handleInviteTenant}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
            >
              <UserPlus className="w-5 h-5" />
              Invite
            </button>
          </div>
        </div>
      </motion.div>

      {/* Tenants Grid */}
      <div className="px-4 md:px-8 lg:px-12 xl:px-16 pt-5 pb-24">
        {currentTenants.length > 0 ? (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {currentTenants.map((tenant) => {
              const tenantName = `${tenant.firstName} ${tenant.lastName}`;
              const propertyList = tenant.property_names.join(", ") || "—";
              const unitList =
                tenant.units.map((u) => u.unit_name).join(", ") || "—";

              return (
                <motion.div
                  key={tenant.tenant_id}
                  variants={fadeInUp}
                  className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-xl hover:-translate-y-1 hover:border-blue-200 transition-all duration-300"
                >
                  {/* Profile */}
                  <div className="flex flex-col items-center mb-4">
                    {tenant.profilePicture ? (
                      <img
                        src={tenant.profilePicture}
                        alt={tenantName}
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-gray-100 shadow-sm"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 text-white flex items-center justify-center text-xl font-bold shadow-lg">
                        {tenant.firstName[0]}
                      </div>
                    )}

                    <h2 className="mt-3 text-base font-semibold text-gray-900 text-center">
                      {tenantName}
                    </h2>

                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[180px]">
                        {tenant.email}
                      </span>
                    </div>

                    {tenant.phoneNumber && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                        <Phone className="w-3.5 h-3.5" />
                        <span>{tenant.phoneNumber}</span>
                      </div>
                    )}
                  </div>

                  {/* Property & Unit Info */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2.5 p-2.5 bg-blue-50 rounded-xl">
                      <Building2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <span className="text-xs text-gray-700 truncate">
                        {propertyList}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 p-2.5 bg-emerald-50 rounded-xl">
                      <Home className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span className="text-xs text-gray-700 truncate">
                        {unitList}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDetails(tenant.tenant_id)}
                      className="flex-1 py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200"
                    >
                      Profile
                    </button>

                    <button
                      onClick={() => handleMessageTenant(tenant)}
                      className="flex-1 py-2.5 text-sm font-semibold bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 flex items-center justify-center gap-1.5 transition-all duration-200"
                    >
                      <IoMailOpen className="w-4 h-4" />
                      Chat
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <User className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery ? "No tenants found" : "No tenants yet"}
            </h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              {searchQuery
                ? "Try adjusting your search terms."
                : "Invite tenants to your properties to get started."}
            </p>
            {!searchQuery && (
              <button
                onClick={handleInviteTenant}
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
              >
                <UserPlus className="w-5 h-5" />
                Invite Your First Tenant
              </button>
            )}
          </motion.div>
        )}

        {/* Pagination */}
        {filteredTenants.length > itemsPerPage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              itemsPerPage={itemsPerPage}
              totalItems={filteredTenants.length}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}
