"use client";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { X, Calendar, Save, CheckCircle } from "lucide-react";

interface ModifyLeaseDatesModalProps {
  isOpen: boolean;
  lease: {
    lease_id: string;
    start_date: string;
    end_date: string;
  } | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModifyLeaseDatesModal({
  isOpen,
  lease,
  onClose,
  onSuccess,
}: ModifyLeaseDatesModalProps) {
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isOpenLease, setIsOpenLease] = useState(false);

  useEffect(() => {
    if (lease && isOpen) {
      const formatDateForInput = (dateStr: string) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        return date.toISOString().split("T")[0];
      };
      setStartDate(formatDateForInput(lease.start_date));
      setEndDate(formatDateForInput(lease.end_date));
      setIsOpenLease(!lease.end_date);
    }
  }, [lease, isOpen]);

  if (!isOpen || !lease) return null;

  const handleSave = async () => {
    if (!startDate) {
      return Swal.fire("Error", "Start date is required.", "error");
    }

    if (!isOpenLease && endDate && endDate <= startDate) {
      return Swal.fire("Error", "End date must be after start date.", "error");
    }

    setLoading(true);

    try {
      const res = await fetch("/api/leaseAgreement/updateLeaseDateSet", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agreement_id: lease.lease_id,
          start_date: startDate,
          end_date: isOpenLease ? null : (endDate || null),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Lease update failed:", data);
        return Swal.fire(
          "Error",
          data.error || "Failed to update lease dates.",
          "error"
        );
      }

      Swal.fire({
        icon: "success",
        title: "Lease Dates Updated!",
        text: isOpenLease
          ? "Lease is now set as open-ended."
          : "Lease dates have been modified successfully.",
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error updating lease:", error);
      Swal.fire(
        "Error",
        "Something went wrong while saving lease dates.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-lg shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-white" />
            <h2 className="text-lg font-bold text-white">
              Modify Lease Dates
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          <p className="text-sm text-gray-600 mb-4">
            Update the lease start and end dates for this agreement.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                End Date
              </label>
              <label className="flex items-center gap-2 mb-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isOpenLease}
                  onChange={(e) => {
                    setIsOpenLease(e.target.checked);
                    if (e.target.checked) setEndDate("");
                  }}
                  className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-sm text-gray-600">Open-ended lease (no end date)</span>
              </label>
              {!isOpenLease && (
                <div className="relative">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}