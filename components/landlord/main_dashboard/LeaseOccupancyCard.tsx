"use client";

import { FileText, Users, Eye, Clock } from "lucide-react";
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

  const goToLease = (lease: LeaseItem) => {
    if (lease.type === "prospective") {
      router.push(`/landlord/properties/${lease.property_id}/prospectives`);
    } else {
      router.push(`/landlord/properties/${lease.property_id}/activeLease`);
    }
  };

  const Item = ({ lease }: { lease: LeaseItem }) => (
    <div
      onClick={() => goToLease(lease)}
      className="group relative flex items-center gap-3 px-3 sm:px-4 py-3 sm:py-4 cursor-pointer transition-all duration-200 hover:bg-gray-50/80 dark:hover:bg-gray-800/50 rounded-xl"
    >
      <div
        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
          lease.type === "draft"
            ? "bg-indigo-100 text-indigo-600"
            : lease.type === "prospective"
            ? "bg-emerald-100 text-emerald-600"
            : "bg-orange-100 text-orange-600"
        }`}
      >
        {lease.type === "draft" ? (
          <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
        ) : lease.type === "prospective" ? (
          <Users className="w-4 h-4 sm:w-5 sm:h-5" />
        ) : (
          <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
        )}
      </div>

      <div className="flex-1 min-w-0 space-y-0.5 sm:space-y-1">
        {lease.property_name && (
          <p className="text-[10px] sm:text-xs font-medium text-gray-400 truncate">{lease.property_name}</p>
        )}
        <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">{lease.unit}</p>
        <p className="text-[10px] sm:text-xs text-gray-500 truncate">{lease.tenant || "No tenant assigned"}</p>
        {lease.note && <p className="text-[10px] sm:text-xs text-gray-400 truncate">{lease.note}</p>}
      </div>

      {lease.type === "ending" && lease.daysLeft !== undefined && (
        <span
          className={`text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg shrink-0 ${
            lease.daysLeft <= 7 ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
          }`}
        >
          {lease.daysLeft}d left
        </span>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          goToLease(lease);
        }}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 sm:p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50"
        title="View"
      >
        <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </button>
    </div>
  );

  const EmptyMessage = ({ message }: { message: string }) => (
    <div className="px-3 sm:px-4 py-6 sm:py-8 text-center text-xs sm:text-sm text-gray-400 italic">{message}</div>
  );

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
      <div className="px-3 sm:px-5 py-3 sm:py-4 border-b border-gray-100 dark:border-gray-800">
        <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">Lease &amp; Occupancy</h3>
        <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">Manage leases and tenant occupancy</p>
      </div>

      {isLoading ? (
        <div className="px-3 sm:px-4 py-6 sm:py-8 text-center text-xs sm:text-sm text-gray-500">Loading...</div>
      ) : error ? (
        <div className="px-3 sm:px-4 py-6 sm:py-8 text-center text-xs sm:text-sm text-red-500">Failed to load</div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          <Section title="Ending Soon" count={ending.length}>
            {ending.length > 0 ? (
              ending.slice(0, 3).map((l, i) => <Item key={`e-${i}`} lease={l} />)
            ) : (
              <EmptyMessage message="No leases ending" />
            )}
          </Section>
          <Section title="Prospective" count={prospective.length}>
            {prospective.length > 0 ? (
              prospective.slice(0, 3).map((l, i) => <Item key={`p-${i}`} lease={l} />)
            ) : (
              <EmptyMessage message="No prospective tenants" />
            )}
          </Section>
          <Section title="Drafts" count={drafts.length}>
            {drafts.length > 0 ? (
              drafts.slice(0, 3).map((l, i) => <Item key={`d-${i}`} lease={l} />)
            ) : (
              <EmptyMessage message="No drafts" />
            )}
          </Section>
        </div>
      )}
    </div>
  );
}

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
      <div className="flex items-center justify-between px-3 sm:px-5 py-2 sm:py-3 bg-gray-50/70 dark:bg-gray-800/50">
        <span className="text-[10px] sm:text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
          {title}
        </span>
        <span className="text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300">
          {count}
        </span>
      </div>
      <div className="py-1 sm:py-2">{children}</div>
    </div>
  );
}