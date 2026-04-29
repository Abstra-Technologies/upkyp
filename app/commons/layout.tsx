"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";

import {
  IoLogOut,
  IoSettings,
  IoAlertCircle,
  IoWallet,
  IoCard,
  IoChevronForward,
  IoGrid,
} from "react-icons/io5";

import useAuthStore from "@/zustand/authStore";
import LoadingScreen from "@/components/loadingScreen";

const profileNavLinks = [
  {
    href: "/commons/profile",
    label: "Profile",
    shortLabel: "Profile",
    icon: IoSettings,
    roles: ["tenant", "landlord", "admin"],
    exactMatch: true,
  },
  {
    href: "/commons/profile/security",
    label: "Security & Privacy",
    shortLabel: "Security",
    icon: IoAlertCircle,
    roles: ["tenant", "landlord", "admin"],
    exactMatch: false,
  },
  {
    href: "/commons/landlord/payoutDetails",
    label: "Bank Accounts",
    shortLabel: "Bank Accounts",
    icon: IoWallet,
    roles: ["landlord"],
    exactMatch: false,
  },
  {
    href: "/commons/landlord/subscription",
    label: "View Subscription",
    shortLabel: "Subscription",
    icon: IoCard,
    roles: ["landlord"],
    exactMatch: false,
  },
];

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
      router.replace("/auth/login");
    }
  }, [user, isAuthChecking, router]);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

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
    router.push("/auth/login");
  };

  const mainPageUrl =
    user?.userType === "landlord"
      ? "/landlord/dashboard"
      : "/tenant/feeds";

  const mainPageLabel =
    user?.userType === "landlord" ? "Back to Dashboard" : "Back to Feeds";

  const filteredLinks = profileNavLinks.filter((link) =>
    link.roles.includes(user?.userType || "guest"),
  );

  if (isAuthChecking) {
    return <LoadingScreen message="Loading your profile..." />;
  }

  if (!user) {
    return <LoadingScreen message="Redirecting to login..." />;
  }

  if (user?.userType === "tenant") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-emerald-50/30">
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex items-center gap-3 pt-4 pb-2">
              <button
                onClick={() => router.push(mainPageUrl)}
                className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors group"
              >
                <IoChevronForward className="w-5 h-5 text-gray-500 rotate-180 group-hover:text-blue-600 transition-colors" />
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-gray-900">
                  Account Settings
                </h1>
              </div>
            </div>

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

            <p className="text-sm text-gray-500 pb-3">
              Manage your account information
            </p>
          </div>
        </div>

        <main className="max-w-4xl mx-auto">{children}</main>

        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl">
              <div className="text-center mb-4">
                <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <IoAlertCircle className="w-7 h-7 text-red-600" />
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
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 scrollbar-none">
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-64 bg-gray-900 border-r border-gray-800 z-40">
        <div className="flex flex-col h-full">
          <div className="px-4 py-5 border-b border-gray-800">
            <Link href="/landlord/dashboard" className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-lg">
                <IoGrid className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white">Upkyp</h1>
                <p className="text-[10px] text-gray-400">Account Settings</p>
              </div>
            </Link>
          </div>

          <div className="px-4 py-4 border-b border-gray-800">
            <button
              onClick={() => router.push(mainPageUrl)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-300 bg-gray-800/50 border border-gray-700 rounded-lg hover:bg-gray-800 hover:border-gray-600 transition-all"
            >
              <IoChevronForward className="w-4 h-4 rotate-180" />
              {mainPageLabel}
            </button>
          </div>

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
                    : user.companyName || user.email}
                </p>
                <p className="text-[10px] text-gray-400">Landlord Account</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            {filteredLinks.map(({ label, href, icon: Icon, exactMatch }) => {
              const active = isLinkActive(pathname, href, exactMatch);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-all ${
                    active
                      ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-medium shadow-lg shadow-blue-500/20"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? "" : "text-gray-500"}`} />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="px-4 py-4 border-t border-gray-800">
            <div className="bg-gradient-to-r from-blue-600 to-emerald-600 rounded-xl p-4 text-white">
              <div className="text-sm font-medium mb-1">Need Help?</div>
              <div className="text-xs opacity-90 mb-3">Contact support</div>
              <button className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded-lg transition-colors">
                Get Support
              </button>
            </div>
          </div>

          <div className="p-3 border-t border-gray-800">
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors"
            >
              <IoLogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-gradient-to-r from-blue-600 to-emerald-600 flex items-center justify-between px-4 z-50">
        <Link href={mainPageUrl} className="flex items-center gap-2">
          <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
            <IoGrid className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-sm font-bold text-white">Account Settings</h1>
        </Link>
        <div className="flex gap-1">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <IoGrid className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* MOBILE SIDEBAR OVERLAY */}
      <div
        className={`lg:hidden fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
          isSidebarOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />

        <aside
          className={`relative w-full max-w-sm bg-gray-900 rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 ease-out ${
            isSidebarOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
          }`}
        >
          <div className="px-4 py-3 flex justify-between items-center bg-gray-800 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-white/20 rounded-md flex items-center justify-center">
                <IoSettings className="w-4 h-4 text-white" />
              </div>
              <h2 className="font-bold text-sm tracking-tight text-white">Account Settings</h2>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <IoChevronForward className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="max-h-[75vh] overflow-y-auto">
            <div className="px-4 py-3 border-b border-gray-800 bg-gray-800/50">
              <div className="flex items-center gap-3">
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
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-xs truncate text-white">
                    {user.firstName && user.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user.companyName || user.email}
                  </p>
                  <p className="text-[10px] text-gray-400">Landlord Account</p>
                </div>
              </div>
            </div>

            <div className="px-4 py-2.5 border-b border-gray-800">
              <button
                onClick={() => {
                  setIsSidebarOpen(false);
                  router.push(mainPageUrl);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 transition-all text-left"
              >
                <IoChevronForward className="w-3.5 h-3.5 text-blue-400 rotate-180 flex-shrink-0" />
                <p className="text-xs font-medium text-gray-200 truncate">{mainPageLabel}</p>
              </button>
            </div>

            <nav className="p-3">
              {filteredLinks.map(({ label, href, icon: Icon, exactMatch }, index) => {
                const active = isLinkActive(pathname, href, exactMatch);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors mb-0.5 ${
                      active
                        ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-md"
                        : "hover:bg-gray-800 text-gray-300"
                    }`}
                    style={{
                      animationDelay: isSidebarOpen ? `${index * 30}ms` : "0ms",
                    }}
                  >
                    <Icon className={`w-4 h-4 ${active ? "" : "text-gray-500"}`} />
                    <span className="text-xs font-medium">{label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="px-4 py-3 border-t border-gray-800">
              <div className="bg-gradient-to-r from-blue-600 to-emerald-600 rounded-xl p-3 text-white">
                <div className="text-xs font-medium mb-0.5">Need Help?</div>
                <div className="text-[10px] opacity-90 mb-2">Contact support</div>
                <button className="bg-white/20 hover:bg-white/30 text-white text-[10px] px-2.5 py-1 rounded-lg transition-colors">
                  Get Support
                </button>
              </div>
            </div>

            <div className="p-4 border-t border-gray-800">
              <button
                onClick={() => {
                  setIsSidebarOpen(false);
                  setShowLogoutConfirm(true);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors font-medium text-xs"
              >
                <IoLogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* LOGOUT MODAL */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl">
            <div className="text-center mb-4">
              <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <IoAlertCircle className="w-7 h-7 text-red-600" />
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

      <main className="flex-1 lg:pl-64 pt-14 lg:pt-0 min-h-screen scrollbar-none transition-all duration-300">{children}</main>
    </div>
  );
}