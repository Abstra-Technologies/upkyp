"use client";

import { FileText, Users, Eye, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import axios from "axios";

/* ================= TYPES ================= */
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
  const ending = leases.filter((l) => l.type === "ending");

  /* ================= NAV ================= */
  const goToLease = (lease: LeaseItem) => {
    if (lease.type === "prospective") {
      router.push(`/landlord/properties/${lease.property_id}/prospectives`);
    } else {
      router.push(`/landlord/properties/${lease.property_id}/activeLease`);
    }
  };

  /* ================= ITEM ================= */
  const Item = ({ lease, idx }: { lease: LeaseItem; idx: number }) => (
    <div
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
              : lease.type === "prospective"
                ? "bg-emerald-50 text-emerald-600"
                : "bg-orange-50 text-orange-600"
          }
        `}
      >
        {lease.type === "draft" ? (
          <FileText className="w-4 h-4" />
        ) : lease.type === "prospective" ? (
          <Users className="w-4 h-4" />
        ) : (
          <Clock className="w-4 h-4" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        {lease.property_name && (
          <p className="text-xs font-semibold text-gray-500 truncate">
            {lease.property_name}
          </p>
        )}
        <p className="text-sm font-medium text-gray-900 truncate">
          {lease.unit}
        </p>
        <p className="text-xs text-gray-600 truncate">{lease.tenant}</p>
        <p className="text-xs text-gray-400 truncate">{lease.note}</p>
      </div>

      {/* Days Left (ending only) */}
      {lease.type === "ending" && lease.daysLeft !== undefined && (
        <span
          className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0
            ${
              lease.daysLeft <= 7
                ? "bg-red-100 text-red-700"
                : "bg-orange-100 text-orange-700"
            }`}
        >
          {lease.daysLeft}d
        </span>
      )}

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
    <div className="bg-slate-100 rounded-2xl border border-slate-200 shadow-sm hover:bg-slate-200 hover:border-slate-300 hover:shadow-lg transition-all h-full flex flex-col">
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
          <Section title="Ending Leases" count={ending.length}>
            <div className="max-h-[180px] overflow-y-auto divide-y">
              {ending.length
                ? ending.slice(0, 3).map((lease, idx) => (
                    <Item key={`ending-${idx}`} lease={lease} idx={idx} />
                  ))
                : Empty("No leases ending soon")}
            </div>
          </Section>

          <Section title="Prospective" count={prospective.length}>
            <div className="max-h-[180px] overflow-y-auto divide-y">
              {prospective.length
                ? prospective.slice(0, 3).map((lease, idx) => (
                    <Item key={`prospective-${idx}`} lease={lease} idx={idx} />
                  ))
                : Empty("No prospective tenants")}
            </div>
          </Section>

          <Section title="Draft Leases" count={drafts.length}>
            <div className="max-h-[180px] overflow-y-auto divide-y">
              {drafts.length
                ? drafts.slice(0, 3).map((lease, idx) => (
                    <Item key={`draft-${idx}`} lease={lease} idx={idx} />
                  ))
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
