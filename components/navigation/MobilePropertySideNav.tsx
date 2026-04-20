"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { X, Building2, MapPin, ArrowLeft, ChevronRight } from "lucide-react";

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
}: MobilePropertySidenavProps) {
  const router = useRouter();

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
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="lg:hidden fixed top-0 left-0 bottom-0 w-80 max-w-[85vw]
                             bg-white shadow-2xl z-[70] flex flex-col"
          >
            {/* HEADER */}
            <div className="bg-gradient-to-r from-blue-600 to-emerald-600 px-4 py-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Property Menu</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Back Button */}
              <button
                onClick={() => {
                  router.push("/landlord/property-listing");
                  onClose();
                }}
                className="flex items-center gap-2 text-sm font-medium text-white/90 hover:text-white transition-colors group mb-3 w-full"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Properties
              </button>

              {/* Property Info Card */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">
                      {propertyName}
                    </h3>
                    {city && province && (
                      <p className="text-xs text-white/80 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">
                          {city}, {province}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* PROFILE SECTION */}
            <div className="px-4 py-3 border-b bg-gray-50">
              <div className="flex items-center gap-3">
                <Image
                  src={
                    user?.profilePicture ||
                    "https://res.cloudinary.com/dptmeluy0/image/upload/v1766715365/profile-icon-design-free-vector_la6rgj.jpg"
                  }
                  alt="Profile"
                  width={40}
                  height={40}
                  className="rounded-xl object-cover border-2 border-gray-200"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate text-gray-900">
                    {user?.firstName && user?.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user?.companyName || user?.email}
                  </p>
                  <p className="text-xs text-gray-500">Property Manager</p>
                </div>
              </div>
            </div>

            {/* NAVIGATION */}
            <nav className="flex-1 overflow-y-auto p-3 space-y-4">
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
