"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  BoltIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";
import { Droplet } from "lucide-react";

interface MeterData {
  reading_id: number;
  previous_reading: number;
  current_reading: number;
  consumption: number;
  reading_date: string;
}

interface UtilityInfo {
  submetered: boolean;
  data: MeterData[] | null;
}

export default function MobileUtilityWidget({
  agreement_id,
}: {
  agreement_id: string;
}) {
  const [loading, setLoading] = useState(true);
  const [water, setWater] = useState<UtilityInfo | null>(null);
  const [electricity, setElectricity] = useState<UtilityInfo | null>(null);
  const [hasSubmeter, setHasSubmeter] = useState(false);

  useEffect(() => {
    if (!agreement_id) {
      setLoading(false);
      return;
    }

    let active = true;

    async function fetchUtility() {
      try {
        const res = await axios.get(
          "/api/tenant/activeRent/utilityConsumption",
          { params: { agreement_id } }
        );

        if (active) {
          if (res.data.submetered) {
            setHasSubmeter(true);
            setWater(res.data.water);
            setElectricity(res.data.electricity);
          }
        }
      } catch {
        console.error("Failed to fetch utility consumption");
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchUtility();
    return () => {
      active = false;
    };
  }, [agreement_id]);

  if (loading || !hasSubmeter) return null;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-2">
      {water?.submetered && water.data && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-2.5">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="p-1 bg-blue-100 rounded">
              <Droplet className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <span className="text-xs font-bold text-blue-900">Water</span>
          </div>

          <div className="space-y-1.5">
            {water.data.slice(0, 2).map((reading, i) => (
              <div
                key={reading.reading_id}
                className={`flex items-center justify-between text-xs ${
                  i > 0 ? "pt-1.5 border-t border-blue-100" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-blue-600">
                    {formatDate(reading.reading_date)}
                  </span>
                  <span className="text-[10px] text-gray-500">
                    {reading.previous_reading} → {reading.current_reading}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <ArrowTrendingUpIcon className="w-3 h-3 text-blue-500" />
                  <span className="text-xs font-bold text-blue-700">
                    {reading.consumption} m³
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {electricity?.submetered && electricity.data && (
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-2.5">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="p-1 bg-amber-100 rounded">
              <BoltIcon className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <span className="text-xs font-bold text-amber-900">Electricity</span>
          </div>

          <div className="space-y-1.5">
            {electricity.data.slice(0, 2).map((reading, i) => (
              <div
                key={reading.reading_id}
                className={`flex items-center justify-between text-xs ${
                  i > 0 ? "pt-1.5 border-t border-amber-100" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-amber-600">
                    {formatDate(reading.reading_date)}
                  </span>
                  <span className="text-[10px] text-gray-500">
                    {reading.previous_reading} → {reading.current_reading}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <ArrowTrendingUpIcon className="w-3 h-3 text-amber-500" />
                  <span className="text-xs font-bold text-amber-700">
                    {reading.consumption} kWh
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
