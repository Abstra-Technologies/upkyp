"use client";

import { useMemo } from "react";
import useSWR from "swr";
import axios from "axios";
import { Building2, Users, Box, HardDrive, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

interface UsageData {
  current_properties: number;
  max_properties: number | null;
  current_units: number;
  max_units: number | null;
  current_assets: number;
  max_assets_per_unit: number | null;
  storage_used_mb: number;
  max_storage_mb: number | null;
}

interface Props {
  landlordId: string;
}

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

function UsageBar({ current, max, label, icon: Icon, colorClass }: {
  current: number;
  max: number | null;
  label: string;
  icon: React.ElementType;
  colorClass: string;
}) {
  const isUnlimited = max === null;
  const percentage = isUnlimited ? 0 : Math.min((current / max!) * 100, 100);
  const isNearLimit = !isUnlimited && percentage >= 80;

  return (
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-700">{label}</span>
          <span className="text-xs font-semibold text-gray-900">
            {current}{isUnlimited ? "" : ` / ${max}`}
            {isUnlimited && <span className="text-gray-400 ml-1">unlimited</span>}
          </span>
        </div>
        {isUnlimited ? (
          <div className="flex items-center gap-1 text-xs text-emerald-600">
            <TrendingUp className="w-3 h-3" />
            <span>Available</span>
          </div>
        ) : (
          <>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isNearLimit ? "bg-red-500" : "bg-blue-500"
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            {isNearLimit && (
              <div className="flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3 text-red-500" />
                <span className="text-[10px] text-red-500 font-medium">
                  {Math.round(percentage)}% used
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function SubscriptionUsageCard({ landlordId }: Props) {
  const { data: usage, isLoading } = useSWR<UsageData>(
    landlordId ? `/api/landlord/${landlordId}/usage` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  );

  const totalAssets = useMemo(() => {
    if (!usage) return 0;
    return usage.current_assets;
  }, [usage]);

  const maxAssets = useMemo(() => {
    if (!usage) return null;
    return usage.max_assets_per_unit;
  }, [usage]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all">
      <div className="px-4 py-3 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-gray-900">Usage Summary</h3>
        <p className="text-xs text-gray-500 mt-0.5">Based on your subscription plan</p>
      </div>

      {isLoading ? (
        <div className="px-4 py-6">
          <div className="animate-pulse space-y-3">
            <div className="h-10 bg-gray-100 rounded-lg" />
            <div className="h-10 bg-gray-100 rounded-lg" />
            <div className="h-10 bg-gray-100 rounded-lg" />
            <div className="h-10 bg-gray-100 rounded-lg" />
          </div>
        </div>
      ) : !usage ? (
        <div className="px-4 py-6 text-center">
          <p className="text-xs text-gray-400">No usage data available</p>
        </div>
      ) : (
        <div className="px-4 py-3 space-y-4">
          <UsageBar
            current={usage.current_properties}
            max={usage.max_properties}
            label="Properties"
            icon={Building2}
            colorClass="bg-indigo-50 text-indigo-600"
          />

          <UsageBar
            current={usage.current_units}
            max={usage.max_units}
            label="Units"
            icon={Users}
            colorClass="bg-emerald-50 text-emerald-600"
          />

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-amber-50 text-amber-600">
              <Box className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-700">Total Assets</span>
                <span className="text-xs font-semibold text-gray-900">
                  {totalAssets}
                  {maxAssets === null ? (
                    <span className="text-gray-400 ml-1">unlimited</span>
                  ) : (
                    <span> / {maxAssets}</span>
                  )}
                </span>
              </div>
              {maxAssets === null ? (
                <div className="flex items-center gap-1 text-xs text-emerald-600">
                  <TrendingUp className="w-3 h-3" />
                  <span>Available</span>
                </div>
              ) : (
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((totalAssets / maxAssets) * 100, 100)}%` }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-violet-50 text-violet-600">
              <HardDrive className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-700">Storage</span>
                <span className="text-xs font-semibold text-gray-900">
                  {usage.storage_used_mb.toFixed(1)} MB
                  {usage.max_storage_mb !== null && (
                    <span> / {usage.max_storage_mb} MB</span>
                  )}
                  {usage.max_storage_mb === null && (
                    <span className="text-gray-400 ml-1">unlimited</span>
                  )}
                </span>
              </div>
              {usage.max_storage_mb === null ? (
                <div className="flex items-center gap-1 text-xs text-emerald-600">
                  <TrendingUp className="w-3 h-3" />
                  <span>Available</span>
                </div>
              ) : (
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      (usage.storage_used_mb / usage.max_storage_mb) >= 0.8
                        ? "bg-red-500"
                        : "bg-violet-500"
                    }`}
                    style={{ width: `${Math.min((usage.storage_used_mb / usage.max_storage_mb) * 100, 100)}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}