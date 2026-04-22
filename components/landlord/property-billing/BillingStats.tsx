"use client";

import { Building2, FileCheck, FileX, BadgeCheck, Banknote, TrendingUp } from "lucide-react";

const statConfigs = [
  { key: "total", label: "Total Units", icon: Building2, bg: "from-slate-500 to-slate-600", shadow: "shadow-slate-500/25" },
  { key: "withBill", label: "With Bills", icon: FileCheck, bg: "from-blue-500 to-blue-600", shadow: "shadow-blue-500/25" },
  { key: "withoutBill", label: "Without Bills", icon: FileX, bg: "from-red-500 to-red-600", shadow: "shadow-red-500/25" },
  { key: "paid", label: "Paid", icon: BadgeCheck, bg: "from-emerald-500 to-emerald-600", shadow: "shadow-emerald-500/25" },
  { key: "amount", label: "Total Due", icon: Banknote, bg: "from-amber-500 to-amber-600", shadow: "shadow-amber-500/25" },
  { key: "completion", label: "Completion", icon: TrendingUp, bg: "from-purple-500 to-purple-600", shadow: "shadow-purple-500/25" },
];

const mobileStatConfigs = [
  { key: "paid", label: "Paid", icon: BadgeCheck, bg: "from-emerald-500 to-emerald-600", shadow: "shadow-emerald-500/25" },
  { key: "amount", label: "Total Due", icon: Banknote, bg: "from-amber-500 to-amber-600", shadow: "shadow-amber-500/25" },
  { key: "completion", label: "Completion", icon: TrendingUp, bg: "from-purple-500 to-purple-600", shadow: "shadow-purple-500/25" },
];

export default function BillingStats({ bills }: any) {
  const stats = {
    total: bills.length,
    withBill: bills.filter((b: any) => b.billing_status !== "no_bill").length,
    withoutBill: bills.filter((b: any) => b.billing_status === "no_bill").length,
    paid: bills.filter((b: any) => b.billing_status?.toLowerCase() === "paid").length,
    amount: `₱${bills.reduce((sum: number, b: any) => sum + +b.total_amount_due || 0, 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
    completion: bills.length === 0 ? "0%" : Math.round((bills.filter((b: any) => b.billing_status !== "no_bill").length / bills.length) * 100) + "%",
  };

  const getValue = (key: string) => {
    if (key === "amount") return stats.amount;
    if (key === "completion") return stats.completion;
    return stats[key as keyof typeof stats];
  };

  const getColor = (key: string) => {
    const colors: Record<string, string> = {
      withBill: "text-blue-700",
      withoutBill: "text-red-600",
      paid: "text-emerald-600",
      amount: "text-amber-600",
      completion: "text-purple-600",
    };
    return colors[key] || "text-gray-900";
  };

  return (
    <>
      <div className="grid grid-cols-3 gap-2 mb-3 md:hidden">
        {mobileStatConfigs.map((config) => (
          <Stat key={config.key} {...config} value={getValue(config.key)} color={getColor(config.key)} />
        ))}
      </div>
      <div id="billing-stats-section" className="hidden md:grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6 mt-4">
        {statConfigs.map((config) => (
          <Stat key={config.key} {...config} value={getValue(config.key)} color={getColor(config.key)} />
        ))}
      </div>
    </>
  );
}

function Stat({ label, value, icon: Icon, bg, shadow, color }: any) {
  return (
    <div className="relative overflow-hidden p-3 bg-white rounded-xl shadow-md border border-gray-100">
      <div className={`absolute -right-3 -top-3 w-12 h-12 rounded-full bg-gradient-to-br ${bg} opacity-10`} />
      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${bg} flex items-center justify-center shadow-sm ${shadow}`}>
        <Icon className="w-3.5 h-3.5 text-white" />
      </div>
      <p className="text-[10px] text-gray-500 mt-2 font-medium">{label}</p>
      <p className={`text-lg font-bold ${color} mt-0.5`}>{value}</p>
    </div>
  );
}
