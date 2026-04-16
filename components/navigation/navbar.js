"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import useAuthStore from "@/zustand/authStore";
import axios from "axios";
import { useRouter, usePathname } from "next/navigation";
import NotificationSection from "@/components/notification/notifCenter";
import { motion, AnimatePresence } from "motion/react";
import {
  Menu,
  X,
  User,
  ChevronDown,
  LogOut,
  Star,
  Sparkles,
  Building2,
  BookOpen,
  Download,
  HelpCircle,
  ArrowRight,
  Search,
  CreditCard,
  Rss,
  MessageCircle,
  FileText,
  Clock,
  MapPin,
  ChevronRight,
} from "lucide-react";
import { IdCardLanyard } from 'lucide-react';

const Navbar = () => {
  const { user, admin, loading, signOut, signOutAdmin, fetchSession } =
    useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [undecidedApplications, setUndecidedApplications] = useState(0);
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef(null);

  // Check if we're in portal mode (portal has its own navigation)
  const isInPortalMode = pathname?.includes("/rentalPortal/");

  // Check if we're on profile/settings pages (hide navbar on mobile for tenants)
  const isProfilePage = pathname?.includes("/commons/");

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!user && !admin) {
      fetchSession();
    }
  }, [user, admin]);

  // Fetch pending applications for badge
  useEffect(() => {
    if (user?.tenant_id) {
      const loadPending = async () => {
        try {
          const res = await fetch(
            `/api/tenant/applications/pendingApplications?tenant_id=${user.tenant_id}`
          );
          const data = await res.json();
          setUndecidedApplications(data.count || 0);
        } catch (err) {
          console.error("Pending fetch failed:", err);
        }
      };
      loadPending();
    }
  }, [user?.tenant_id]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setDropdownOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  const handleLogout = async () => {
    if (admin) {
      await signOutAdmin();
      router.push("/admin_login");
    } else {
      await signOut();
      router.push("/auth/login");
    }
    setDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  // Main navbar links (shown in header)
  const getMainNavLinks = () => {
    if (admin) {
      return [{ href: "/system_admin/dashboard", label: "Dashboard" }];
    }

    if (!user) {
      return [
        { href: "/public/how-it-works", label: "How It Works" },
        { href: "/find-rent", label: "Find Rent" },
        { href: "/public/pricing", label: "Pricing" },
      ];
    } else if (user?.userType === "tenant") {
      return [
        { href: "/tenant/feeds", label: "Feeds" },
        { href: "/find-rent", label: "Find Rent" },
        { href: "/tenant/my-unit", label: "My Units" },
        { href: "/tenant/chat", label: "Chats" },
      ];
    }

    return [];
  };

  // All navigation links for mobile menu
  const getAllNavLinks = () => {
    if (admin) {
      return [
        {
          href: "/system_admin/dashboard",
          label: "Dashboard",
          icon: Building2,
        },
      ];
    }

    if (!user) {
      return [
        {
          href: "/public/how-it-works",
          label: "How It Works",
          icon: HelpCircle,
        },
        { href: "/find-rent", label: "Find Rent", icon: Search },
        {
          href: "/public/download",
          label: "Download App",
          icon: Download,
        },
        { href: "/public/blogs", label: "Blogs", icon: BookOpen },
        { href: "/public/pricing", label: "Pricing", icon: CreditCard },
      ];
    } else if (user?.userType === "tenant") {
      return [
        { href: "/tenant/feeds", label: "Feeds", icon: Rss },
        { href: "/find-rent", label: "Find Rent", icon: Search },
        { href: "/tenant/my-unit", label: "My Units", icon: Building2 },
        { href: "/tenant/chat", label: "Chats", icon: MessageCircle },
        {
          href: "/tenant/myApplications",
          label: "My Applications",
          icon: FileText,
          badge: undecidedApplications > 0 ? undecidedApplications : null,
        },
        {
          href: "/tenant/visit-history",
          label: "Visit History",
          icon: MapPin,
        },
        {
          href: "/tenant/unitHistory",
          label: "Unit History",
          icon: Clock,
        },
      ];
    }

    return [];
  };

  // Dropdown menu items (quick access in profile dropdown)
  const getDropdownLinks = () => {
    if (user?.userType === "tenant") {
      return [
        { href: "/tenant/my-unit", label: "My Units", icon: Building2 },
          // { href: "/tenant/kypId", label: "My Kyp ID", icon: IdCardLanyard  },
          {
          href: "/tenant/myApplications",
          label: "My Applications",
          icon: FileText,
          badge: undecidedApplications > 0 ? undecidedApplications : null,
        },
        {
          href: "/tenant/visit-history",
          label: "Visit History",
          icon: MapPin,
        },
        {
          href: "/tenant/unitHistory",
          label: "Unit History",
          icon: Clock,
        },
      ];
    }
    return [];
  };

  const mainNavLinks = getMainNavLinks();
  const allNavLinks = getAllNavLinks();
  const dropdownLinks = getDropdownLinks();

  // Don't render navbar for landlords
  if (user?.userType === "landlord") {
    return null;
  }

  // Don't render navbar in portal mode (portal has its own navigation)
  if (isInPortalMode) {
    return null;
  }

  const isActiveLink = (href) =>
    pathname === href || pathname?.startsWith(href + "/");

  return (
    <>
      {/* Desktop Navbar */}
      <nav
        className={`hidden md:block fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/80 backdrop-blur-xl shadow-lg shadow-gray-200/50 border-b border-gray-200/50"
            : "bg-gradient-to-r from-blue-600 to-emerald-600"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link
              href={user?.userType === "tenant" ? "/tenant/feeds" : "/"}
              className="flex items-center space-x-2 transition-opacity hover:opacity-80"
            >
             <span
                 className={`text-xl font-bold ${
                     scrolled || mobileMenuOpen
                         ? "bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent"
                         : "text-white"
                 }`}
             >
  Upkyp
  <span
      className={`ml-1 text-xs align-super font-semibold ${
          scrolled || mobileMenuOpen
              ? "text-emerald-600"
              : "text-emerald-200"
      }`}
  >
    Beta
  </span>
</span>
            </Link>

            {/* Right Side: Navigation + Actions */}
            <div className="flex items-center space-x-3">
              {/* Navigation Links */}
              <div className="hidden lg:flex items-center space-x-1">
                {mainNavLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      scrolled
                        ? isActiveLink(link.href)
                          ? "text-blue-600 bg-blue-50"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        : isActiveLink(link.href)
                        ? "text-white bg-white/20"
                        : "text-white/90 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              {/* User Actions */}
              {loading ? (
                <div className="flex items-center justify-center w-14 h-8">
                  <div
                    className={`animate-spin rounded-full h-5 w-5 border-2 ${
                      scrolled
                        ? "border-blue-200 border-t-blue-600"
                        : "border-white/30 border-t-white"
                    }`}
                  ></div>
                </div>
              ) : !user && !admin ? (
                <div className="flex items-center space-x-3">
                  <Link
                    href="/auth/login"
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      scrolled
                        ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        : "text-white hover:bg-white/10"
                    }`}
                  >
                    Login
                  </Link>
                  <Link
                    href="/auth/selectRole"
                    className={`group px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 ${
                      scrolled
                        ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white hover:shadow-lg hover:shadow-blue-500/25"
                        : "bg-white text-gray-900 hover:bg-blue-50"
                    }`}
                  >
                    Get Started
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <NotificationSection
                    user={user}
                    admin={admin}
                    variant={scrolled ? "light" : "default"}
                  />

                  {/* Profile Dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={toggleDropdown}
                      className={`flex items-center space-x-2 px-2 py-1.5 rounded-xl transition-all duration-200 ${
                        scrolled ? "hover:bg-gray-100" : "hover:bg-white/10"
                      }`}
                    >
                      <div className="relative">
                        <Image
                          src={
                            user?.profilePicture ||
                            admin?.profile_picture ||
                            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwgEJf3figiiLmSgtwKnEgEkRw1qUf2ke1Bg&s"
                          }
                          alt="Profile"
                          width={36}
                          height={36}
                          className="w-9 h-9 object-cover rounded-full ring-2 ring-white/50"
                        />
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
                      </div>
                      <div className="hidden xl:block text-left">
                        <div
                          className={`text-sm font-medium leading-tight ${
                            scrolled ? "text-gray-900" : "text-white"
                          }`}
                        >
                          {user?.firstName && user?.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : user?.companyName ||
                              (admin?.first_name && admin?.last_name)
                            ? `${admin.first_name} ${admin.last_name}`
                            : user?.email || admin?.email}
                        </div>
                        <div
                          className={`text-xs capitalize ${
                            scrolled ? "text-gray-500" : "text-white/70"
                          }`}
                        >
                          {user?.userType || (admin ? "Admin" : "")}
                        </div>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          dropdownOpen ? "rotate-180" : ""
                        } ${scrolled ? "text-gray-500" : "text-white/80"}`}
                      />
                    </button>

                    {/* Dropdown Menu */}
                    <AnimatePresence>
                      {dropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.96 }}
                          transition={{ duration: 0.15, ease: "easeOut" }}
                          className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden z-[60]"
                        >
                          {/* User Info Header */}
                          <div className="px-4 py-4 bg-gradient-to-br from-blue-50 via-white to-emerald-50 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <Image
                                  src={
                                    user?.profilePicture ||
                                    admin?.profile_picture ||
                                    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwgEJf3figiiLmSgtwKnEgEkRw1qUf2ke1Bg&s"
                                  }
                                  alt="Profile"
                                  width={48}
                                  height={48}
                                  className="w-12 h-12 object-cover rounded-xl border-2 border-white shadow-sm"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">
                                  {user?.firstName
                                    ? `${user.firstName} ${user.lastName || ""}`
                                    : admin?.first_name
                                    ? `${admin.first_name} ${
                                        admin.last_name || ""
                                      }`
                                    : "User"}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {user?.email || admin?.email || ""}
                                </p>
                                <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full capitalize">
                                  <Sparkles className="w-3 h-3" />
                                  {user?.userType || (admin ? "Admin" : "")}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Points Section */}
                          {/*{user?.points !== undefined && (*/}
                          {/*  <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-gray-100">*/}
                          {/*    <div className="flex items-center justify-between">*/}
                          {/*      <div className="flex items-center gap-2">*/}
                          {/*        <div className="p-1.5 bg-amber-100 rounded-lg">*/}
                          {/*          <Star className="w-4 h-4 text-amber-600" />*/}
                          {/*        </div>*/}
                          {/*        <span className="text-sm font-medium text-gray-700">*/}
                          {/*          Reward Points*/}
                          {/*        </span>*/}
                          {/*      </div>*/}
                          {/*      <span className="text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">*/}
                          {/*        {user.points}*/}
                          {/*      </span>*/}
                          {/*    </div>*/}
                          {/*  </div>*/}
                          {/*)}*/}

                          {/* Quick Navigation */}
                          {dropdownLinks.length > 0 && (
                            <div className="py-2 border-b border-gray-100">
                              <p className="px-4 py-1 text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Quick Access
                              </p>
                              {dropdownLinks.map(
                                ({ href, label, icon: Icon, badge }) => (
                                  <Link
                                    key={href}
                                    href={href}
                                    onClick={() => setDropdownOpen(false)}
                                    className="px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors group"
                                  >
                                    <div className="p-1.5 bg-gray-100 group-hover:bg-blue-100 rounded-lg transition-colors">
                                      <Icon className="w-4 h-4 text-gray-500 group-hover:text-blue-600" />
                                    </div>
                                    <span className="flex-1 text-sm font-medium text-gray-700 group-hover:text-gray-900">
                                      {label}
                                    </span>
                                    {badge && (
                                      <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                                        {badge}
                                      </span>
                                    )}
                                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500" />
                                  </Link>
                                )
                              )}
                            </div>
                          )}

                          {/* Account Links */}
                          <div className="py-2">
                            {user && (
                              <Link
                                href="/commons/profile"
                                onClick={() => setDropdownOpen(false)}
                                className="px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors group"
                              >
                                <div className="p-1.5 bg-gray-100 group-hover:bg-blue-100 rounded-lg transition-colors">
                                  <User className="w-4 h-4 text-gray-500 group-hover:text-blue-600" />
                                </div>
                                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                                  View Profile
                                </span>
                              </Link>
                            )}

                            {admin && (
                              <Link
                                href={`/system_admin/profile/${admin.admin_id}`}
                                onClick={() => setDropdownOpen(false)}
                                className="px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors group"
                              >
                                <div className="p-1.5 bg-gray-100 group-hover:bg-blue-100 rounded-lg transition-colors">
                                  <User className="w-4 h-4 text-gray-500 group-hover:text-blue-600" />
                                </div>
                                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                                  View Profile
                                </span>
                              </Link>
                            )}
                          </div>

                          {/* Logout */}
                          <div className="border-t border-gray-100 p-2">
                            <button
                              onClick={handleLogout}
                              className="w-full px-4 py-2.5 flex items-center gap-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                            >
                              <div className="p-1.5 bg-red-100 rounded-lg">
                                <LogOut className="w-4 h-4" />
                              </div>
                              <span className="text-sm font-medium">
                                Logout
                              </span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navbar - Hidden on profile pages for logged-in tenants */}
      {!(isProfilePage && user?.userType === "tenant") && (
        <nav className="md:hidden fixed top-0 left-0 right-0 z-50">
          {/* Top Bar */}
          <div
            className={`transition-all duration-300 ${
              scrolled || mobileMenuOpen
                ? "bg-white/90 backdrop-blur-xl shadow-lg border-b border-gray-200/50"
                : "bg-gradient-to-r from-blue-600 to-emerald-600"
            }`}
          >
            <div className="flex justify-between items-center h-14 px-4">
              {/* Logo */}
              <Link
href={user?.userType === "tenant" ? "/tenant/feeds" : "/"}
                className="flex items-center"
              >
             <span
                 className={`text-xl font-bold ${
                     scrolled || mobileMenuOpen
                         ? "bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent"
                         : "text-white"
                 }`}
             >
  Upkyp
  <span
      className={`ml-1 text-xs align-super font-semibold ${
          scrolled || mobileMenuOpen
              ? "text-emerald-600"
              : "text-emerald-200"
      }`}
  >
    Beta
  </span>
</span>
              </Link>

              {/* Right Actions */}
              <div className="flex items-center gap-2">
                {loading ? (
                  <div className="w-8 h-8 flex items-center justify-center">
                    <div
                      className={`animate-spin rounded-full h-5 w-5 border-2 ${
                        scrolled || mobileMenuOpen
                          ? "border-blue-200 border-t-blue-600"
                          : "border-white/30 border-t-white"
                      }`}
                    ></div>
                  </div>
                ) : (
                  <>
                    {(user || admin) && (
                      <NotificationSection
                        user={user}
                        admin={admin}
                        variant={
                          scrolled || mobileMenuOpen ? "light" : "default"
                        }
                      />
                    )}

                    {/* Hamburger Menu Button */}
                    <button
                      onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                      className={`p-2 rounded-lg transition-colors ${
                        scrolled || mobileMenuOpen
                          ? "text-gray-700 hover:bg-gray-100"
                          : "text-white hover:bg-white/10"
                      }`}
                    >
                      {mobileMenuOpen ? (
                        <X className="w-6 h-6" />
                      ) : (
                        <Menu className="w-6 h-6" />
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Menu Overlay */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <>
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 bg-black/20 backdrop-blur-sm"
                  onClick={() => setMobileMenuOpen(false)}
                />

                {/* Menu Panel */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute top-14 left-0 right-0 bg-white border-b border-gray-200 shadow-xl max-h-[calc(100vh-3.5rem)] overflow-y-auto"
                >
                  {/* User Info (if logged in) */}
                  {(user || admin) && (
                    <div className="px-4 py-4 bg-gradient-to-br from-blue-50 via-white to-emerald-50 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <Image
                          src={
                            user?.profilePicture ||
                            admin?.profile_picture ||
                            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwgEJf3figiiLmSgtwKnEgEkRw1qUf2ke1Bg&s"
                          }
                          alt="Profile"
                          width={48}
                          height={48}
                          className="w-12 h-12 object-cover rounded-xl border-2 border-white shadow-sm"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {user?.firstName
                              ? `${user.firstName} ${user.lastName || ""}`
                              : admin?.first_name
                              ? `${admin.first_name} ${admin.last_name || ""}`
                              : "User"}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {user?.email || admin?.email}
                          </p>
                        </div>
                        {user?.points !== undefined && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 rounded-full">
                            <Star className="w-4 h-4 text-amber-600" />
                            <span className="text-sm font-bold text-amber-700">
                              {user.points}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Navigation Links */}
                  <div className="py-2">
                    {allNavLinks.map((link, index) => {
                      const Icon = link.icon;
                      return (
                        <motion.div
                          key={link.href}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                        >
                          <Link
                            href={link.href}
                            className={`flex items-center gap-3 px-4 py-3.5 transition-colors ${
                              isActiveLink(link.href)
                                ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600"
                                : "text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            <div
                              className={`p-2 rounded-lg ${
                                isActiveLink(link.href)
                                  ? "bg-blue-100"
                                  : "bg-gray-100"
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="flex-1 text-sm font-medium">
                              {link.label}
                            </span>
                            {link.badge && (
                              <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                                {link.badge}
                              </span>
                            )}
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* User Actions (if logged in) */}
                  {(user || admin) && (
                    <div className="border-t border-gray-100 py-2">
                      <Link
                        href={
                          user
                            ? "/commons/profile"
                            : `/system_admin/profile/${admin?.admin_id}`
                        }
                        className="flex items-center gap-3 px-4 py-3.5 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <User className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium">
                          View Profile
                        </span>
                      </Link>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3.5 text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <div className="p-2 bg-red-100 rounded-lg">
                          <LogOut className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium">Logout</span>
                      </button>
                    </div>
                  )}

                  {/* Auth Buttons (if not logged in) */}
                  {!user && !admin && !loading && (
                    <div className="border-t border-gray-100 p-4 space-y-3">
                      <Link
                        href="/auth/login"
                        className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                      >
                        Login
                      </Link>
                      <Link
                        href="/auth/selectRole"
                        className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-emerald-600 hover:shadow-lg hover:shadow-blue-500/25 rounded-xl transition-all"
                      >
                        Get Started Free
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </nav>
      )}

      {/* Spacer for fixed navbar - adjust based on profile page */}
      {!(isProfilePage && user?.userType === "tenant") && (
        <div className="h-14 md:h-16" />
      )}
      {/* Desktop only spacer for profile pages */}
      {isProfilePage && user?.userType === "tenant" && (
        <div className="hidden md:block h-16" />
      )}
    </>
  );
};

export default Navbar;
