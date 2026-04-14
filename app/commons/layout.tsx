"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import {
  UserIcon,
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
  CreditCardIcon,
} from "@heroicons/react/24/outline";

import {
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Home,
  ArrowLeft,
  Settings,
  LogOut,
} from "lucide-react";

import useAuthStore from "@/zustand/authStore";
import LoadingScreen from "@/components/loadingScreen";

/* ---------------------------------------------
   CENTRALIZED NAVIGATION LIST
--------------------------------------------- */
const profileNavLinks = [
  {
    href: "/pages/commons/profile",
    label: "Profile",
    shortLabel: "Profile",
    icon: UserIcon,
    roles: ["tenant", "landlord", "admin"],
    exactMatch: true, // Only match exact path
  },
  {
    href: "/pages/commons/profile/security",
    label: "Security & Privacy",
    shortLabel: "Security",
    icon: ShieldCheckIcon,
    roles: ["tenant", "landlord", "admin"],
    exactMatch: false,
  },
  {
    href: "/pages/commons/landlord/payoutDetails",
    label: "Payout Account",
    shortLabel: "Payout",
    icon: CreditCardIcon,
    roles: ["landlord"],
    exactMatch: false,
  },
  {
    href: "/pages/commons/landlord/subscription",
    label: "View Subscription",
    shortLabel: "Subscription",
    icon: CreditCardIcon,
    roles: ["landlord"],
    exactMatch: false,
  },
];

