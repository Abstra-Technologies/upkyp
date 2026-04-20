"use client";

import { FileText, Users, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import axios from "axios";
import { CARD_CONTAINER, CARD_HOVER } from "@/constant/design-constants";

/* ================= TYPES ================= */
interface LeaseItem {
  lease_id?: string;
  property_id: string;
  type: "draft" | "prospective";
  unit: string;
  tenant: string;
  note: string;
}

interface Props {
  landlord_id: string;
}

/* ================= FETCHER ================= */
const fetcher = (url: string) => axios.get(url).then((res) => res.data);

/* ================= COMPONENT ================= */
export default function LeaseOccupancyCard({ landlord_id }: Props) {
  const router = useRouter();

  const {
    data: leases = [],
    isLoading,
    error,
  } = useSWR<LeaseItem[]>(
    landlord_id
      ? `/api/landlord/leases/attention?landlord_id=${landlord_id}`
      : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60_000 },
  );

  const prospective = leases.filter((l) => l.type === "prospective");
  const drafts = leases.filter((l) => l.type === "draft");

  /* ================= NAV ================= */
  const goToLease = (lease: LeaseItem) => {
    if (lease.type === "prospective") {
      router.push(
        `/landlord/properties/${lease.property_id}/prospectives`,
      );
    } else {
      router.push(
        `/landlord/properties/${lease.property_id}/activeLease`,
      );
    }
  };

  /* ================= ITEM ================= */
  const Item = (lease: LeaseItem, idx: number) => (
    <div
      key={`${lease.type}-${idx}`}
      onClick={() => goToLease(lease)}
      className="
        group relative flex items-center gap-3 px-4 py-3 cursor-pointer
        transition-all duration-200
        hover:bg-gray-50 hover:shadow-sm hover:-translate-y-[1px]
      "
    >
      {/* Icon */}
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0
          ${
            lease.type === "draft"
              ? "bg-indigo-50 text-indigo-600"
              : "bg-emerald-50 text-emerald-600"
          }
        `}
      >
        {lease.type === "draft" ? (
          <FileText className="w-4 h-4" />
        ) : (
          <Users className="w-4 h-4" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {lease.unit}
        </p>
        <p className="text-xs text-gray-600 truncate">{lease.tenant}</p>
        <p className="text-xs text-gray-400 truncate">{lease.note}</p>
      </div>

      {/* View Icon */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          goToLease(lease);
        }}
        className="
          absolute right-3 opacity-0 translate-x-2
          group-hover:opacity-100 group-hover:translate-x-0
          transition-all duration-200
          p-1.5 rounded-md
          text-gray-500 hover:text-blue-600 hover:bg-blue-50
        "
        title="View"
      >
        <Eye className="w-4 h-4" />
      </button>
    </div>
  );

  const Empty = (text: string) => (
    <div className="px-4 py-3 text-xs text-gray-400 italic">{text}</div>
  );

  /* ================= RENDER ================= */
  return (
    <div className="bg-gray-50/50 rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-blue-200 hover:bg-blue-50/30 transition-all h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b">
        <h3 className="text-sm font-semibold text-gray-900">
          Lease & Occupancy
        </h3>
      </div>

      {isLoading ? (
        <div className="px-4 py-6 text-center text-sm text-gray-500">
          Loading lease activity…
        </div>
      ) : error ? (
        <div className="px-4 py-6 text-center text-sm text-red-500">
          Failed to load lease data
        </div>
      ) : (
        <>
          <Section title="Prospective" count={prospective.length}>
            <div className="max-h-[180px] overflow-y-auto divide-y">
              {prospective.length
                ? prospective.slice(0, 3).map(Item)
                : Empty("No prospective tenants")}
            </div>
          </Section>

          <Section title="Draft Leases" count={drafts.length}>
            <div className="max-h-[180px] overflow-y-auto divide-y">
              {drafts.length
                ? drafts.slice(0, 3).map(Item)
                : Empty("No draft leases")}
            </div>
          </Section>
        </>
      )}
    </div>
  );
}

/* ================= SECTION ================= */
function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-t">
        <span className="text-xs font-semibold text-gray-700 uppercase">
          {title}
        </span>
        <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-gray-200 text-gray-700">
          {count}
        </span>
      </div>
      {children}
    </div>
  );
}
