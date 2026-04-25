"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  UserCircle2,
  Building2,
  Search,
  User,
  UserPlus,
  Phone,
  Mail,
  MessageSquare,
} from "lucide-react";
import Pagination from "@/components/Commons/Pagination";
import useAuthStore from "@/zustand/authStore";
import { useChatStore } from "@/zustand/chatStore";

type Tenant = {
  tenant_id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  profilePicture?: string;
  units: { unit_id: number; unit_name: string }[];
  property_names: string[];
};

const GRADIENTS = [
  { card: "from-blue-50 to-indigo-50 border-blue-300", avatar: "from-blue-500 to-indigo-500", btn: "from-blue-500 to-indigo-500 shadow-blue-500/20" },
  { card: "from-emerald-50 to-teal-50 border-emerald-300", avatar: "from-emerald-500 to-teal-500", btn: "from-emerald-500 to-teal-500 shadow-emerald-500/20" },
  { card: "from-purple-50 to-pink-50 border-purple-300", avatar: "from-purple-500 to-pink-500", btn: "from-purple-500 to-pink-500 shadow-purple-500/20" },
  { card: "from-amber-50 to-orange-50 border-amber-300", avatar: "from-amber-500 to-orange-500", btn: "from-amber-500 to-orange-500 shadow-amber-500/20" },
  { card: "from-cyan-50 to-sky-50 border-cyan-300", avatar: "from-cyan-500 to-sky-500", btn: "from-cyan-500 to-sky-500 shadow-cyan-500/20" },
  { card: "from-rose-50 to-red-50 border-rose-300", avatar: "from-rose-500 to-red-500", btn: "from-rose-500 to-red-500 shadow-rose-500/20" },
];

function getGradientIndex(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % GRADIENTS.length;
}

const TenantSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div key={i} className="bg-white border rounded-xl p-4 animate-pulse">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gray-200 rounded-xl" />
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-24 mb-1.5" />
            <div className="h-3 bg-gray-200 rounded w-32" />
          </div>
        </div>
        <div className="h-8 bg-gray-200 rounded-lg mb-2" />
        <div className="flex gap-2">
          <div className="flex-1 h-8 bg-gray-200 rounded-lg" />
          <div className="flex-1 h-8 bg-gray-200 rounded-lg" />
        </div>
      </div>
    ))}
  </div>
);

export default function TenantList({ landlord_id }: { landlord_id: string }) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 9;

  const router = useRouter();
  const { user, admin, fetchSession } = useAuthStore();

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

  const totalPages = Math.ceil(filteredTenants.length / itemsPerPage);
  const currentTenants = filteredTenants.slice(
    (page - 1) * itemsPerPage,
    (page - 1) * itemsPerPage + itemsPerPage
  );

  const handleMessageTenant = (tenant: Tenant) => {
    const chatRoom = `chat_${[user?.user_id, tenant.tenant_id]
      .sort()
      .join("_")}`;
    useChatStore.getState().setPreselectedChat({
      chat_room: chatRoom,
      landlord_id: user?.landlord_id,
      tenant_id: tenant.tenant_id,
      name: `${tenant.firstName} ${tenant.lastName}`,
    });
    router.push("/landlord/chat");
  };

  const handleViewDetails = (id: string) =>
    router.push(`/landlord/tenants/${id}`);
  const handleInviteTenant = () => router.push("/landlord/invite-tenant");

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 pt-16 sm:pt-6 pb-4 px-4 md:px-8 lg:px-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse" />
              <div>
                <div className="h-5 bg-gray-200 rounded w-28 animate-pulse mb-1.5" />
                <div className="h-3 bg-gray-200 rounded w-40 animate-pulse" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="h-10 bg-gray-200 rounded-xl w-full sm:w-56 animate-pulse" />
              <div className="h-10 bg-gray-200 rounded-xl w-20 animate-pulse" />
            </div>
          </div>
        </div>
        <div className="px-4 md:px-8 lg:px-12 pt-4">
          <TenantSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-red-500" />
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
      <div className="bg-white border-b border-gray-200 pt-16 sm:pt-6 pb-4 px-4 md:px-8 lg:px-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">My Tenants</h1>
              <p className="text-gray-500 text-xs">
                {tenants.length} active tenant{tenants.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">

            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tenants..."
                  className="w-full pl-9 pr-3 py-2 bg-gray-100 border-2 border-gray-400 rounded-xl
               placeholder-gray-500 text-gray-800
               focus:outline-none focus:ring-2 focus:ring-gray-400/30
               transition-all text-sm"
              />
            </div>

            <button
              onClick={handleInviteTenant}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-emerald-600 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg transition-all"
            >
              <UserPlus className="w-4 h-4" />
              Invite
            </button>
          </div>
        </div>
      </div>

      {/* Tenants Grid */}
      <div className="px-4 md:px-8 lg:px-12 pt-4 pb-24">
        {currentTenants.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {currentTenants.map((tenant) => {
              const tenantName = `${tenant.firstName} ${tenant.lastName}`;
              const propertyList = [...new Set(tenant.property_names)].join(", ") || "—";
              const theme = GRADIENTS[getGradientIndex(tenant.tenant_id)];

              return (
                <div
                  key={tenant.tenant_id}
                  className={`bg-gradient-to-br ${theme.card} border-2 rounded-xl p-4 hover:shadow-lg transition-all duration-200`}
                >
                  {/* Profile Row */}
                  <div className="flex items-center gap-3 mb-3">
                    {tenant.profilePicture ? (
                      <img
                        src={tenant.profilePicture}
                        alt={tenantName}
                        className="w-10 h-10 rounded-xl object-cover border-2 border-white shadow-sm"
                      />
                    ) : (
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${theme.avatar} text-white flex items-center justify-center text-sm font-bold shadow-md`}>
                        {tenant.firstName[0]}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <h2 className="text-sm font-semibold text-gray-900 truncate">
                        {tenantName}
                      </h2>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Mail className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{tenant.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Property */}
                  <div className="flex items-center gap-2 p-2 bg-white/70 rounded-lg mb-3">
                    <Building2 className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                    <span className="text-xs text-gray-700 truncate">
                      {propertyList}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDetails(tenant.tenant_id)}
                      className={`flex-1 py-2 text-xs font-semibold bg-gradient-to-r ${theme.btn} text-white rounded-lg hover:shadow-md transition-all`}
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => handleMessageTenant(tenant)}
                      className={`flex-1 py-2 text-xs font-semibold bg-gradient-to-r ${theme.btn} text-white rounded-lg hover:shadow-md transition-all flex items-center justify-center gap-1`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Chat
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              {searchQuery ? "No tenants found" : "No tenants yet"}
            </h3>
            <p className="text-gray-500 text-sm max-w-sm mx-auto">
              {searchQuery
                ? "Try adjusting your search terms."
                : "Invite tenants to your properties to get started."}
            </p>
            {!searchQuery && (
              <button
                onClick={handleInviteTenant}
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg transition-all"
              >
                <UserPlus className="w-4 h-4" />
                Invite Your First Tenant
              </button>
            )}
          </div>
        )}

        {/* Pagination */}
        {filteredTenants.length > itemsPerPage && (
          <div className="mt-6">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              itemsPerPage={itemsPerPage}
              totalItems={filteredTenants.length}
            />
          </div>
        )}
      </div>
    </div>
  );
}
