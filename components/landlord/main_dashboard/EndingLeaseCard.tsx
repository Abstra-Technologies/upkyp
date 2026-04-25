"use client";

import { Clock, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import axios from "axios";
import { CARD_CONTAINER, CARD_HOVER } from "@/constant/design-constants";

/* ================= TYPES ================= */
interface EndingLease {
  lease_id?: string;
  property_id: string;
  property_name: string;
  type: "ending";
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
export default function EndingLeaseCard({ landlord_id }: Props) {
  const router = useRouter();

  const {
    data = [],
    isLoading,
    error,
  } = useSWR<EndingLease[]>(
    landlord_id
      ? `/api/landlord/leases/attention?landlord_id=${landlord_id}`
      : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60_000 },
  );

  const endingLeases = data.filter((l) => l.type === "ending");

  /* ================= ITEM ================= */
  const LeaseRow = (lease: EndingLease, idx: number) => (
    <div
      key={`ending-${idx}`}
      className="
        flex items-center gap-3 px-4 py-3
        hover:bg-orange-50 transition
      "
    >
      {/* Icon */}
      <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
        <Clock className="w-4 h-4" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        {/* Property */}
        <p className="text-xs font-semibold text-gray-500 truncate">
          {lease.property_name}
        </p>

        {/* Unit */}
        <p className="text-sm font-semibold text-gray-900 truncate">
          {lease.unit}
        </p>

        {/* Tenant + note */}
        <p className="text-xs text-gray-600 truncate">{lease.tenant}</p>
        <p className="text-[11px] text-gray-400 truncate">{lease.note}</p>
      </div>

      {/* Days Left */}
      {lease.daysLeft !== undefined && (
        <span
          className={`text-[11px] font-bold px-2 py-0.5 rounded-full
            ${
              lease.daysLeft <= 7
                ? "bg-red-100 text-red-700"
                : "bg-orange-100 text-orange-700"
            }`}
        >
          {lease.daysLeft}d
        </span>
      )}

      {/* View Button */}
      <button
        onClick={() =>
          router.push(
            `/landlord/properties/${lease.property_id}/activeLease`,
          )
        }
        className="
          ml-1 p-2 rounded-md
          bg-blue-50 text-blue-600
          hover:bg-blue-100
          transition
        "
        title="View lease"
      >
        <Eye className="w-4 h-4" />
      </button>
    </div>
  );

  /* ================= RENDER ================= */
  return (
    <div className="bg-slate-100 rounded-2xl border border-slate-200 shadow-sm hover:bg-slate-200 hover:border-slate-300 hover:shadow-lg transition-all h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Ending Leases</h3>
        <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-orange-100 text-orange-700">
          {endingLeases.length}
        </span>
      </div>

      {isLoading ? (
        <div className="px-4 py-6 text-center text-sm text-gray-500">
          Loading ending leases…
        </div>
      ) : error ? (
        <div className="px-4 py-6 text-center text-sm text-red-500">
          Failed to load ending leases
        </div>
      ) : endingLeases.length === 0 ? (
        <div className="px-4 py-6 text-center text-xs text-gray-400 italic">
          No leases ending soon
        </div>
      ) : (
        <div className="max-h-[320px] overflow-y-auto divide-y">
          {endingLeases.map(LeaseRow)}
        </div>
      )}
    </div>
  );
}
