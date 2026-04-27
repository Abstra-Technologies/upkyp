"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import axios from "axios";

import useAuthStore from "@/zustand/authStore";
import LoadingScreen from "@/components/loadingScreen";
import MobileLandlordSidenav from "@/components/navigation/MobileLandlordSidenav";

import {
  IoHome,
  IoBusiness,
  IoWallet,
  IoAnalytics,
  IoLogOut,
  IoChatbubbleEllipses,
  IoCalendar,
  IoHammer,
  IoMegaphone,
  IoMenu,
  IoPeople,
  IoSettings,
  IoAlertCircle,
  IoHelp,
  IoCard,
  IoChevronDown,
  IoChevronForward,
  IoGrid,
  IoFolderOpen,
  IoLayers,
  IoBook,
  IoHelpCircle,
} from "react-icons/io5";
import { FaRegFolder } from "react-icons/fa";
import useSubscription from "@/hooks/landlord/useSubscription";

const NotificationSection = dynamic(
  () => import("@/components/notification/notifCenter"),
  { ssr: false },
);

const SendTenantInviteModal = dynamic(
  () => import("@/components/landlord/properties/sendInvite"),
  { ssr: false },
);

interface Property {
  property_id: number;
  property_name: string;
  city: string;
  province: string;
}

export default function LandlordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, fetchSession, signOut } = useAuthStore();
  const landlordId = user?.landlord_id ?? undefined;
  const { subscription, loadingSubscription } = useSubscription(landlordId);
  const emailVerified = user?.emailVerified ?? false;

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showPropertyDropdown, setShowPropertyDropdown] = useState(false);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user) {
      fetchSession().finally(() => setAuthReady(true));
    } else {
      setAuthReady(true);
    }
  }, [user, fetchSession]);

  useEffect(() => {
    if (authReady && user && user.userType !== "landlord") {
      router.replace("/auth/login");
    }
  }, [authReady, user, router]);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = isSidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSidebarOpen]);

  useEffect(() => {
    const fetchProperties = async () => {
      setLoadingProperties(true);
      try {
        const res = await axios.get(`/api/landlord/properties/getAllPropertieName`);
        setProperties(res.data || []);
      } catch (err) {
        console.error("Error fetching properties:", err);
      } finally {
        setLoadingProperties(false);
      }
    };
    fetchProperties();
  }, []);

  const handlePropertySelect = (property: Property) => {
    setSelectedProperty(property);
    setShowPropertyDropdown(false);
    window.location.href = `/landlord/properties/${property.property_id}`;
  };

  const isInsideProperty = useMemo(
    () =>
      pathname.includes("/landlord/properties/") &&
      !pathname.includes("/commons/profile"),
    [pathname],
  );

  const isOnboarding = pathname === "/landlord/onboarding";

  const toggleSection = (title: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const navItems = [
    {
      section: "Overview",
      items: [
        { id: "nav-dashboard", label: "Dashboard", href: "/landlord/dashboard", icon: IoHome },
        { id: "nav-properties", label: "Properties", href: "/landlord/properties", icon: IoBusiness },
        { id: "nav-tenants", label: "My Tenants", href: "/landlord/tenants", icon: IoPeople },
        { id: "nav-payments", label: "Payments", href: "/landlord/payments", icon: IoWallet },
      ]
    },
    {
      section: "Operations",
      items: [
        { id: "nav-announcements", label: "Announcements", href: "/landlord/announcement", icon: IoMegaphone },
        { id: "nav-workorders", label: "Maintenance", href: "/landlord/maintenance", icon: IoHammer },
        { id: "nav-calendar", label: "Calendar", href: "/landlord/calendar", icon: IoCalendar },

      ]
    },
    {
      section: "Insights",
      items: [
        { id: "nav-analytics", label: "Analytics", href: "/landlord/analytics/performance", icon: IoAnalytics },
      ]
    },
    {
      section: "Resources",
      items: [
        { id: "nav-docs", label: "Documents", href: "/landlord/documents", icon: IoFolderOpen },
      ]
    },
    {
      section: "Platform",
      items: [
        { id: "nav-upkyp", label: "Upkyp Stack", href: "/upkyp_stack", icon: IoLayers },
        { id: "nav-subscription", label: "Subscription", href: "/commons/landlord/subscription", icon: IoCard },
      ]
    },
    {
      section: "Support",
      items: [
        { id: "nav-help", label: "Help Center", href: "/public/help", icon: IoHelpCircle },
        { id: "nav-guide", label: "User Guide", href: "/public/guide", icon: IoBook },
      ]
    },
  ];

  const handleLogout = async () => {
    await signOut();
    router.push("/auth/login");
  };

  if (!authReady)
    return <LoadingScreen message="Preparing your workspace..." />;
  if (!user || user.userType !== "landlord")
    return <LoadingScreen message="Redirecting..." />;
  if (isInsideProperty) return <main className="min-h-screen">{children}</main>;
  if (isOnboarding) return <main className="min-h-screen">{children}</main>;

  return (
    <div className="flex min-h-screen bg-gray-50 scrollbar-none">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-64 bg-gray-900 border-r border-gray-800 z-40">
        <div className="flex flex-col h-full">
          {/* HEADER / BRAND */}
          <div className="px-4 py-5 border-b border-gray-800">
            <Link id="nav-brand" href="/landlord/dashboard" className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-lg">
                <IoGrid className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white">Upkyp</h1>
                <p className="text-[10px] text-gray-400">Landlord Portal</p>
              </div>
            </Link>
          </div>

          {/* USER PROFILE */}
          <div className="px-4 py-4 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Image
                  src={
                    user.profilePicture ||
                    "https://res.cloudinary.com/dptmeluy0/image/upload/v1766715365/profile-icon-design-free-vector_la6rgj.jpg"
                  }
                  alt="Profile"
                  width={36}
                  height={36}
                  className="rounded-lg object-cover border border-gray-700"
                />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-gray-900"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-white truncate">
                  {user.firstName && user.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user?.companyName || user.email}
                </p>
                <span
                  className={`inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                    subscription?.plan_name === "pro"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : subscription?.plan_name === "enterprise"
                        ? "bg-purple-500/20 text-purple-400"
                        : "bg-gray-700 text-gray-300"
                  }`}
                >
                  {loadingSubscription
                    ? "..."
                    : subscription?.plan_name
                      ? subscription.plan_name.toUpperCase()
                      : "FREE"}
                </span>
              </div>
              <Link href="/commons/profile" className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors">
                <IoSettings className="w-4 h-4 text-gray-400 hover:text-white" />
              </Link>
            </div>
          </div>

          {/* PROPERTY SELECTOR */}
          <div className="px-3 py-3 border-b border-gray-800">
            <button
              onClick={() => setShowPropertyDropdown(!showPropertyDropdown)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-700 bg-gray-800/50 hover:bg-gray-800 hover:border-gray-600 transition-all text-left"
            >
              <IoBusiness className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-200 truncate">
                  {selectedProperty ? selectedProperty.property_name : "Select Property"}
                </p>
              </div>
              <IoChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showPropertyDropdown ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown */}
            {showPropertyDropdown && (
              <div className="absolute left-3 right-3 mt-1 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-50 max-h-56 overflow-y-auto">
                {loadingProperties ? (
                  <div className="p-3 text-center text-xs text-gray-400">Loading...</div>
                ) : properties.length === 0 ? (
                  <div className="p-3 text-center text-xs text-gray-400">No properties yet</div>
                ) : (
                  properties.map((prop) => (
                    <button
                      key={prop.property_id}
                      onClick={() => handlePropertySelect(prop)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0 ${
                        selectedProperty?.property_id === prop.property_id ? "bg-blue-600/20" : ""
                      }`}
                    >
                      <div className="w-6 h-6 rounded bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <IoBusiness className="w-3 h-3 text-blue-400" />
                      </div>
                      <p className="text-xs font-medium text-gray-200 truncate">{prop.property_name}</p>
                    </button>
                  ))
                )}
                <Link
                  href="/landlord/properties"
                  onClick={() => setShowPropertyDropdown(false)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium text-blue-400 hover:bg-gray-700 transition-colors border-t border-gray-700"
                >
                  + Add New Property
                </Link>
              </div>
            )}
          </div>

          {/* NAVIGATION */}
          <nav className="flex-1 px-3 py-3 overflow-y-auto">
            {navItems.map((group) => {
              const isCollapsed = collapsedSections[group.section];
              return (
                <div key={group.section} className="mb-4">
                  <button
                    onClick={() => toggleSection(group.section)}
                    className="w-full flex items-center justify-between px-2 mb-1.5 group hover:bg-gray-800/50 rounded-lg p-1 -mx-1 transition-colors"
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 group-hover:text-gray-300">
                      {group.section}
                    </span>
                    <IoChevronForward className={`w-3 h-3 text-gray-600 group-hover:text-gray-400 transition-all duration-200 ${isCollapsed ? "" : "rotate-90"}`} />
                  </button>
                  {!isCollapsed && group.items.map(({ id, label, href, icon: Icon }) => {
                    const active = pathname === href || (href !== "/landlord/dashboard" && pathname.startsWith(href + "/"));

                    if (!emailVerified) {
                      return (
                        <div
                          key={href}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg opacity-50 cursor-not-allowed text-gray-500"
                          title="Verify your email first"
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-sm">{label}</span>
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={href}
                        id={id}
                        href={href}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 mb-0.5 group ${
                          active
                            ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-medium shadow-lg shadow-blue-500/20"
                            : "text-gray-300 hover:bg-gray-800 hover:text-white"
                        }`}
                      >
                        <Icon className={`w-4 h-4 transition-colors ${active ? "" : "text-gray-500 group-hover:text-gray-300"}`} />
                        <span>{label}</span>
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </nav>

          {/* FOOTER */}
          <div className="p-3 border-t border-gray-800">
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors"
            >
              <IoLogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
            <p className="text-center text-[10px] text-gray-600 mt-2">
              © {new Date().getFullYear()} UpKyp
            </p>
          </div>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <div
        id="mobile-header"
        className="lg:hidden fixed top-0 left-0 right-0 h-12 bg-gradient-to-r from-blue-600 to-emerald-600 flex items-center justify-between px-4 z-50"
      >
        <Link href="/landlord/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
            <IoGrid className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-sm font-bold text-white">Upkyp</h1>
        </Link>
        <div className="flex gap-1">
          <NotificationSection user={user} admin={null} />
          <button
            id="mobile-menu-btn"
            onClick={() => setIsSidebarOpen(true)}
            className="p-1.5 rounded-lg hover:bg-white/10"
          >
            <IoMenu className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* MOBILE SIDENAV */}
      <MobileLandlordSidenav
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        navGroups={navItems.map(g => ({ title: g.section, items: g.items }))}
        onLogoutClick={() => setShowLogoutConfirm(true)}
        user={user}
        emailVerified={emailVerified}
        properties={properties}
        selectedProperty={selectedProperty}
        onPropertySelect={handlePropertySelect}
        showPropertyDropdown={showPropertyDropdown}
        setShowPropertyDropdown={setShowPropertyDropdown}
        loadingProperties={loadingProperties}
      />

      {/* LOGOUT CONFIRM */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl">
            <div className="text-center mb-4">
              <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <IoAlertCircle className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="font-bold text-lg">Confirm Logout</h3>
              <p className="text-sm text-gray-600 mt-1">
                Are you sure you want to logout?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 border rounded-xl py-3"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 bg-red-600 text-white rounded-xl py-3"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MAIN */}
      <main className="flex-1 lg:pl-64 pt-12 lg:pt-0 min-h-screen scrollbar-none transition-all duration-300">{children}</main>
    </div>
  );
}