"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import useAuthStore from "@/zustand/authStore";
import axios from "axios";
import LoadingScreen from "@/components/loadingScreen";
import NotificationSection from "@/components/notification/notifCenter";

import {
  Menu,
  X,
  Settings,
  LogOut,
  AlertCircle,
  User,
  Home,
  FileText,
  Building2,
  ChevronRight,
  Sparkles,
  CreditCard,
  Wrench,
  Megaphone,
  MessageSquare,
  ArrowLeft,
  MoreHorizontal,
  Bell,
} from "lucide-react";

export default function TenantLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, fetchSession, signOut } = useAuthStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  // Portal context state
  const [isInPortalMode, setIsInPortalMode] = useState(false);
  const [portalAgreementId, setPortalAgreementId] = useState(null);
  const [portalPropertyInfo, setPortalPropertyInfo] = useState(null);

  const [isAuthChecking, setIsAuthChecking] = useState(!user);

    useEffect(() => {
        let mounted = true;

        async function initAuth() {
            if (user) {
                if (mounted) setIsAuthChecking(false);
                return;
            }

            try {
                await fetchSession();
            } finally {
                if (mounted) setIsAuthChecking(false);
            }
        }

        initAuth();

        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        if (isAuthChecking) return;

        if (!user || user.userType !== "tenant") {
            router.replace("/pages/auth/login");
            return;
        }

        if (!user.emailVerified) {
            router.replace("/auth/verify-email");
        }
    }, [isAuthChecking, user, router]);

  // Check portal context on route changes
  useEffect(() => {
    const isPortalRoute = pathname?.startsWith("/pages/tenant/rentalPortal");

    if (!isPortalRoute) {
      setIsInPortalMode(false);
      setPortalAgreementId(null);
      setPortalPropertyInfo(null);
      return;
    }

    // On a portal route - validate the agreement
    const agreementId = localStorage.getItem("portalAgreementId");

    if (!agreementId) {
      setIsInPortalMode(false);
      router.replace("/pages/tenant/my-unit");
      return;
    }

    async function validatePortal() {
      try {
        await axios.get(`/api/tenant/validate-agreement/${agreementId}`);
        const res = await axios.get("/api/tenant/activeRent/propertyUnitInfo", {
          params: { agreement_id: agreementId },
        });

        setIsInPortalMode(true);
        // @ts-ignore
          setPortalAgreementId(agreementId);
        setPortalPropertyInfo(res.data);
      } catch {
        localStorage.removeItem("portalAgreementId");
        setIsInPortalMode(false);
        router.replace("/pages/tenant/my-unit");
      }
    }

    validatePortal();
  }, [pathname, router]);

  // Close more menu on route change
  useEffect(() => {
    setShowMoreMenu(false);
  }, [pathname]);

  // Portal navigation items
  const portalNavItems = [
    {
      name: "Dashboard",
      href: `/pages/tenant/rentalPortal/${portalAgreementId}`,
      icon: Home,
      mobileLabel: "Home",
    },
    {
      name: "Billing",
      href: `/pages/tenant/rentalPortal/${portalAgreementId}/billing`,
      icon: CreditCard,
      mobileLabel: "Billing",
    },
    {
      name: "Payments",
      href: `/pages/tenant/rentalPortal/${portalAgreementId}/paymentHistory`,
      icon: FileText,
      mobileLabel: "Payments",
    },
    {
      name: "Maintenance",
      href: `/pages/tenant/rentalPortal/${portalAgreementId}/maintenance`,
      icon: Wrench,
      mobileLabel: "Requests",
    },
  ];

  // Additional items for "More" menu
  const moreMenuItems = [
    {
      name: "Announcements",
      href: `/pages/tenant/rentalPortal/${portalAgreementId}/announcement`,
      icon: Megaphone,
    },
    {
      name: "Chats",
      href: `/pages/tenant/chat`,
      icon: MessageSquare,
    },
    {
      name: "Profile",
      href: `/pages/commons/profile`,
      icon: User,
    },
  ];

  // @ts-ignore
    const isActive = (href) => {
    if (href.includes("/rentalPortal/")) {
      return pathname === href;
    }
    return pathname === href || pathname?.startsWith(href + "/");
  };

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    await signOut();
    router.push("/pages/auth/login");
  };

  const handleExitPortal = () => {
    localStorage.removeItem("portalAgreementId");
    setIsInPortalMode(false);
    setPortalAgreementId(null);
    setPortalPropertyInfo(null);
    router.push("/pages/tenant/my-unit");
  };

  if (isAuthChecking) {
    return <LoadingScreen message="Verifying your session..." />;
  }

  if (!user || user.userType !== "tenant") {
    return <LoadingScreen message="Redirecting to login..." />;
  }

  // =====================================================
  // BROWSING MODE - Just render children (Navbar handles nav)
  // =====================================================
  if (!isInPortalMode) {
    return <>{children}</>;
  }

  // =====================================================
  // PORTAL MODE - Full sidebar + bottom nav
  // =====================================================
  return (
    <>
      {/* Mobile Portal Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between h-14 px-4">
          {/* Back Button + Property Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={handleExitPortal}
              className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {portalPropertyInfo?.property_name || "Loading..."}
              </p>
              <p className="text-xs text-gray-500 truncate">
                Unit {portalPropertyInfo?.unit_name}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <NotificationSection user={user} />
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {portalNavItems.map(({ href, icon: Icon, mobileLabel }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-xl transition-colors ${
                  active ? "text-blue-600" : "text-gray-500"
                }`}
              >
                <div
                  className={`p-1.5 rounded-xl transition-colors ${
                    active ? "bg-blue-100" : ""
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-medium">{mobileLabel}</span>
              </Link>
            );
          })}

          {/* More Button */}
          <button
            onClick={() => setShowMoreMenu(true)}
            className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-xl transition-colors ${
              showMoreMenu ? "text-blue-600" : "text-gray-500"
            }`}
          >
            <div className="p-1.5">
              <MoreHorizontal className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* More Menu Bottom Sheet */}
      <AnimatePresence>
        {showMoreMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/50 z-[60]"
              onClick={() => setShowMoreMenu(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="lg:hidden fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[60] safe-area-bottom"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>

              <div className="px-4 pb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">More</h3>

                <div className="space-y-1">
                  {moreMenuItems.map(({ href, name, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setShowMoreMenu(false)}
                      className="flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <div className="p-2 bg-gray-100 rounded-xl">
                        <Icon className="w-5 h-5 text-gray-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {name}
                      </span>
                    </Link>
                  ))}

                  <div className="h-px bg-gray-100 my-2" />

                  <button
                    onClick={() => {
                      setShowMoreMenu(false);
                      handleExitPortal();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-red-50 transition-colors"
                  >
                    <div className="p-2 bg-red-100 rounded-xl">
                      <LogOut className="w-5 h-5 text-red-600" />
                    </div>
                    <span className="text-sm font-medium text-red-600">
                      Exit Portal
                    </span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col fixed left-0 top-0 w-72 bg-white border-r border-gray-200 h-screen z-30 shadow-sm">
        {/* Logo + Portal Badge */}
        <div className="p-5 border-b border-gray-100">
          <Link href="/pages/tenant/feeds" className="flex items-center gap-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
              Upkyp
            </span>
            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
              Portal
            </span>
          </Link>
          <p className="text-xs text-gray-500 mt-1">Rental Management</p>
        </div>

        {/* Property Card */}
        <div className="p-4 border-b border-gray-100">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-emerald-50 rounded-xl border border-blue-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-emerald-600 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-bold text-gray-900 line-clamp-2">
                  {portalPropertyInfo?.property_name || "Loading..."}
                </h2>
                <p className="text-xs text-gray-600 mt-1">
                  Unit{" "}
                  <span className="font-semibold">
                    {portalPropertyInfo?.unit_name}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">
            {[...portalNavItems, ...moreMenuItems].map(
              ({ href, name, icon: Icon }, index) => {
                const active = isActive(href);
                return (
                  <motion.li
                    key={href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Link
                      href={href}
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
                      <span className="flex-1 text-sm font-medium">{name}</span>
                      {active && <ChevronRight className="w-4 h-4" />}
                    </Link>
                  </motion.li>
                );
              }
            )}
          </ul>
        </nav>

        {/* Bottom Section */}
        <div className="p-3 border-t border-gray-100 space-y-1">
          <Link
            href="/pages/commons/profile"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 hover:bg-gray-100 transition-all duration-200 group"
          >
            <Settings className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
            <span className="flex-1 text-sm font-medium">Account Settings</span>
          </Link>

          <button
            onClick={handleExitPortal}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group"
          >
            <LogOut className="w-5 h-5 text-gray-400 group-hover:text-red-600" />
            <span className="flex-1 text-sm font-medium text-left">
              Exit Portal
            </span>
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-center text-gray-900 mb-2">
                Confirm Logout
              </h3>
              <p className="text-sm text-gray-600 text-center mb-6">
                Are you sure you want to sign out?
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium transition-colors"
                >
                  Logout
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Layout */}
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-emerald-50/20">
        {/* Desktop: Content with sidebar offset */}
        {/* Mobile: Content with top header and bottom nav padding */}
        <main className="lg:pl-72 pt-10 lg:pt-0 pb-20 lg:pb-0">{children}</main>
      </div>
    </>
  );
}
