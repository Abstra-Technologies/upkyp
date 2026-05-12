"use client";

import { useRouter } from "next/navigation";
import useSWR from "swr";
import axios from "axios";
import {
  AlertTriangle,
  CalendarClock,
  FileText,
  Users,
  ChevronRight,
  Home,
} from "lucide-react";

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

const CATEGORY_META: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; bg: string; dot: string; text: string }
> = {
  ending: {
    label: "Ending Soon",
    icon: CalendarClock,
    bg: "bg-orange-50",
    dot: "bg-orange-500",
    text: "text-orange-700",
  },
  prospective: {
    label: "Prospective",
    icon: Users,
    bg: "bg-emerald-50",
    dot: "bg-emerald-500",
    text: "text-emerald-700",
  },
  drafts: {
    label: "Drafts",
    icon: FileText,
    bg: "bg-indigo-50",
    dot: "bg-indigo-500",
    text: "text-indigo-700",
  },
};

export default function LeaseOccupancyCard({ landlord_id }: Props) {
  const router = useRouter();

  const { data: leases = [], isLoading, error } = useSWR<LeaseItem[]>(
    landlord_id
      ? `/api/landlord/leases/attention?landlord_id=${landlord_id}`
      : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60_000 },
  );

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

  const grouped = {
    ending: leases.filter((l) => l.type === "ending"),
    prospective: leases.filter((l) => l.type === "prospective"),
    drafts: leases.filter((l) => l.type === "draft"),
  };

  const total = leases.length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Home className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-bold text-gray-900">Lease & Occupancy</h3>
        </div>
        {total > 0 && (
          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-gray-100 text-gray-600">
            {total} pending
          </span>
        )}
      </div>

      <div className="divide-y divide-gray-50">
        {Object.entries(grouped).map(([key, items]) => {
          const meta = CATEGORY_META[key];
          if (items.length === 0) return null;

          return (
            <div key={key} className={`px-4 py-3 ${meta.bg} space-y-2`}>
              <div className="flex items-center gap-2">
                <meta.icon className={`w-4 h-4 ${meta.text}`} />
                <span className={`text-xs font-bold uppercase tracking-wider ${meta.text}`}>
                  {meta.label}
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white ${meta.text}`}>
                  {items.length}
                </span>
              </div>

              <div className="space-y-1.5">
                {items.map((item) => (
                  <button
                    key={item.lease_id || `${item.property_id}-${item.unit}`}
                    onClick={() =>
                      router.push(
                        `/landlord/properties/${item.property_id}/activeLease`,
                      )
                    }
                    className="w-full flex items-center gap-3 px-3 py-2.5 bg-white rounded-lg active:scale-[0.98] transition-all text-left shadow-sm border border-gray-100"
                  >
                    <div
                      className={`w-2 h-2 rounded-full shrink-0 ${meta.dot}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-gray-900 truncate">
                          {item.unit}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-gray-500 truncate">
                          {item.tenant}
                        </span>
                        {item.property_name && (
                          <>
                            <span className="text-[8px] text-gray-300">|</span>
                            <span className="text-[10px] text-gray-400 truncate">
                              {item.property_name}
                            </span>
                          </>
                        )}
                        {item.daysLeft !== undefined && (
                          <>
                            <span className="text-[8px] text-gray-300">|</span>
                            <span className="text-[10px] font-semibold text-orange-600">
                              {item.daysLeft}d
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        {total === 0 && (
          <div className="px-4 py-6 text-center">
            <AlertTriangle className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-xs text-gray-400">No pending leases</p>
          </div>
        )}
      </div>
    </div>
  );
}
