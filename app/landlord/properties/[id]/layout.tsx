"use client";

import Link from "next/link";
import { useRouter, usePathname, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import useSWR from "swr";
import axios from "axios";
import { motion } from "motion/react";

import useAuthStore from "@/zustand/authStore";
import NotificationSection from "@/components/notification/notifCenter";
import MobilePropertySidenav from "@/components/navigation/MobilePropertySideNav";

import {
  Home,
  Building2,
  FileText,
  CreditCard,
  ArrowLeft,
  SlidersHorizontal,
  Zap,
  Videotape,
  ScrollText,
  Menu,
  ChevronLeft,
  MapPin,
  ChevronRight,
  ChevronDown,
  Wallet,
  NotebookText,
  Users,
  CopyMinus,
  HandCoins,
  Building,
} from "lucide-react";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function PropertyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { id } = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  const landlordId = user?.landlord_id;

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showPropertyDropdown, setShowPropertyDropdown] = useState(false);
  const [otherProperties, setOtherProperties] = useState<any[]>([]);
  const [loadingOtherProperties, setLoadingOtherProperties] = useState(false);

  useEffect(() => {
    const fetchOtherProperties = async () => {
      setLoadingOtherProperties(true);
      try {
        const res = await axios.get(`/api/landlord/properties/getAllPropertieName`);
        setOtherProperties(res.data || []);
      } catch (err) {
        console.error("Error fetching properties:", err);
      } finally {
        setLoadingOtherProperties(false);
      }
    };
    fetchOtherProperties();
  }, []);

  const handleSwitchProperty = (propertyId: number) => {
    setShowPropertyDropdown(false);
    window.location.href = `/landlord/properties/${propertyId}`;
  };

  const { data, isLoading } = useSWR(
    id ? `/api/propertyListing/getPropDetailsById?property_id=${id}` : null,
    fetcher,
  );

  const property = data?.property;
  const propertyName = property?.property_name || "Loading...";
  const city = property?.city || "";
  const province = property?.province || "";

  /* ============================
     MENU GROUPS — navId added for Driver.js targeting
  ============================ */
  const menuGroups = [
    {
      title: "Property Setup",
      items: [
        {
          id: "edit",
          navId: "prop-nav-edit",
          label: "Edit Property",
          href: `/landlord/properties/${id}/editPropertyDetails?${id}`,
          icon: CopyMinus,
        },
        {
          id: "policy",
          navId: "prop-nav-policy",
          label: "House Policy",
          href: `/landlord/properties/${id}/house-policy?${id}`,
          icon: NotebookText,
        },
        {
          id: "units",
          navId: "prop-nav-units",
          label: "Units",
          href: `/landlord/properties/${id}`,
          icon: Home,
        },
      ],
    },
    {
      title: "Operations",
      items: [
        {
          id: "active-lease",
          navId: "prop-nav-active-lease",
          label: "Active Lease",
          href: `/landlord/properties/${id}/activeLease`,
          icon: ScrollText,
        },
        {
          id: "prospectives",
          navId: "prop-nav-prospectives",
          label: "Prospectives",
          href: `/landlord/properties/${id}/prospectives`,
          icon: Users,
        },
        {
          id: "assets",
          navId: "prop-nav-assets",
          label: "Assets",
          href: `/landlord/properties/${id}/assets_management`,
          icon: Videotape,
        },
        // {
        //   id: "documents",
        //   label: "Documents",
        //   href: `/landlord/properties/${id}/documents`,
        //   icon: FileText,
        // },
      ],
    },
    {
      title: "Finance",
      items: [
        {
          id: "payments",
          navId: "prop-nav-payments",
          label: "Payments",
          href: `/landlord/properties/${id}/payments`,
          icon: Wallet,
        },
        // {
        //   id: "pdc-management",
        //   navId: "prop-nav-pdc-management",
        //   label: "PDC Management",
        //   href: `/landlord/properties/${id}/pdcManagement`,
        //   icon: FileText,
        // },
        {
          id: "finance",
          navId: "prop-nav-finance",
          label: "Financials",
          href: `/landlord/properties/${id}/financials`,
          icon: HandCoins,
        },
      ],
    },
    {
      title: "Utilities & Settings",
      items: [
        {
          id: "utilities",
          navId: "prop-nav-utilities",
          label: "Utilities",
          href: `/landlord/properties/${id}/utilities`,
          icon: Zap,
        },
        {
          id: "configuration",
          navId: "prop-nav-configuration",
          label: "Configuration",
          href: `/landlord/properties/${id}/configurations`,
          icon: SlidersHorizontal,
        },
      ],
    },
  ];

  const isActive = (menuId: string, href: string) => {
    if (menuId === "units") return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  };

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = isSidebarOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isSidebarOpen]);

  /* ============================
     SIDEBAR CONTENT
  ============================ */
  const SidebarContent = () => (
    <>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-emerald-600 px-5 py-4">
        <button
          onClick={() => router.push("/landlord/property-listing")}
          className="flex items-center gap-2 text-sm font-medium text-white/90 hover:text-white transition-colors group mb-4"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Properties
        </button>

        {/* Current Property Display */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold text-white truncate">
                {propertyName}
              </h1>
              {city && province && (
                <p className="text-sm text-white/80 flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" />
                  {city}, {province}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Property Switcher */}
        <div className="mt-3 relative">
          <button
            onClick={() => setShowPropertyDropdown(!showPropertyDropdown)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 transition-all text-left"
          >
            <Building className="w-4 h-4 text-white/80 flex-shrink-0" />
            <span className="text-sm text-white/90 truncate flex-1">Switch Property</span>
            <ChevronDown className={`w-4 h-4 text-white/60 transition-transform duration-200 ${showPropertyDropdown ? "rotate-180" : ""}`} />
          </button>

          {/* Dropdown */}
          {showPropertyDropdown && (
            <div className="absolute left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-56 overflow-y-auto">
              {loadingOtherProperties ? (
                <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
              ) : otherProperties.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">No other properties</div>
              ) : (
                otherProperties
                  .filter((p: any) => String(p.property_id) !== String(id))
                  .map((prop: any) => (
                    <button
                      key={prop.property_id}
                      onClick={() => handleSwitchProperty(prop.property_id)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b last:border-b-0"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-emerald-100 flex items-center justify-center flex-shrink-0">
                        <Building className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{prop.property_name}</p>
                      </div>
                    </button>
                  ))
              )}
              <Link
                href="/landlord/property-listing"
                onClick={() => setShowPropertyDropdown(false)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors border-t"
              >
                + Add New Property
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Navigation — navId applied to each Link for Driver.js */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-4">
        {menuGroups.map((group) => (
          <div key={group.title}>
            <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              {group.title}
            </p>
            <ul className="space-y-1">
              {group.items.map(
                ({ id: menuId, navId, label, href, icon: Icon }) => {
                  const active = isActive(menuId, href);
                  return (
                    <motion.li
                      key={menuId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <Link
                        href={href}
                        id={navId}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                          active
                            ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-lg shadow-blue-500/25"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <Icon
                          className={`w-5 h-5 ${
                            active
                              ? ""
                              : "text-gray-400 group-hover:text-blue-600"
                          }`}
                        />
                        <span className="flex-1 text-sm font-medium">
                          {label}
                        </span>
                        {active && <ChevronRight className="w-4 h-4" />}
                      </Link>
                    </motion.li>
                  );
                },
              )}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
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
    </>
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-emerald-50/20">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-72 bg-white shadow-xl z-40">
        <SidebarContent />
      </aside>

      {/* MOBILE HEADER */}
      <div
        id="prop-mobile-header"
        className="lg:hidden fixed top-0 left-0 right-0 h-14
                      bg-gradient-to-r from-blue-600 to-emerald-600
                      flex items-center justify-between px-4 z-50 shadow-lg"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button
            onClick={() => router.push("/landlord/property-listing")}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors shrink-0"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-white truncate">
              {propertyName}
            </h1>
            {city && (
              <p className="text-[10px] text-white/80 truncate">
                {city}, {province}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <NotificationSection user={user} admin={null} />
          <button
            id="prop-mobile-menu-btn"
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <Menu className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* MOBILE SIDEBAR */}
      <MobilePropertySidenav
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        menuGroups={menuGroups}
        propertyName={propertyName}
        city={city}
        province={province}
        propertyId={String(id)}
        user={user}
        isActive={isActive}
      />

      {/* MAIN CONTENT */}
        <main className="flex-1 lg:pl-72 pt-2 sm:pt-4 lg:pt-0">
            <div className="px-3 sm:px-4 lg:p-6 max-w-md sm:max-w-none mx-auto">
                {children}
            </div>
        </main>
    </div>
  );
}
