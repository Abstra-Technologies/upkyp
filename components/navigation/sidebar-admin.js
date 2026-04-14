"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ScrollText, Users2, Users, Building2, Bug, EthernetPort  } from "lucide-react";

export default function SideNavAdmin({ admin }) {
  const pathname = usePathname();

  const sideNavItems = [
    {
      href: "/system_admin/activiyLog",
      icon: ScrollText,
      label: "Activity Log",
    },
    {
      href: "/system_admin/co_admin/list",
      icon: Users2,
      label: "Add Co-admin",
    },
      {
          href: "/system_admin/cms",
          icon: Users2,
          label: "Content Management",
      },
    {
      href: "/system_admin/ip_restrict",
      icon: EthernetPort ,
      label: "IP Configurations",
    },
    {
      href: "/system_admin/tenant_landlord/tenant_mgt",
      icon: Users,
      label: "Tenant Management",
    },
    {
      href: "/system_admin/tenant_landlord/verification",
      icon: Users,
      label: "Landlord Verification",
    },
    {
      href: "/system_admin/tenant_landlord/landlord_mgt",
      icon: Users,
      label: "Landlord Management",
    },
    {
      href: "/system_admin/tenant_landlord/suspendedAccounts",
      icon: Users,
      label: "Suspended Accounts",
    },
    {
      href: "/system_admin/propertyManagement/list",
      icon: Building2,
      label: "Property Verification",
    },
    {
      href: "/system_admin/annoucement",
      icon: ScrollText,
      label: "Announcements",
    },
    {
      href: "/system_admin/bug_report/list",
      icon: Bug,
      label: "Bug Reports",
    },
    {
      href: "/system_admin/deactivatedAccounts",
      icon: Bug,
      label: "DeActivated Account",
    },
    {
      href: "/system_admin/supportIssues",
      icon: ScrollText,
      label: "Support",
    },
  ];

  return (
    <div className="w-64 h-screen bg-white shadow-lg flex flex-col">
      <div className="p-4">
        <div className="flex items-center space-x-2">
          <Home className="w-6 h-6 text-blue-600" />
          <span className="text-xl font-semibold text-blue-600">
            Hestia Admin Portal
          </span>
        </div>
      </div>
      <nav className="mt-4">
        {sideNavItems.map((item, index) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={index}
              href={item.href}
              className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-blue-100 text-blue-700 font-semibold"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <item.icon
                className={`w-5 h-5 mr-3 ${
                  isActive ? "text-blue-700" : "text-gray-500"
                }`}
              />
              {item.label}
              {isActive && (
                <span className="ml-auto h-2 w-2 rounded-full bg-blue-600"></span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