/* Helper function to check if link is active */
const isLinkActive = (pathname: string, href: string, exactMatch: boolean) => {
  if (exactMatch) {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(href + "/");
};

export default function SideNavProfile({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, signOut, signOutAdmin, fetchSession } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      if (!user) {
        await fetchSession();
      }
      setIsAuthChecking(false);
    }

    checkAuth();
  }, [user, fetchSession]);

  useEffect(() => {
    if (!isAuthChecking && !user) {
      router.replace("/pages/auth/login");
    }
  }, [user, isAuthChecking, router]);

  /* Reset mobile UI on route change */
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  /* Prevent body scroll when sidebar open */
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSidebarOpen]);

  const handleLogout = () => {
    if (!user) return;
    user?.userType ? signOut() : signOutAdmin();
    router.push("/pages/auth/login");
  };

  const mainPageUrl =
    user?.userType === "landlord"
      ? "/pages/landlord/dashboard"
      : "/pages/tenant/feeds";

  const mainPageLabel =
    user?.userType === "landlord" ? "Back to Dashboard" : "Back to Feeds";

  /* Filter nav links based on role */
  const filteredLinks = profileNavLinks.filter((link) =>
    link.roles.includes(user?.userType || "guest"),
  );

  // Show loading screen during auth check
  if (isAuthChecking) {
    return <LoadingScreen message="Loading your profile..." />;
  }

  // Show loading screen if user is not authenticated
  if (!user) {
    return <LoadingScreen message="Redirecting to login..." />;
  }

  // =====================================================
  // TENANT VIEW - Tab navigation below main Navbar
  // =====================================================
  if (user?.userType === "tenant") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-emerald-50/30">
        {/* Sticky Tab Navigation - positioned below main Navbar */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-4xl mx-auto px-4">
            {/* Header Row */}
            <div className="flex items-center gap-3 pt-4 pb-2">
              <button
                onClick={() => router.push(mainPageUrl)}
                className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors group"
              >
                <ArrowLeft className="w-5 h-5 text-gray-500 group-hover:text-blue-600 transition-colors" />
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-gray-900">
                  Account Settings
                </h1>
              </div>
            </div>

            {/* Tab Pills */}
            <div className="flex items-center gap-2 pb-3 overflow-x-auto scrollbar-hide">
              {filteredLinks.map((item) => {
                const Icon = item.icon;
                const isActive = isLinkActive(
                  pathname,
                  item.href,
                  item.exactMatch,
                );
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap
                      font-medium text-sm transition-all duration-200
                      ${
                        isActive
                          ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-md shadow-blue-500/25"
                          : "text-gray-600 hover:bg-gray-100 bg-gray-50 border border-gray-200"
                      }
                    `}
                  >
                    <Icon
                      className={`w-4 h-4 ${isActive ? "" : "text-gray-400"}`}
                    />
                    {item.shortLabel}
                  </Link>
                );
              })}
            </div>

            {/* Subtitle - below tabs */}
            <p className="text-sm text-gray-500 pb-3">
              Manage your account information
            </p>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto">{children}</main>

        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div
              className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl transform transition-all duration-300 scale-100"
              style={{ animation: "modalPop 0.3s ease-out" }}
            >
              <div className="text-center mb-4">
                <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-7 h-7 text-red-600" />
                </div>
                <h3 className="font-bold text-lg text-gray-900">
                  Confirm Logout
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Are you sure you want to sign out?
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 border border-gray-200 rounded-xl py-3 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 bg-red-600 text-white rounded-xl py-3 font-medium hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Animation Keyframes */}
        <style jsx global>{`
          @keyframes modalPop {
            0% {
              opacity: 0;
              transform: scale(0.9);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}</style>
      </div>
    );
  }

  // =====================================================
  // LANDLORD VIEW - Full Sidebar Layout (Matching landlord sidebar)
  // =====================================================
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-emerald-50/30">
      {/*---------------------------------------------*/}
      {/* DESKTOP SIDEBAR */}
      {/*---------------------------------------------*/}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-72 bg-white shadow-xl z-40">
        <div className="flex flex-col h-full">
          {/* HEADER */}
          <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-emerald-600 text-white">
            <Link href="/pages/landlord/dashboard">
              <h1 className="text-2xl font-bold">Upkyp</h1>
            </Link>
            <p className="text-xs text-white/80">Account Settings</p>
          </div>

          {/* Back Button */}
          <div className="px-4 pt-4 pb-2">
            <button
              onClick={() => router.push(mainPageUrl)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-100 rounded-xl hover:from-blue-100 hover:to-emerald-100 transition-all duration-200"
            >
              <ChevronLeft className="w-5 h-5 text-blue-600" />
              {mainPageLabel}
            </button>
          </div>

          {/* PROFILE SECTION */}
          <div className="px-4 py-4 border-b bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="relative w-11 h-11 flex-shrink-0">
                <Image
                  src={
                    user.profilePicture ||
                    "https://res.cloudinary.com/dptmeluy0/image/upload/v1766715365/profile-icon-design-free-vector_la6rgj.jpg"
                  }
                  alt="Profile"
                  width={44}
                  height={44}
                  className="rounded-xl object-cover w-full h-full border-2 border-gray-200"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">
                  {user.firstName && user.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user.companyName || user.email}
                </p>
                <p className="text-xs text-gray-500">Landlord Account</p>
              </div>
            </div>
          </div>

          {/* NAVIGATION LIST */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            {filteredLinks.map(({ label, href, icon: Icon, exactMatch }) => {
              const active = isLinkActive(pathname, href, exactMatch);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition
                    ${
                      active
                        ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Help Section */}
          <div className="px-4 py-4 border-t border-gray-100">
            <div className="bg-gradient-to-r from-blue-600 to-emerald-600 rounded-xl p-4 text-white">
              <div className="text-sm font-medium mb-1">Need Help?</div>
              <div className="text-xs opacity-90 mb-3">Contact support</div>
              <button className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded-lg transition-colors">
                Get Support
              </button>
            </div>
          </div>

          {/* FOOTER */}
          <div className="p-4 border-t bg-gray-50">
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/*---------------------------------------------*/}
      {/* MOBILE HEADER - Matching landlord sidebar */}
      {/*---------------------------------------------*/}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-gradient-to-r from-blue-600 to-emerald-600 flex items-center justify-between px-4 z-50">
        <Link href="/pages/landlord/dashboard">
          <h1 className="text-xl font-bold text-white">Upkyp</h1>
        </Link>
        <div className="flex gap-2">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <Menu className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/*---------------------------------------------*/}
      {/* MOBILE SIDEBAR OVERLAY - Right slide panel */}
      {/*---------------------------------------------*/}
      <div
        className={`lg:hidden fixed inset-0 z-50 transition-opacity duration-300 ease-in-out ${
          isSidebarOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
            isSidebarOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setIsSidebarOpen(false)}
        />

        {/* Sidebar Panel */}
        <aside
          className={`absolute right-0 top-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-out ${
            isSidebarOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Header */}
          <div className="p-4 flex justify-between items-center bg-gradient-to-r from-blue-600 to-emerald-600 text-white">
            <h2 className="font-bold text-lg">Account Settings</h2>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Profile Section */}
          <div className="p-4 bg-gray-50 border-b">
            <div className="flex items-center gap-3">
              <Image
                src={
                  user.profilePicture ||
                  "https://res.cloudinary.com/dptmeluy0/image/upload/v1766715365/profile-icon-design-free-vector_la6rgj.jpg"
                }
                alt="Profile"
                width={44}
                height={44}
                className="rounded-full border-2 border-white shadow-md"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate text-gray-900">
                  {user.firstName && user.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user.companyName || user.email}
                </p>
                <p className="text-xs text-gray-500">Landlord Account</p>
              </div>
            </div>
          </div>

          {/* Back to Dashboard Button */}
          <div className="p-4 border-b">
            <button
              onClick={() => {
                setIsSidebarOpen(false);
                router.push(mainPageUrl);
              }}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-100 text-gray-700 font-medium rounded-xl hover:from-blue-100 hover:to-emerald-100 transition-all"
            >
              <Home className="w-5 h-5 text-blue-600" />
              {mainPageLabel}
            </button>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-380px)]">
            {filteredLinks.map(
              ({ label, href, icon: Icon, exactMatch }, index) => {
                const active = isLinkActive(pathname, href, exactMatch);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      active
                        ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-md"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    style={{
                      animationDelay: isSidebarOpen ? `${index * 30}ms` : "0ms",
                    }}
                  >
                    <Icon className="w-5 h-5" />
                    {label}
                  </Link>
                );
              },
            )}
          </nav>

          {/* Help Section */}
          <div className="p-4 border-t">
            <div className="bg-gradient-to-r from-blue-600 to-emerald-600 rounded-xl p-4 text-white">
              <div className="text-sm font-medium mb-1">Need Help?</div>
              <div className="text-xs opacity-90 mb-3">Contact support</div>
              <button className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded-lg transition-colors">
                Get Support
              </button>
            </div>
          </div>

          {/* Logout */}
          <div className="p-4 border-t">
            <button
              onClick={() => {
                setIsSidebarOpen(false);
                setShowLogoutConfirm(true);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-red-200 text-red-600 hover:bg-red-50 transition-colors font-medium"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </aside>
      </div>

      {/*---------------------------------------------*/}
      {/* LOGOUT MODAL */}
      {/*---------------------------------------------*/}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div
            className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl transform transition-all duration-300 scale-100"
            style={{ animation: "modalPop 0.3s ease-out" }}
          >
            <div className="text-center mb-4">
              <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="font-bold text-lg text-gray-900">
                Confirm Logout
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Are you sure you want to logout?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 border border-gray-200 rounded-xl py-3 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 bg-red-600 text-white rounded-xl py-3 font-medium hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/*---------------------------------------------*/}
      {/* MAIN CONTENT */}
      {/*---------------------------------------------*/}
      <main className="flex-1 lg:pl-72 pt-14 lg:pt-0">{children}</main>

      {/* Animation Keyframes */}
      <style jsx global>{`
        @keyframes modalPop {
          0% {
            opacity: 0;
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
