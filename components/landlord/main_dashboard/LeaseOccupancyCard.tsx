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
      className="group relative flex items-center gap-2 px-2 lg:px-3 py-2 cursor-pointer transition-all duration-200 hover:bg-gray-50 rounded-lg lg:rounded-xl"
    >
      <div
        className={`w-8 h-8 lg:w-9 lg:h-9 rounded-lg lg:rounded-xl flex items-center justify-center shrink-0 ${
          lease.type === "draft"
            ? "bg-indigo-100 text-indigo-600"
            : lease.type === "prospective"
            ? "bg-emerald-100 text-emerald-600"
            : "bg-orange-100 text-orange-600"
        }`}
      >
        {lease.type === "draft" ? (
          <FileText className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
        ) : lease.type === "prospective" ? (
          <Users className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
        ) : (
          <Clock className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[10px] lg:text-xs font-medium text-gray-400 truncate">{lease.property_name}</p>
        <p className="text-xs lg:text-sm font-semibold text-gray-900 truncate">{lease.unit}</p>
        <p className="text-[10px] lg:text-xs text-gray-500 truncate">{lease.tenant || "No tenant"}</p>
      </div>

      {lease.type === "ending" && lease.daysLeft !== undefined && (
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
            lease.daysLeft <= 7 ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
          }`}
        >
          {lease.daysLeft}d
        </span>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          goToLease(lease);
        }}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md text-gray-400 hover:text-blue-600"
      >
        <Eye className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  const EmptyMessage = ({ message }: { message: string }) => (
    <div className="px-3 py-4 text-center text-xs text-gray-400 italic">{message}</div>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="px-3 lg:px-4 py-2.5 lg:py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-sm lg:text-base font-semibold text-gray-900">Lease &amp; Occupancy</h3>
          <span className="text-[10px] text-gray-500 hidden lg:block">Action required</span>
        </div>
      </div>

      {isLoading ? (
        <div className="px-3 py-6 text-center text-xs text-gray-500">Loading...</div>
      ) : error ? (
        <div className="px-3 py-6 text-center text-xs text-red-500">Failed to load</div>
      ) : (
        <div className="divide-y divide-gray-100">
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
      <div className="flex items-center justify-between px-2 lg:px-3 py-1.5 bg-gray-50">
        <span className="text-[10px] lg:text-xs font-semibold text-gray-600 uppercase tracking-wide">
          {title}
        </span>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-600">
          {count}
        </span>
      </div>
      <div className="py-1">{children}</div>
    </div>
  );
}