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
  Home,
  Building,
  Wallet,
  ChartArea,
  LogOut,
  MessageSquareMore,
  Calendar,
  Construction,
  Megaphone,
  Menu,
  Users,
  Settings,
  AlertCircle,
  Handshake,
  CreditCard,
  ChevronDown,
} from "lucide-react";
import useSubscription from "@/hooks/landlord/useSubscription";
import { IoFileTrayStacked } from "react-icons/io5";
import { FaRegFolder } from "react-icons/fa";

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

  const navGroups = useMemo(
    () => [
      {
        title: "Main",
        items: [
          {
            id: "nav-dashboard",
            label: "Dashboard",
            href: "/landlord/dashboard",
            icon: Home,
          },
          {
            id: "nav-properties",
            label: "Properties",
            href: "/landlord/property-listing",
            icon: Building,
          },
          {
            id: "nav-tenants",
            label: "My Tenants",
            href: "/landlord/list_of_tenants",
            icon: Users,
          },
          {
            id: "nav-payments",
            label: "Payments",
            href: "/landlord/payments",
            icon: Wallet,
          },
          {
            id: "nav-messages",
            label: "Messages",
            href: "/landlord/chat",
            icon: MessageSquareMore,
          },
        ],
      },
      {
        title: "Management",
        items: [
            {
                id: "nav-analytics",
                label: "Analytics",
                href: "/landlord/analytics/performance",
                icon: ChartArea,
            },
          {
            id: "nav-workorders",
            label: "Maintenance",
            href: "/landlord/maintenance-request",
            icon: Construction,
          },
          {
            id: "nav-calendar",
            label: "Calendar",
            href: "/landlord/calendar",
            icon: Calendar,
          },
          {
            id: "nav-announcements",
            label: "Announcements",
            href: "/landlord/announcement",
            icon: Megaphone,
          },
        ],
      },
      {
        title: "Tools",
        items: [
          {
            id: "nav-docs",
            label: "Document Storage",
            href: "/landlord/documents",
            icon: FaRegFolder ,
          },
        ],
      },
      {
        title: "Platform",
        items: [
          {
            id: "nav-upkyp",
            label: "Upkyp Stack",
            href: "/upkyp_stack",
            icon: IoFileTrayStacked,
          },
            {
                id: "nav-subscription",
                label: "Subscription",
                href: "/commons/landlord/subscription",
                icon: CreditCard,
            },
        ],
      },
      {
        title: "Help",
        items: [

          {
            id: "nav-help",
            label: "Help & Support",
            href: "/public/help",
            icon: Handshake,
          },
          {
            id: "nav-guide",
            label: "User Guide",
            href: "/public/guide",
            icon: Handshake,
          },
        ],
      },
    ],
    [],
  );

  const handleLogout = async () => {
    await signOut();
    router.push("/auth/login");
  };

  if (!authReady)
    return <LoadingScreen message="Preparing your workspace..." />;
  if (!user || user.userType !== "landlord")
    return <LoadingScreen message="Redirecting..." />;
  if (isInsideProperty) return <main className="min-h-screen">{children}</main>;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-emerald-50/30 scrollbar-none">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-72 bg-white shadow-xl z-40 transition-all duration-300">
        <div className="flex flex-col h-full">
          {/* HEADER */}
          <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white flex items-center justify-between">
            <Link id="nav-brand" href="/landlord/dashboard" className="flex items-center gap-2">
              <h1 className="text-lg font-bold">Upkyp</h1>
              <span className="text-xs text-white/70 font-medium">Landlord Portal</span>
            </Link>
            <NotificationSection user={user} admin={null} />
          </div>

          {/* PROFILE */}
          <div className="px-4 py-3 border-b bg-gray-50">
            <div className="flex items-center gap-3">
              <Image
                src={
                  user.profilePicture ||
                  "https://res.cloudinary.com/dptmeluy0/image/upload/v1766715365/profile-icon-design-free-vector_la6rgj.jpg"
                }
                alt="Profile"
                width={40}
                height={40}
                className="rounded-lg object-cover border border-gray-200"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">
                  {user.firstName && user.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user?.companyName || user.email}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      subscription?.plan_name === "pro"
                        ? "bg-emerald-100 text-emerald-700"
                        : subscription?.plan_name === "enterprise"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {loadingSubscription
                      ? "..."
                      : subscription?.plan_name
                        ? subscription.plan_name.toUpperCase()
                        : "FREE"}
                  </span>
                </div>
              </div>
              <Link href="/commons/profile">
                <Settings className="w-4 h-4 text-gray-500 hover:text-blue-600 transition-colors" />
              </Link>
            </div>
          </div>

          {/* PROPERTY SELECTOR */}
          <div className="px-3 py-2.5 border-b bg-white relative">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
              My Properties
            </p>
            <button
              onClick={() => setShowPropertyDropdown(!showPropertyDropdown)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-blue-300 transition-all duration-200 text-left"
            >
              <Building className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {selectedProperty ? selectedProperty.property_name : "Select Property"}
                </p>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${showPropertyDropdown ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown */}
            {showPropertyDropdown && (
              <div className="absolute left-3 right-3 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-64 overflow-y-auto">
                {loadingProperties ? (
                  <div className="p-3 text-center text-sm text-gray-500">Loading...</div>
                ) : properties.length === 0 ? (
                  <div className="p-3 text-center text-sm text-gray-500">No properties yet</div>
                ) : (
                  properties.map((prop) => (
                    <button
                      key={prop.property_id}
                      onClick={() => handlePropertySelect(prop)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-blue-50 transition-colors border-b last:border-b-0 ${
                        selectedProperty?.property_id === prop.property_id ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="w-7 h-7 rounded-md bg-gradient-to-br from-blue-100 to-emerald-100 flex items-center justify-center flex-shrink-0">
                        <Building className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <p className="text-sm font-medium text-gray-800 truncate">{prop.property_name}</p>
                    </button>
                  ))
                )}
                <Link
                  href="/landlord/property-listing"
                  onClick={() => setShowPropertyDropdown(false)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors border-t"
                >
                  + Add New Property
                </Link>
              </div>
            )}
          </div>

          {/* NAV */}
          <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-4">
            {navGroups.map((group) => (
              <div key={group.title}>
                <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  {group.title}
                </p>
                {group.items.map(({ id, label, href, icon: Icon }) => {
                  const active =
                    pathname === href || pathname.startsWith(href + "/");

                  if (!emailVerified) {
                    return (
                      <div
                        key={href}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition opacity-50 cursor-not-allowed text-gray-400"
                        title="Verify your email first"
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={href}
                      id={id}
                      href={href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        active
                          ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-md"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* FOOTER LOGOUT */}
          <div className="p-3 border-t bg-gray-50">
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 font-medium text-sm shadow-md"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <div
        id="mobile-header"
        className="lg:hidden fixed top-0 left-0 right-0 h-12 bg-gradient-to-r from-blue-600 to-emerald-600 flex items-center justify-between px-4 z-50"
      >
        <Link href="/landlord/dashboard" className="flex items-center gap-2">
          <h1 className="text-base font-bold text-white">Upkyp</h1>
          <span className="text-xs text-white/70 font-medium hidden sm:inline">Landlord Portal</span>
        </Link>
        <div className="flex gap-1">
          <NotificationSection user={user} admin={null} />
          <button
            id="mobile-menu-btn"
            onClick={() => setIsSidebarOpen(true)}
            className="p-1.5 rounded-lg hover:bg-white/10"
          >
            <Menu className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* MOBILE SIDENAV */}
      <MobileLandlordSidenav
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        navGroups={navGroups}
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
                <AlertCircle className="w-7 h-7 text-red-600" />
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
      <main className="flex-1 lg:pl-72 pt-12 lg:pt-0 min-h-screen scrollbar-none transition-all duration-300">{children}</main>
    </div>
  );
}
