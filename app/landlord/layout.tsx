"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";

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
} from "lucide-react";
import useSubscription from "@/hooks/landlord/useSubscription";

const NotificationSection = dynamic(
  () => import("@/components/notification/notifCenter"),
  { ssr: false },
);

const SendTenantInviteModal = dynamic(
  () => import("@/components/landlord/properties/sendInvite"),
  { ssr: false },
);

export default function LandlordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, fetchSession, signOut } = useAuthStore();
  const landlordId = user?.landlord_id;
  const { subscription, loadingSubscription } = useSubscription(landlordId);
  const emailVerified = user?.emailVerified ?? false;

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [authReady, setAuthReady] = useState(false);

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

  const isInsideProperty = useMemo(
    () =>
      pathname.includes("/landlord/properties/") &&
      !pathname.includes("/commons/profile"),
    [pathname],
  );

  // ── Nav groups with IDs added for Driver.js targeting ──
  const navGroups = useMemo(
    () => [
      {
        title: "Core",
        items: [
          {
            id: "nav-dashboard",
            label: "Dashboard",
            href: "/landlord/dashboard",
            icon: Home,
          },
          {
            id: "nav-payments",
            label: "Payments",
            href: "/landlord/payments",
            icon: Wallet,
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
            id: "nav-messages",
            label: "Messages",
            href: "/landlord/chat",
            icon: MessageSquareMore,
          },

        ],
      },
      {
        title: "Operations",
        items: [
          {
            id: "nav-workorders",
            label: "Work Orders",
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
        title: "Finance & Strategy",
        items: [
          {
            id: "nav-analytics",
            label: "Analytics",
            href: "/landlord/analytics/performance",
            icon: ChartArea,
          },
        ],
      },
      {
        title: "Support",
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
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-emerald-50/30">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-72 bg-white shadow-xl z-40">
        <div className="flex flex-col h-full">
          {/* HEADER */}
          <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-emerald-600 text-white">
            <div className="flex justify-between items-center">
              {/* ID for tour targeting */}
              <Link id="nav-brand" href="/landlord/dashboard">
                <h1 className="text-2xl font-bold">Upkyp</h1>
              </Link>
              <NotificationSection user={user} admin={null} />
            </div>
            <p className="text-xs text-white/80">Landlord Portal</p>
          </div>

          {/* PROFILE */}
          <div className="px-4 py-4 border-b bg-gray-50">
            <div className="flex items-center gap-3">
              <Image
                src={
                  user.profilePicture ||
                  "https://res.cloudinary.com/dptmeluy0/image/upload/v1766715365/profile-icon-design-free-vector_la6rgj.jpg"
                }
                alt="Profile"
                width={44}
                height={44}
                className="rounded-xl object-cover border-2 border-gray-200"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">
                  {user.firstName && user.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user?.companyName || user.email}
                </p>
                <p className="text-xs text-gray-500">Landlord</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
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
                        : "-"}
                  </span>
                </div>
                {user.landlord_id && (
                  <p className="text-[11px] text-gray-400 truncate mt-0.5">
                    ID: {user?.landlord_id}
                  </p>
                )}
              </div>
              <Link href="/commons/profile">
                <Settings className="w-5 h-5 text-gray-500 hover:text-blue-600" />
              </Link>
            </div>
          </div>

          {/* NAV — id applied to each Link for Driver.js */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
            {navGroups.map((group) => (
              <div key={group.title}>
                <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {group.title}
                </p>
                {group.items.map(({ id, label, href, icon: Icon }) => {
                  const active =
                    pathname === href || pathname.startsWith(href + "/");
                  
                  if (!emailVerified) {
                    return (
                      <div
                        key={href}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition opacity-50 cursor-not-allowed text-gray-400"
                        title="Verify your email first"
                      >
                        <Icon className="w-5 h-5" />
                        {label}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={href}
                      id={id}
                      href={href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                        active
                          ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {label}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* SUBSCRIPTION UPGRADE BANNER */}
          <div className="p-4 border-t bg-gradient-to-r from-blue-600 to-emerald-600">
            <Link
              href="/public/pricing"
              className="flex items-center justify-center gap-2 px-4 py-3 bg-white rounded-lg hover:bg-gray-50 transition font-semibold text-sm"
            >
              <CreditCard className="w-5 h-5" />
              {subscription?.plan_name === "pro" || subscription?.plan_name === "enterprise"
                ? "Manage Subscription"
                : "Upgrade Plan"}
            </Link>
          </div>

          {/* FOOTER LOGOUT */}
          <div className="p-4 border-t bg-gray-50">
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <div
        id="mobile-header"
        className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-gradient-to-r from-blue-600 to-emerald-600 flex items-center justify-between px-4 z-50"
      >
        <Link href="/landlord/dashboard">
          <h1 className="text-xl font-bold text-white">Upkyp</h1>
        </Link>
        <div className="flex gap-2">
          <NotificationSection user={user} admin={null} />
          <button
            id="mobile-menu-btn"
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-white/10"
          >
            <Menu className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

            {/* MOBILE SIDENAV (COMPONENT) */}
            <MobileLandlordSidenav
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                navGroups={navGroups}
                landlordId={user.landlord_id}
                // InviteModal={SendTenantInviteModal}
                onLogoutClick={() => setShowLogoutConfirm(true)}
                user={user}
                emailVerified={emailVerified}
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
            <main className="flex-1 lg:pl-72 pt-10 lg:pt-0 min-h-screen">{children}</main>
        </div>
    );
}
