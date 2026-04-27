"use client";

import Link from "next/link";
import { useRouter, usePathname, useParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import axios from "axios";
import useSWR from "swr";

import useAuthStore from "@/zustand/authStore";
import LoadingScreen from "@/components/loadingScreen";
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
import {
  IoGrid,
  IoLogOut,
  IoSettings,
  IoAlertCircle,
  IoChevronDown as IoChevronDownIcon,
  IoChevronForward,
  IoBusiness,
} from "react-icons/io5";
import useSubscription from "@/hooks/landlord/useSubscription";

const NotificationSection = dynamic(
  () => import("@/components/notification/notifCenter"),
  { ssr: false },
);

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

interface Property {
  property_id: number;
  property_name: string;
  city: string;
  province: string;
}

export default function PropertyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { id } = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const { user, fetchSession, signOut } = useAuthStore();
  const landlordId = user?.landlord_id;
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
    const prefix = `/landlord/properties/${id}`;
    const suffix = pathname.startsWith(prefix) ? pathname.slice(prefix.length) : "";
    window.location.href = `/landlord/properties/${property.property_id}${suffix}`;
  };

  const { data, isLoading } = useSWR(
    id ? `/api/propertyListing/getPropDetailsById?property_id=${id}` : null,
    fetcher,
  );

  const property = data?.property;
  const propertyName = property?.property_name || "Loading...";
  const city = property?.city || "";
  const province = property?.province || "";

  const toggleSection = (title: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  /* ============================
     MENU GROUPS — navId added for Driver.js targeting
  ============================ */
  const menuGroups = [
    {
      section: "Property Setup",
      items: [
        { id: "prop-nav-edit", label: "Edit Property", href: `/landlord/properties/${id}/editPropertyDetails?${id}`, icon: CopyMinus },
        { id: "prop-nav-policy", label: "House Policy", href: `/landlord/properties/${id}/house-policy?${id}`, icon: NotebookText },
        { id: "prop-nav-units", label: "Units", href: `/landlord/properties/${id}`, icon: Home, exact: true },
      ]
    },
    {
      section: "Operations",
      items: [
        { id: "prop-nav-active-lease", label: "Active Lease", href: `/landlord/properties/${id}/activeLease`, icon: ScrollText },
        { id: "prop-nav-prospectives", label: "Prospectives", href: `/landlord/properties/${id}/prospectives`, icon: Users },
        { id: "prop-nav-assets", label: "Assets", href: `/landlord/properties/${id}/assets_management`, icon: Videotape },
      ]
    },
    {
      section: "Finance",
      items: [
        { id: "prop-nav-payments", label: "Payments", href: `/landlord/properties/${id}/payments`, icon: Wallet },
        { id: "prop-nav-finance", label: "Financials", href: `/landlord/properties/${id}/financials`, icon: HandCoins },
      ]
    },
    {
      section: "Utilities & Settings",
      items: [
        { id: "prop-nav-utilities", label: "Utilities", href: `/landlord/properties/${id}/utilities`, icon: Zap },
        { id: "prop-nav-configuration", label: "Configuration", href: `/landlord/properties/${id}/configurations`, icon: SlidersHorizontal },
      ]
    },
  ];

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  };

  const handleLogout = async () => {
    await signOut();
    router.push("/auth/login");
  };

  if (!authReady)
    return <LoadingScreen message="Preparing your workspace..." />;
  if (!user || user.userType !== "landlord")
    return <LoadingScreen message="Redirecting..." />;

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
                <p className="text-[10px] text-gray-400">Property Management</p>
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

          {/* BACK TO PROPERTIES */}
          <div className="px-3 py-3 border-b border-gray-800">
            <Link
              href="/landlord/properties"
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-700 bg-gray-800/50 hover:bg-gray-800 hover:border-gray-600 transition-all text-left"
            >
              <ArrowLeft className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <p className="text-xs font-medium text-gray-200 truncate">Back to Properties</p>
            </Link>
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
                  {propertyName}
                </p>
                {city && province && (
                  <p className="text-[10px] text-gray-500 truncate">{city}, {province}</p>
                )}
              </div>
              <IoChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showPropertyDropdown ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown */}
            {showPropertyDropdown && (
              <div className="absolute left-3 right-3 mt-1 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-50 max-h-56 overflow-y-auto">
                {loadingProperties ? (
                  <div className="p-3 text-center text-xs text-gray-400">Loading...</div>
                ) : properties.length === 0 ? (
                  <div className="p-3 text-center text-xs text-gray-400">No properties yet</div>
                ) : (
                  properties
                    .filter((p) => String(p.property_id) !== String(id))
                    .map((prop) => (
                      <button
                        key={prop.property_id}
                        onClick={() => handlePropertySelect(prop)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0 ${
                          String(prop.property_id) === String(id) ? "bg-blue-600/20" : ""
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
            {menuGroups.map((group) => {
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
                  {!isCollapsed && group.items.map(({ id, label, href, icon: Icon, exact }) => {
                    const active = isActive(href, exact);

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
                        {active && <ChevronRight className="w-3 h-3 ml-auto" />}
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
        id="prop-mobile-header"
        className="lg:hidden relative h-12 bg-gradient-to-r from-blue-600 to-emerald-600 flex items-center justify-between px-4 z-50"
      >
        <Link href="/landlord/properties" className="flex items-center gap-2">
          <ChevronLeft className="w-5 h-5 text-white" />
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-white truncate">{propertyName}</h1>
            {city && province && (
              <p className="text-[10px] text-white/80 truncate">{city}, {province}</p>
            )}
          </div>
        </Link>
        <div className="flex gap-1">
          <NotificationSection user={user} admin={null} />
          <button
            id="prop-mobile-menu-btn"
            onClick={() => setIsSidebarOpen(true)}
            className="p-1.5 rounded-lg hover:bg-white/10"
          >
            <Menu className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* MOBILE SIDENAV */}
      <MobilePropertySidenav
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        menuGroups={menuGroups.map(g => ({ title: g.section, items: g.items }))}
        propertyName={propertyName}
        city={city}
        province={province}
        propertyId={String(id)}
        user={user}
        isActive={(menuId: string, href: string, exact?: boolean) => isActive(href, exact)}
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

      {/* MAIN CONTENT */}
      <main className="flex-1 lg:pl-64 min-h-screen scrollbar-none transition-all duration-300">
        <div className="px-3 sm:px-4 lg:p-6 max-w-md sm:max-w-none mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
