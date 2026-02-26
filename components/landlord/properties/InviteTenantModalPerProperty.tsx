"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { HelpCircle } from "lucide-react";
import { useOnboarding } from "@/hooks/useOnboarding";
import { inviteTenantTourSteps } from "@/lib/onboarding/inviteTenantTourSteps";

interface Props {
  propertyId: string | number;
  onClose: () => void;
}

export default function InviteTenantModal({ propertyId, onClose }: Props) {
  const [email, setEmail] = useState("");
  const [unitId, setUnitId] = useState("");
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(true);

  const [setDatesNow, setSetDatesNow] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  /* ---------------- Onboarding Tour ---------------- */
  const { startTour } = useOnboarding({
    tourId: "invite_tenant_modal",
    steps: inviteTenantTourSteps,
    autoStart: true,
  });

  useEffect(() => {
    if (!propertyId) return;

    async function fetchUnits() {
      setLoadingUnits(true);
      try {
        const res = await axios.get(`/api/properties/${propertyId}/units`);
        setUnits(res.data.data || []);
      } catch (err) {
        console.error(err);
        Swal.fire("Error", "Failed to load units.", "error");
      } finally {
        setLoadingUnits(false);
      }
    }

    fetchUnits();
  }, [propertyId]);

  const handleInvite = async () => {
    if (!email || !unitId) {
      Swal.fire(
        "Missing Information",
        "Tenant email and unit are required.",
        "warning",
      );
      return;
    }

    if (setDatesNow) {
      if (!startDate || !endDate) {
        Swal.fire(
          "Missing Dates",
          "Please provide both start and end dates.",
          "warning",
        );
        return;
      }
      if (new Date(startDate) >= new Date(endDate)) {
        Swal.fire(
          "Invalid Dates",
          "End date must be after start date.",
          "warning",
        );
        return;
      }
    }

    const selectedUnit = units.find(
      (u) => String(u.unit_id) === String(unitId),
    );
    if (!selectedUnit) {
      Swal.fire("Error", "Selected unit not found.", "error");
      return;
    }

    setLoading(true);
    try {
      await axios.post("/api/invite", {
        email,
        unitId,
        unitName: selectedUnit.unit_name,
        datesDeferred: !setDatesNow,
        startDate: setDatesNow ? startDate : null,
        endDate: setDatesNow ? endDate : null,
      });

      Swal.fire(
        "Invitation Sent",
        "The tenant has been invited successfully.",
        "success",
      );
      onClose();
    } catch (err: any) {
      Swal.fire(
        "Error",
        err?.response?.data?.error || "Failed to send invite.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full relative">
        {/* Close */}
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          onClick={onClose}
        >
          ✕
        </button>

        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-gray-800">Invite Tenant</h2>
          <button
            onClick={startTour}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors mr-6"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Guide
          </button>
        </div>

        {/* Email */}
        <label className="text-sm font-medium text-gray-700">
          Tenant Email
        </label>
        <input
          id="invite-tenant-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tenant@email.com"
          className="w-full mt-1 mb-4 px-3 py-2 border rounded-lg focus:ring-emerald-500"
        />

        {/* Unit */}
        <label className="text-sm font-medium text-gray-700">Select Unit</label>
        <select
          id="invite-tenant-unit"
          value={unitId}
          onChange={(e) => setUnitId(e.target.value)}
          disabled={loadingUnits}
          className="w-full mt-1 mb-4 px-3 py-2 border rounded-lg bg-white focus:ring-emerald-500"
        >
          <option value="">Select a unit</option>
          {!loadingUnits &&
            units
              .filter((u) => u.status === "unoccupied")
              .map((unit) => (
                <option key={unit.unit_id} value={String(unit.unit_id)}>
                  {unit.unit_name} - {unit?.status}
                </option>
              ))}
        </select>

        {/* Lease Date Toggle */}
        <div
          id="invite-tenant-dates-toggle"
          className="mb-4 p-3 rounded-lg border bg-gray-50"
        >
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={setDatesNow}
              onChange={() => setSetDatesNow((prev) => !prev)}
              className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            Set lease dates now
          </label>
          <p className="text-xs text-gray-500 mt-1">
            You can also set lease dates later during agreement setup.
          </p>
        </div>

        {/* Conditional Dates */}
        {setDatesNow && (
          <>
            <label className="text-sm font-medium text-gray-700">
              Lease Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full mt-1 mb-4 px-3 py-2 border rounded-lg focus:ring-emerald-500"
            />

            <label className="text-sm font-medium text-gray-700">
              Lease End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full mt-1 mb-4 px-3 py-2 border rounded-lg focus:ring-emerald-500"
            />
          </>
        )}

        {/* Submit */}
        <button
          id="invite-tenant-submit"
          onClick={handleInvite}
          disabled={loading}
          className="w-full py-2 bg-gradient-to-r from-blue-600 to-emerald-600
                               text-white font-semibold rounded-lg shadow-md
                               hover:from-blue-700 hover:to-emerald-700
                               transition-all disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send Invitation"}
        </button>
      </div>
    </div>
  );
}
