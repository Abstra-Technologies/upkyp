"use client";

import { FileText, Users, Clock, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import axios from "axios";

interface LeaseItem {
  lease_id?: string;
  property_id: string;
  property_name?: string;
  type: "draft" | "prospective" | "ending";
  unit: string;
  tenant: string;
  note: string;
  daysLeft?: number;
}

interface Props {
  landlord_id: string;
}

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function LeaseOccupancyCard({ landlord_id }: Props) {
  const router = useRouter();

  const { data: leases = [], isLoading, error } = useSWR<LeaseItem[]>(
    landlord_id ? `/api/landlord/leases/attention?landlord_id=${landlord_id}` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60_000 },
  );

  const prospective = leases.filter((l) => l.type === "prospective");
  const drafts = leases.filter((l) => l.type === "draft");
  const ending = leases.filter((l) => l.type === "ending");

  const categories = [
    {
      key: "ending",
      label: "Ending Soon",
      count: ending.length,
      items: ending.slice(0, 3),
      icon: Clock,
      bg: "bg-orange-50",
      iconBg: "bg-orange-100 text-orange-600",
      badge: ending.length > 0 ? "bg-orange-100 text-orange-700" : "",
      href: "/landlord/properties",
    },
    {
      key: "prospective",
      label: "Prospective",
      count: prospective.length,
      items: prospective.slice(0, 3),
      icon: Users,
      bg: "bg-emerald-50",
      iconBg: "bg-emerald-100 text-emerald-600",
      badge: prospective.length > 0 ? "bg-emerald-100 text-emerald-700" : "",
      href: "/landlord/properties",
    },
    {
      key: "drafts",
      label: "Drafts",
      count: drafts.length,
      items: drafts.slice(0, 3),
      icon: FileText,
      bg: "bg-indigo-50",
      iconBg: "bg-indigo-100 text-indigo-600",
      badge: drafts.length > 0 ? "bg-indigo-100 text-indigo-700" : "",
      href: "/landlord/properties",
    },
  ];

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="text-xs text-gray-400 text-center">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="text-xs text-red-500 text-center">Failed to load</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-3 py-2.5 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-900">Lease & Occupancy</h3>
        <span className="text-[9px] text-gray-400">{ending.length + prospective.length + drafts.length} pending</span>
      </div>
      <div className="divide-y divide-gray-50">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => router.push(cat.href)}
            className="w-full flex items-center gap-3 px-3 py-2.5 active:bg-gray-50 transition-colors text-left"
          >
            <div className={`w-9 h-9 rounded-xl ${cat.iconBg} flex items-center justify-center shrink-0`}>
              <cat.icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-900">{cat.label}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${cat.badge || "bg-gray-100 text-gray-500"}`}>
                  {cat.count}
                </span>
              </div>
              {cat.items.length > 0 ? (
                <p className="text-[9px] text-gray-500 truncate mt-0.5">
                  {cat.items.map((i) => i.unit).join(", ")}
                </p>
              ) : (
                <p className="text-[9px] text-gray-400 mt-0.5">None</p>
              )}
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}