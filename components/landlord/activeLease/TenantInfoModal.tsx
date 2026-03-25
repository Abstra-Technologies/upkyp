"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/zustand/authStore";
import { useChatStore } from "@/zustand/chatStore";
import { X, User, Mail, Phone, MessageCircle } from "lucide-react";

interface TenantInfoModalProps {
  isOpen: boolean;
  tenantId: string;
  onClose: () => void;
}

export default function TenantInfoModal({
  isOpen,
  tenantId,
  onClose,
}: TenantInfoModalProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && tenantId) {
      const fetchTenant = async () => {
        try {
          const res = await fetch(
            `/api/landlord/properties/getCurrentTenants/viewDetail/${tenantId}`
          );
          const data = await res.json();
          setTenant(data?.tenant || null);
        } catch (err) {
          console.error("Error fetching tenant:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchTenant();
    }
  }, [isOpen, tenantId]);

  if (!isOpen) return null;

  const handleSendMessage = () => {
    if (!tenant?.user_id || !user?.landlord_id) return;

    const chatRoom = `chat_${[user.landlord_id, tenant.user_id].sort().join("_")}`;
    useChatStore.getState().setPreselectedChat({
      chat_room: chatRoom,
      landlord_id: user.landlord_id,
      tenant_id: tenant.tenant_id,
      name: `${tenant.firstName} ${tenant.lastName}`,
    });
    router.push("/pages/landlord/chat");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-emerald-600 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-white" />
            <h2 className="text-lg font-bold text-white">Tenant Info</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
              <p className="text-sm text-gray-500 mt-2">Loading...</p>
            </div>
          ) : tenant ? (
            <>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100">
                  {tenant.profilePicture ? (
                    <img
                      src={tenant.profilePicture}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {tenant.firstName} {tenant.lastName}
                  </h3>
                  <span className="text-sm text-gray-500">Tenant</span>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{tenant.email || "—"}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{tenant.phoneNumber || "—"}</span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <button
                  onClick={handleSendMessage}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 flex items-center justify-center gap-2 font-medium"
                >
                  <MessageCircle className="w-4 h-4" />
                  Send Message
                </button>
              </div>
            </>
          ) : (
            <p className="text-center text-gray-500 py-8">Tenant not found</p>
          )}
        </div>
      </div>
    </div>
  );
}