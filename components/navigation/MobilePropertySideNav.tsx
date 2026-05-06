"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Building2, MapPin, ArrowLeft, ChevronRight, Building, ChevronDown } from "lucide-react";
import axios from "axios";

interface MenuItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

interface Property {
  property_id: number;
  property_name: string;
}

interface MobilePropertySidenavProps {
  isOpen: boolean;
  onClose: () => void;
  menuGroups: MenuGroup[];
  propertyName: string;
  city?: string;
  province?: string;
  propertyId: string;
  user: any;
  isActive: (menuId: string, href: string) => boolean;
  landlordId?: number | string;
}

export default function MobilePropertySidenav({
  isOpen,
  onClose,
  menuGroups,
  propertyName,
  city,
  province,
  propertyId,
  user,
  isActive,
  landlordId,
}: MobilePropertySidenavProps) {
  const router = useRouter();
  const [otherProperties, setOtherProperties] = useState<Property[]>([]);
  const [showPropertyDropdown, setShowPropertyDropdown] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const fetchProperties = async () => {
      try {
        const res = await axios.get(`/api/landlord/properties/getAllPropertieName`);
        setOtherProperties(res.data || []);
      } catch (err) {
        console.error("Error fetching properties:", err);
      }
    };
    fetchProperties();
  }, [isOpen]);

  const handleSwitchProperty = (propertyId: number) => {
    onClose();
    window.location.href = `/landlord/properties/${propertyId}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* BACKDROP */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />

          {/* SIDEBAR */}
          <motion.aside
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="lg:hidden fixed inset-4 sm:inset-8 md:inset-12
                             bg-white shadow-2xl z-[70] flex flex-col rounded-2xl overflow-hidden max-w-md mx-auto"
          >
            {/* HEADER */}
            <div className="bg-gradient-to-r from-blue-600 to-emerald-600 px-3 py-2.5 flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-bold text-white">Property Menu</h2>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Back Button */}
              <button
                onClick={() => {
                  router.push("/landlord/properties");
                  onClose();
                }}
                className="flex items-center gap-2 text-xs font-medium text-white/90 hover:text-white transition-colors group mb-2 w-full"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                Back to Properties
              </button>

              {/* Property Info Card */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 border border-white/20">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-bold text-white truncate">
                      {propertyName}
                    </h3>
                    {city && province && (
                      <p className="text-[10px] text-white/80 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">
                          {city}, {province}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Property Switcher */}
              <div className="mt-2 relative">
                <button
                  onClick={() => setShowPropertyDropdown(!showPropertyDropdown)}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 transition-all text-left"
                >
                  <Building className="w-3.5 h-3.5 text-white/80 flex-shrink-0" />
                  <span className="text-xs text-white/90 truncate flex-1">Switch Property</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-white/60 transition-transform duration-200 ${showPropertyDropdown ? "rotate-180" : ""}`} />
                </button>

                {showPropertyDropdown && (
                  <div className="absolute left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-56 overflow-y-auto">
                    {otherProperties.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
                    ) : (
                      otherProperties
                        .filter((p) => String(p.property_id) !== propertyId)
                        .map((prop) => (
                          <button
                            key={prop.property_id}
                            onClick={() => handleSwitchProperty(prop.property_id)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b last:border-b-0"
                          >
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-emerald-100 flex items-center justify-center flex-shrink-0">
                              <Building className="w-4 h-4 text-blue-600" />
                            </div>
                            <p className="text-sm font-medium text-gray-800 truncate">{prop.property_name}</p>
                          </button>
                        ))
                    )}
                    <Link
                      href="/landlord/properties/create-property"
                      onClick={onClose}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors border-t"
                    >
                      + Add New Property
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* NAVIGATION */}
            <nav className="flex-1 overflow-y-auto p-3 space-y-4 min-h-0">
              {menuGroups.map((group) => (
                <div key={group.title}>
                  <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    {group.title}
                  </p>
                  <ul className="space-y-1">
                    {group.items.map(({ id, label, href, icon: Icon }) => {
                      const active = isActive(id, href);
                      return (
                        <li key={id}>
                          <Link
                            href={href}
                            onClick={onClose}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                              active
                                ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-lg shadow-blue-500/25"
                                : "text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            <Icon
                              className={`w-5 h-5 shrink-0 ${
                                active
                                  ? ""
                                  : "text-gray-400 group-hover:text-blue-600"
                              }`}
                            />
                            <span className="flex-1 text-sm font-medium truncate">
                              {label}
                            </span>
                            {active && (
                              <ChevronRight className="w-4 h-4 shrink-0" />
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>

            {/* FOOTER */}
            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  © {new Date().getFullYear()} UpKyp
                </p>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-xs text-gray-500">Connected</span>
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
