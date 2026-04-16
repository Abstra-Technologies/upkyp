"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  UserIcon,
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
  CreditCardIcon,
} from "@heroicons/react/24/outline";
import { Menu, X, ChevronRight, Settings } from "lucide-react";
import useAuthStore from "../../zustand/authStore";
import { logEvent } from "../../utils/gtag";

export default function SideNavProfile() {
  const { user, signOutAdmin, signOut } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = () => {
    if (!user) return;
    if (user?.userType) {
      signOut();
    } else {
      signOutAdmin();
    }
    router.push("/pages/auth/login");
  };

  const menuItems = [
    {
      href: `/pages/commons/profile`,
      icon: UserIcon,
      label: "Profile",
      onClick: () =>
        logEvent("Navigation", "User Interaction", "Clicked Profile Link", 1),
    },
    {
      href: `/pages/commons/profile/security`,
      icon: ShieldCheckIcon,
      label: "Security & Privacy",
      onClick: () =>
        logEvent(
          "Navigation",
          "User Interaction",
          "Clicked Security & Privacy Link",
          1
        ),
    },
    ...(user?.userType === "landlord"
      ? [
          {
            href: "/pages/landlord/subsciption_plan",
            icon: CreditCardIcon,
            label: "View Subscription",
            onClick: () => {},
          },
        ]
      : []),
  ];

  // Determine if user has navbar (tenant has navbar, landlord doesn't)
  const hasNavbar = user?.userType === "tenant";

  // Determine the main page URL based on user type
  const mainPageUrl =
    user?.userType === "landlord"
      ? "/landlord/dashboard"
      : "/tenant/feeds";

  const mainPageLabel =
    user?.userType === "landlord" ? "Back to Dashboard" : "Back to Feeds";

  return (
    <>
      {/* Desktop Sidebar - Conditional top positioning based on navbar */}
      <aside
        className={`hidden md:flex md:flex-col md:fixed md:bottom-0 md:z-40 md:w-72 md:bg-white md:shadow-xl ${
          hasNavbar ? "md:top-16" : "md:top-0"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header with gradient matching landlord layout */}
          <div className="bg-gradient-to-r from-blue-600 to-emerald-600 shadow-sm">
            <div className="px-6 py-5">
              <h1 className="text-lg font-bold text-white mb-2">
                Account Settings
              </h1>
              <p className="text-sm text-white/80">
                Manage your profile and preferences
              </p>
            </div>
          </div>

          {/* Back to Main Page Button */}
          <div className="px-4 pt-4 pb-2">
            <button
              onClick={() => router.push(mainPageUrl)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gradient-to-r from-blue-50 to-emerald-50 hover:from-blue-100 hover:to-emerald-100 rounded-lg transition-all duration-200 group border border-blue-100"
            >
              <svg
                className="w-5 h-5 text-blue-600 group-hover:-translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              <span>{mainPageLabel}</span>
            </button>
          </div>

          {/* User Profile Section */}
          {user && (
            <div className="px-4 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-3 p-2">
                <Image
                  src={
                    user.profilePicture ||
                    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwgEJf3figiiLmSgtwKnEgEkRw1qUf2ke1Bg&s"
                  }
                  alt="Profile"
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user.firstName && user.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user.companyName || user.email}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user.userType === "landlord"
                      ? "Landlord Account"
                      : user.userType === "tenant"
                      ? "Tenant Account"
                      : "Admin Account"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
            <div className="space-y-1">
              {menuItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href + item.label}
                    href={item.href}
                    onClick={item.onClick}
                    className={`
                      relative flex items-center gap-3 px-3 py-2.5 rounded-lg
                      font-medium transition-all duration-200 group
                      ${
                        isActive
                          ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-lg"
                          : "text-gray-700 hover:bg-gray-100 hover:shadow-md"
                      }
                    `}
                  >
                    {/* Active indicator bar */}
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/40 rounded-r-full" />
                    )}
                    <IconComponent
                      className={`w-5 h-5 ${
                        !isActive && "group-hover:text-blue-600"
                      }`}
                    />
                    <span className="text-sm">{item.label}</span>
                    {isActive && (
                      <div className="ml-auto h-2 w-2 rounded-full bg-white/80 animate-pulse"></div>
                    )}
                  </Link>
                );
              })}

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="relative flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all duration-200 group text-red-600 hover:bg-red-50 hover:shadow-md w-full"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </nav>

          {/* Help Section */}
          <div className="px-4 py-4 border-t border-gray-100 bg-gray-50/50">
            <div className="bg-gradient-to-r from-blue-600 to-emerald-600 rounded-xl p-4 text-white">
              <div className="text-sm font-medium mb-1">Need Help?</div>
              <div className="text-xs opacity-90 mb-3">Contact support</div>
              <button className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded-lg transition-colors backdrop-blur-sm">
                Get Support
              </button>
            </div>
          </div>

          {/* Page_footer */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                © {new Date().getFullYear()} UpKyp
              </p>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-500">Connected</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Menu Button - Floating */}
      <div className="md:hidden fixed bottom-24 right-6 z-50">
        <button
          onClick={toggleMobileMenu}
          className={`
            p-4 rounded-full shadow-lg transition-all duration-300 transform
            ${
              isMobileMenuOpen
                ? "bg-red-500 hover:bg-red-600 rotate-90"
                : "bg-gradient-to-r from-blue-600 to-emerald-600 hover:shadow-xl hover:scale-110"
            }
          `}
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Menu className="w-6 h-6 text-white" />
          )}
        </button>
      </div>

      {/* Mobile Menu - Bottom Sheet */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] animate-in fade-in duration-300"
            onClick={toggleMobileMenu}
          />

          {/* Bottom Sheet Menu with slide-up animation */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-3xl shadow-2xl max-h-[80vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300">
            {/* Handle Bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
            </div>

            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-blue-600 to-emerald-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white">Account Settings</h2>
              <p className="text-white/80 text-sm mt-1">
                Manage your profile and preferences
              </p>
            </div>

            {/* User Profile Section - Mobile */}
            {user && (
              <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-emerald-50 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <Image
                    src={
                      user.profilePicture ||
                      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwgEJf3figiiLmSgtwKnEgEkRw1qUf2ke1Bg&s"
                    }
                    alt="Profile"
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user.companyName || user.email}
                    </p>
                    <p className="text-xs text-gray-600">
                      {user.userType === "landlord"
                        ? "Landlord Account"
                        : user.userType === "tenant"
                        ? "Tenant Account"
                        : "Admin Account"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Back to Main Page Button - Mobile */}
            <div className="px-4 pt-4 pb-2 border-b border-gray-100">
              <button
                onClick={() => {
                  router.push(mainPageUrl);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 bg-gradient-to-r from-blue-50 to-emerald-50 hover:from-blue-100 hover:to-emerald-100 rounded-lg transition-all duration-200 group border border-blue-100"
              >
                <svg
                  className="w-5 h-5 text-blue-600 group-hover:-translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                <span>{mainPageLabel}</span>
              </button>
            </div>

            {/* Navigation - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              <nav className="p-4">
                <div className="space-y-3">
                  {menuItems.map((item) => {
                    const IconComponent = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href + item.label}
                        href={item.href}
                        onClick={() => {
                          toggleMobileMenu();
                          item.onClick && item.onClick();
                        }}
                        className={`
                          flex items-center w-full p-4 rounded-2xl transition-all duration-200 border-2
                          ${
                            isActive
                              ? "bg-gradient-to-br from-blue-50 to-emerald-50 border-blue-200 text-blue-700 shadow-md"
                              : "bg-white border-gray-100 hover:border-gray-200 text-gray-700 hover:shadow-md"
                          }
                        `}
                      >
                        <div
                          className={`
                            p-3 rounded-xl mr-4
                            ${
                              isActive
                                ? "bg-gradient-to-r from-blue-100 to-emerald-100"
                                : "bg-gray-50"
                            }
                          `}
                        >
                          <IconComponent
                            className={`w-6 h-6 ${
                              isActive ? "text-blue-700" : "text-gray-500"
                            }`}
                          />
                        </div>
                        <div className="flex-1 text-left">
                          <span className="font-medium text-sm">
                            {item.label}
                          </span>
                        </div>
                        <ChevronRight
                          className={`w-5 h-5 ${
                            isActive ? "text-blue-700" : "text-gray-400"
                          }`}
                        />
                      </Link>
                    );
                  })}

                  {/* Logout Button - Mobile */}
                  <button
                    onClick={() => {
                      toggleMobileMenu();
                      handleLogout();
                    }}
                    className="flex items-center w-full p-4 rounded-2xl transition-all duration-200 border-2 bg-white border-red-100 hover:border-red-200 text-red-700 hover:shadow-md hover:bg-red-50"
                  >
                    <div className="p-3 rounded-xl mr-4 bg-red-50">
                      <ArrowRightOnRectangleIcon className="w-6 h-6 text-red-700" />
                    </div>
                    <div className="flex-1 text-left">
                      <span className="font-medium text-sm">Logout</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-red-400" />
                  </button>
                </div>

                {/* Help Section - Mobile */}
                <div className="mt-6">
                  <div className="bg-gradient-to-r from-blue-600 to-emerald-600 rounded-xl p-4 text-white">
                    <div className="text-sm font-medium mb-1">Need Help?</div>
                    <div className="text-xs opacity-90 mb-3">
                      Contact our support team
                    </div>
                    <button className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded-lg transition-colors backdrop-blur-sm">
                      Get Support
                    </button>
                  </div>
                </div>

                {/* Bottom Padding */}
                <div className="h-6"></div>
              </nav>
            </div>
          </div>
        </>
      )}
    </>
  );
}
