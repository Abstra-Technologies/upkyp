"use client";

import {
  CreditCardIcon,
  DocumentTextIcon,
  BellIcon,
  WrenchScrewdriverIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

interface QuickActionButtonsProps {
  agreement_id: string;
}

export default function QuickActionButtons({
  agreement_id,
}: QuickActionButtonsProps) {
  const router = useRouter();

  const actions = [
    {
      label: "Billing",
      icon: CreditCardIcon,
      href: `/tenant/rentalPortal/${agreement_id}/billing?agreement_id=${agreement_id}`,
      color: "blue",
    },
    {
      label: "Payments",
      icon: DocumentTextIcon,
      href: `/tenant/rentalPortal/${agreement_id}/paymentHistory?agreement_id=${agreement_id}`,
      color: "emerald",
    },
    {
      label: "Updates",
      icon: BellIcon,
      href: `/tenant/rentalPortal/${agreement_id}/announcement?agreement_id=${agreement_id}`,
      color: "purple",
    },
    {
      label: "Maintenance",
      icon: WrenchScrewdriverIcon,
      href: `/tenant/rentalPortal/${agreement_id}/maintenance?agreement_id=${agreement_id}`,
      color: "amber",
    },
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: "bg-blue-50 border-blue-200 text-blue-700",
      emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
      purple: "bg-purple-50 border-purple-200 text-purple-700",
      amber: "bg-amber-50 border-amber-200 text-amber-700",
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    // Only show on mobile
    <section className="md:hidden">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="grid grid-cols-4 gap-3">
          {actions.map(({ label, icon: Icon, href, color }) => (
            <button
              key={label}
              onClick={() => router.push(href)}
              className="flex flex-col items-center gap-2 group"
            >
              <div
                className={`w-12 h-12 rounded-xl ${getColorClasses(
                  color
                )} border flex items-center justify-center transition-all group-hover:shadow-md group-active:scale-95`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                {label}
              </span>
            </button>
          ))}
        </div>

        {/* Back Button */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => router.push("/tenant/my-unit")}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-all text-gray-700 font-medium text-sm"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to My Units
          </button>
        </div>
      </div>
    </section>
  );
}
