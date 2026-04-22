"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Zap, Droplet, CheckCircle2, AlertCircle, Loader2, Calendar, Info } from "lucide-react";
import axios from "axios";

interface PropertyBulkMeterReadingModalProps {
  isOpen: boolean;
  onClose: () => void;
  property_id: string;
  onSuccess?: () => void;
}

interface UnitReading {
  unit_id: number;
  unit_name: string;
  electricity_billing_type?: string;
  water_billing_type?: string;
  prev_electric_reading?: number;
  prev_water_reading?: number;
  prev_period_end?: string;
  curr_electric_reading?: number;
  curr_water_reading?: number;
  electric_previous: string;
  electric_current: string;
  water_previous: string;
  water_current: string;
  period_end?: string;
}

interface PropertyRatesData {
  created_at?: string;
  electricity?: { total: number; consumption: number; rate: number } | null;
  water?: { total: number; consumption: number; rate: number } | null;
}

export default function PropertyBulkMeterReadingModal({
  isOpen,
  onClose,
  property_id,
  onSuccess,
}: PropertyBulkMeterReadingModalProps) {
  const [readings, setReadings] = useState<UnitReading[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successUnits, setSuccessUnits] = useState<number[]>([]);
  const [errorUnits, setErrorUnits] = useState<number[]>([]);
  const [propertyRates, setPropertyRates] = useState<PropertyRatesData | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [propertyDetails, setPropertyDetails] = useState<{
    property_name: string;
    electricity_billing_type?: string;
    water_billing_type?: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen && property_id) {
      fetchUnits();
      setSuccessUnits([]);
      setErrorUnits([]);
      setPropertyRates(null);
    }
  }, [isOpen, property_id]);

  const fetchUnits = async () => {
    setLoading(true);
    try {
      const [unitsRes, ratesRes] = await Promise.all([
        axios.get(`/api/landlord/properties/getUnitsForMeterReading`, {
          params: { property_id },
        }),
        axios.get("/api/landlord/billing/checkPropertyBillingStats", {
          params: { property_id },
        }),
      ]);

      const unitsWithLeases = unitsRes.data?.units || [];
      setPropertyRates(ratesRes.data?.billingData || null);
      setPropertyDetails(unitsRes.data?.property || null);

      const today = new Date().toISOString().split("T")[0];

      const initialReadings: UnitReading[] = unitsWithLeases.map((unit: any) => {
        const hasCurr = unit.curr_electric_reading || unit.curr_water_reading;
        
        return {
          unit_id: unit.unit_id,
          unit_name: unit.unit_name,
          electricity_billing_type: unit.electricity_billing_type,
          water_billing_type: unit.water_billing_type,
          prev_electric_reading: unit.prev_electric_reading,
          prev_water_reading: unit.prev_water_reading,
          prev_period_end: unit.prev_period_end,
          curr_electric_reading: unit.curr_electric_reading,
          curr_water_reading: unit.curr_water_reading,
          electric_previous: unit.prev_electric_reading != null ? String(unit.prev_electric_reading) : "",
          electric_current: hasCurr ? String(unit.curr_electric_reading || "") : "",
          water_previous: unit.prev_water_reading != null ? String(unit.prev_water_reading) : "",
          water_current: hasCurr ? String(unit.curr_water_reading || "") : "",
          period_end: today,
        };
      });

      setReadings(initialReadings);
    } catch (err) {
      console.error("Error fetching units:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateReading = (unitId: number, field: "electric_previous" | "electric_current" | "water_previous" | "water_current", value: string) => {
    setReadings(prev =>
      prev.map(r => (r.unit_id === unitId ? { ...r, [field]: value } : r))
    );
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setSuccessUnits([]);
    setErrorUnits([]);

    try {
      const periodStart = readings[0]?.period_start || "";
      const periodEnd = readings[0]?.period_end || "";

      const readingsToSave = readings
        .filter(r =>
          (r.electricity_billing_type === "submetered" && (r.electric_previous || r.electric_current)) ||
          (r.water_billing_type === "submetered" && (r.water_previous || r.water_current))
        )
        .map(r => ({
          unit_id: r.unit_id,
          electric_previous: r.electricity_billing_type === "submetered" ? r.electric_previous : null,
          electric_current: r.electricity_billing_type === "submetered" ? r.electric_current : null,
          water_previous: r.water_billing_type === "submetered" ? r.water_previous : null,
          water_current: r.water_billing_type === "submetered" ? r.water_current : null,
          period_start: r.period_start || periodStart,
          period_end: r.period_end || periodEnd,
        }));

      const res = await axios.post("/api/landlord/properties/bulkMeterReading", {
        readings: readingsToSave,
      });

      if (res.data?.results) {
        res.data.results.forEach((result: any) => {
          if (result.success) setSuccessUnits(prev => [...prev, result.unit_id]);
          else setErrorUnits(prev => [...prev, result.unit_id]);
        });
      }

      onSuccess?.();
    } catch (err) {
      console.error("Error saving readings:", err);
    } finally {
      setSaving(false);
    }
  };

  const hasAnyReading = readings.some(
    r => (r.electricity_billing_type === "submetered" && (r.electric_previous || r.electric_current)) ||
         (r.water_billing_type === "submetered" && (r.water_previous || r.water_current))
  );

  const hasWater = propertyDetails?.water_billing_type === "submetered";
  const hasElectric = propertyDetails?.electricity_billing_type === "submetered";

  const currentMonthYear = useMemo(() => {
    return new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, []);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatMonthYear = (dateStr?: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden border flex flex-col">
        {/* HEADER */}
        <div className="sticky top-0 bg-white px-4 sm:px-6 py-4 border-b flex justify-between items-start gap-3 z-10">
          <div className="flex gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-blue-500/25 flex-shrink-0">
              <Zap className="h-5 w-5 text-white" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  {propertyDetails?.property_name || "Meter Readings"}
                </h2>
                <button
                  onClick={() => setShowInfo(true)}
                  className="text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <Info className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>

              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs text-gray-500">{readings.length} units</span>
                <span className="text-gray-300">•</span>
                <div className="flex items-center gap-1 text-xs text-gray-600 font-medium">
                  <Calendar className="w-3 h-3" />
                  <span>Meter Reading for {currentMonthYear}</span>
                </div>
              </div>
            </div>
          </div>

          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2 text-sm text-gray-500">Loading units...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Property Rates Card */}
              <div className="bg-gradient-to-r from-blue-50 to-emerald-50 rounded-xl border border-blue-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <span className="text-base font-bold text-gray-900">Current Rates</span>
                  </div>
                  {propertyRates?.created_at && (
                    <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                      {formatMonthYear(propertyRates.created_at)}
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-500 mb-4">
                  Rates for the current billing period
                  {propertyRates?.created_at && (
                    <span className="ml-1">({formatDate(propertyRates.created_at)})</span>
                  )}
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {hasElectric && propertyRates?.electricity && (
                    <div className="bg-white rounded-lg border-2 border-amber-200 px-4 py-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Zap className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-semibold text-gray-600">Electricity</span>
                      </div>
                      <div className="text-xl font-bold text-amber-600">
                        ₱{propertyRates.electricity.rate.toFixed(2)}
                        <span className="text-xs font-normal text-gray-400">/kWh</span>
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1">
                        {propertyRates.electricity.consumption} kWh consumed
                      </div>
                    </div>
                  )}

                  {hasWater && propertyRates?.water && (
                    <div className="bg-white rounded-lg border-2 border-blue-200 px-4 py-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Droplet className="w-4 h-4 text-blue-500" />
                        <span className="text-xs font-semibold text-gray-600">Water</span>
                      </div>
                      <div className="text-xl font-bold text-blue-600">
                        ₱{propertyRates.water.rate.toFixed(2)}
                        <span className="text-xs font-normal text-gray-400">/m³</span>
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1">
                        {propertyRates.water.consumption} m³ consumed
                      </div>
                    </div>
                  )}

                  {(!propertyRates?.electricity && !propertyRates?.water) && (
                    <div className="col-span-2 text-center py-3 bg-amber-50 rounded-lg border border-amber-200">
                      <span className="text-sm text-amber-600 font-medium">Rates not set for this period</span>
                      <p className="text-xs text-amber-500 mt-1">Set rates in Property → Billing → Set Rates</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Desktop Table Header */}
              <div className="hidden sm:grid sm:grid-cols-12 gap-2 px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                <div className="col-span-3">Unit</div>
                {hasWater && (
                  <div className="col-span-4 flex items-center gap-1"><Droplet className="w-3 h-3 text-blue-500" /> Water</div>
                )}
                {hasElectric && (
                  <div className="col-span-4 flex items-center gap-1"><Zap className="w-3 h-3 text-amber-500" /> Electricity</div>
                )}
                <div className="col-span-1"></div>
              </div>

              {/* Unit Readings */}
              {readings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No units with active leases found.</p>
                </div>
              ) : (
                readings.map((reading) => {
                  const isSuccess = successUnits.includes(reading.unit_id);
                  const isError = errorUnits.includes(reading.unit_id);
                  const waterUsage = reading.water_previous && reading.water_current
                    ? Math.max(0, Number(reading.water_current) - Number(reading.water_previous))
                    : null;
                  const elecUsage = reading.electric_previous && reading.electric_current
                    ? Math.max(0, Number(reading.electric_current) - Number(reading.electric_previous))
                    : null;

                  return (
                    <div
                      key={reading.unit_id}
                      className={`rounded-xl border p-2 sm:p-3 transition-all ${
                        isSuccess ? "bg-green-50 border-green-200" : isError ? "bg-red-50 border-red-200" : "bg-white border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {/* Desktop Row */}
                      <div className="hidden sm:grid sm:grid-cols-12 gap-2 items-center">
                        <div className="col-span-3 flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-800">{reading.unit_name}</span>
                          {isSuccess && <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />}
                          {isError && <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />}
                        </div>

                        {hasWater && (
                          <div className="col-span-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1">
                                <label className="block text-[10px] font-medium text-gray-400 mb-1">Prev</label>
                                <input
                                  type="number"
                                  value={reading.water_previous}
                                  onChange={(e) => updateReading(reading.unit_id, "water_previous", e.target.value)}
                                  placeholder="0"
                                  className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                />
                              </div>
                              <div className="flex-1">
                                <label className="block text-[10px] font-medium text-gray-400 mb-1">Curr</label>
                                <input
                                  type="number"
                                  value={reading.water_current}
                                  onChange={(e) => updateReading(reading.unit_id, "water_current", e.target.value)}
                                  placeholder="0"
                                  className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                />
                              </div>
                              {waterUsage !== null && (
                                <div className="text-xs font-medium text-blue-600 whitespace-nowrap pt-4">
                                  {waterUsage} m³
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {hasElectric && (
                          <div className="col-span-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1">
                                <label className="block text-[10px] font-medium text-gray-400 mb-1">Prev</label>
                                <input
                                  type="number"
                                  value={reading.electric_previous}
                                  onChange={(e) => updateReading(reading.unit_id, "electric_previous", e.target.value)}
                                  placeholder="0"
                                  className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                                />
                              </div>
                              <div className="flex-1">
                                <label className="block text-[10px] font-medium text-gray-400 mb-1">Curr</label>
                                <input
                                  type="number"
                                  value={reading.electric_current}
                                  onChange={(e) => updateReading(reading.unit_id, "electric_current", e.target.value)}
                                  placeholder="0"
                                  className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                                />
                              </div>
                              {elecUsage !== null && (
                                <div className="text-xs font-medium text-amber-600 whitespace-nowrap pt-4">
                                  {elecUsage} kWh
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="col-span-1 flex justify-end">
                          {isSuccess && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                          {isError && <AlertCircle className="w-5 h-5 text-red-600" />}
                        </div>
                      </div>

                      {/* Mobile Card */}
                      <div className="sm:hidden space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-800">{reading.unit_name}</span>
                          {isSuccess && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                          {isError && <AlertCircle className="w-4 h-4 text-red-600" />}
                        </div>

                        {hasWater && (
                          <div className="bg-blue-50 rounded-lg border border-blue-200 p-2.5">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1.5">
                                <Droplet className="w-3.5 h-3.5 text-blue-500" />
                                <span className="text-xs font-semibold text-gray-700">Water</span>
                              </div>
                              {waterUsage !== null && (
                                <span className="text-xs font-medium text-blue-600">{waterUsage} m³</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1">
                                <label className="block text-[10px] font-medium text-gray-400 mb-1">Prev</label>
                                <input
                                  type="number"
                                  value={reading.water_previous}
                                  onChange={(e) => updateReading(reading.unit_id, "water_previous", e.target.value)}
                                  placeholder="0"
                                  className="w-full bg-white border border-gray-200 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                />
                              </div>
                              <div className="flex-1">
                                <label className="block text-[10px] font-medium text-gray-400 mb-1">Curr</label>
                                <input
                                  type="number"
                                  value={reading.water_current}
                                  onChange={(e) => updateReading(reading.unit_id, "water_current", e.target.value)}
                                  placeholder="0"
                                  className="w-full bg-white border border-gray-200 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {hasElectric && (
                          <div className="bg-amber-50 rounded-lg border border-amber-200 p-2.5">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1.5">
                                <Zap className="w-3.5 h-3.5 text-amber-500" />
                                <span className="text-xs font-semibold text-gray-700">Electricity</span>
                              </div>
                              {elecUsage !== null && (
                                <span className="text-xs font-medium text-amber-600">{elecUsage} kWh</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1">
                                <label className="block text-[10px] font-medium text-gray-400 mb-1">Prev</label>
                                <input
                                  type="number"
                                  value={reading.electric_previous}
                                  onChange={(e) => updateReading(reading.unit_id, "electric_previous", e.target.value)}
                                  placeholder="0"
                                  className="w-full bg-white border border-gray-200 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                                />
                              </div>
                              <div className="flex-1">
                                <label className="block text-[10px] font-medium text-gray-400 mb-1">Curr</label>
                                <input
                                  type="number"
                                  value={reading.electric_current}
                                  onChange={(e) => updateReading(reading.unit_id, "electric_current", e.target.value)}
                                  placeholder="0"
                                  className="w-full bg-white border border-gray-200 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="sticky bottom-0 bg-white border-t px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors text-sm"
          >
            Cancel
          </button>

          <button
            disabled={!hasAnyReading || saving || !readings[0]?.period_end}
            onClick={handleSaveAll}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 text-sm ${
              hasAnyReading && !saving && readings[0]?.period_end
                ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-lg hover:shadow-xl active:scale-[0.98]"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Save All Readings
              </>
            )}
          </button>
        </div>
      </div>

      {/* INFO MODAL */}
      {showInfo && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowInfo(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-5 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600" />
                How Meter Readings Work
              </h3>
              <button
                onClick={() => setShowInfo(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span><strong>Previous reading</strong> is auto-filled from the last recorded meter reading for each unit.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span><strong>Current reading</strong> is the new meter value you enter today.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span><strong>Usage</strong> is calculated as Current − Previous and must be positive.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span><strong>Period dates</strong> shown in the header represent the range from the last reading date to today's reading date.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">⚠</span>
                <span>Property rates shown above are set at the property level and used to compute tenant billing costs.</span>
              </li>
            </ul>

            <div className="mt-5">
              <button
                onClick={() => setShowInfo(false)}
                className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-xl font-semibold"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
