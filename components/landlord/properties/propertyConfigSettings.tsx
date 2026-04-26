"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
  Settings,
  Bell,
  Droplets,
  Zap,
  DollarSign,
  AlertCircle,
  Mail,
  MessageSquare,
} from "lucide-react";
import { UTILITY_BILLING_TYPES } from "@/constant/utilityBillingType";
import { useOnboarding } from "@/hooks/useOnboarding";
import { propertyConfigSteps } from "@/lib/onboarding/propertyConfig";

interface PropertyConfigurationProps {
  propertyId: string;
  onUpdate?: () => void;
}

export default function PropertyConfiguration({
  propertyId,
  onUpdate,
}: PropertyConfigurationProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [configForm, setConfigForm] = useState({
    billingReminderDay: 1,
    billingDueDay: 30,
    meterReadingDay: 1,
    notifyEmail: false,
    notifySms: false,
    lateFeeType: "fixed",
    lateFeeAmount: 0,
    gracePeriodDays: 3,
    water_billing_type: "included",
    electricity_billing_type: "included",
  });

  // Initialize onboarding
  const { startTour } = useOnboarding({
    tourId: "property-configuration",
    steps: propertyConfigSteps,
    autoStart: true,
  });

  useEffect(() => {
    if (!propertyId) return;
    const fetchConfig = async () => {
      try {
        const res = await axios.get(
          `/api/landlord/properties/configuration?id=${propertyId}`
        );
        if (res.data) {
          setConfigForm({
            billingReminderDay: res.data.billingReminderDay || 1,
            billingDueDay: res.data.billingDueDay || 1,
            meterReadingDay: res.data.meterReadingDay || 1,
            notifyEmail: !!res.data.notifyEmail,
            notifySms: !!res.data.notifySms,
            lateFeeType: res.data.lateFeeType || "fixed",
            lateFeeAmount: res.data.lateFeeAmount || 0,
            gracePeriodDays: res.data.gracePeriodDays || 3,
            water_billing_type: res.data.water_billing_type || "included",
            electricity_billing_type:
              res.data.electricity_billing_type || "included",
          });
        }
        console.log("property config", res.data);
      } catch (err) {
        console.error("Failed to fetch property config:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, [propertyId]);

  const handleChange = async (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    if (name === "water_billing_type" || name === "electricity_billing_type") {
      const confirm = await Swal.fire({
        icon: "warning",
        title: "Changing Billing Type",
        text: `Changing the ${
          name === "water_billing_type" ? "Water" : "Electricity"
        } billing type may affect how tenant billings are generated. Do you want to continue?`,
        showCancelButton: true,
        confirmButtonText: "Ok, well noted.",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#2563eb",
        cancelButtonColor: "#9ca3af",
      });

      if (!confirm.isConfirmed) return;
    }

    setConfigForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : ["lateFeeAmount", "gracePeriodDays", "billingReminderDay", "billingDueDay", "meterReadingDay"].includes(name)
          ? Number(value)
          : value,
    }));
  };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            await axios.post("/api/landlord/properties/configuration", {
                property_id: propertyId,
                ...configForm,
            });

            Swal.fire(
                "Saved!",
                "Property configuration updated.",
                "success"
            ).then(() => {
                if (onUpdate) onUpdate();
            });
        } catch (error: any) {
            console.error("Failed to save config:", error);

            // Default message
            let title = "Error";
            let message = "Could not save configuration. Please try again.";

            if (axios.isAxiosError(error)) {
                const status = error.response?.status;
                const apiMessage = error.response?.data?.error;

                if (status === 409) {
                    title = "Changes Locked";
                    message =
                        apiMessage ||
                        "Configuration cannot be modified because billing has already been generated for the current month.";
                } else if (status === 400) {
                    title = "Invalid Data";
                    message = apiMessage || "Some configuration values are invalid.";
                } else if (status === 500) {
                    title = "Server Error";
                    message =
                        apiMessage ||
                        "Something went wrong on the server. Please try again later.";
                } else if (apiMessage) {
                    message = apiMessage;
                }
            }

            Swal.fire({
                icon: "error",
                title,
                text: message,
                confirmButtonText: "OK",
            });
        } finally {
            setSubmitting(false);
        }
    };

  // Expose startTour to parent component
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).startPropertyConfigTour = startTour;
    }
    return () => {
      if (typeof window !== "undefined") {
        delete (window as any).startPropertyConfigTour;
      }
    };
  }, [startTour]);

  if (loading)
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );

  return (
    <form onSubmit={handleSave} className="space-y-5">
      {/* Notifications Section */}
      <div
        id="notifications-section"
        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
      >
        <div className="bg-gradient-to-r from-blue-50 to-emerald-50 px-4 sm:px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Notification & Reminders
              </h3>
              <p className="text-xs text-gray-600 mt-0.5">
                Set billing schedule dates
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 space-y-5">
          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800">
                <span className="font-semibold">For Submetered Properties:</span> Make sure to set the meter reading date to include utility charges in monthly billing. Without this date, only rent charges will be generated.
              </p>
            </div>
          </div>

          {/* Date Pickers Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Meter Reading Day */}
            <div id="meter-reading-day" className="space-y-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Meter Reading Day
              </label>
              <div className="relative">
                <select
                  name="meterReadingDay"
                  value={configForm.meterReadingDay}
                  onChange={handleChange}
                  className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-3 pr-10 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <option key={day} value={day}>
                      {day}
                      {day === 1
                        ? "st"
                        : day === 2
                        ? "nd"
                        : day === 3
                        ? "rd"
                        : "th"}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <Droplets className="w-4 h-4 text-gray-400" />
                </div>
              </div>
              <p className="text-xs text-gray-500">Day to record meter readings</p>
            </div>

            {/* Billing Generation Day */}
            <div id="reminder-day" className="space-y-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Billing Generation Day
              </label>
              <div className="relative">
                <select
                  name="billingReminderDay"
                  value={configForm.billingReminderDay}
                  onChange={handleChange}
                  className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-3 pr-10 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <option key={day} value={day}>
                      {day}
                      {day === 1
                        ? "st"
                        : day === 2
                        ? "nd"
                        : day === 3
                        ? "rd"
                        : "th"}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <Bell className="w-4 h-4 text-gray-400" />
                </div>
              </div>
              <p className="text-xs text-gray-500">Day to generate monthly billing</p>
            </div>

            {/* Due Date Day */}
            <div id="due-day" className="space-y-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Billing Due Date
              </label>
              <div className="relative">
                <select
                  name="billingDueDay"
                  value={configForm.billingDueDay}
                  onChange={handleChange}
                  className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-3 pr-10 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <option key={day} value={day}>
                      {day}
                      {day === 1
                        ? "st"
                        : day === 2
                        ? "nd"
                        : day === 3
                        ? "rd"
                        : "th"}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                </div>
              </div>
              <p className="text-xs text-gray-500">Payment due date of each month</p>
            </div>
          </div>

          

          {/* Notification Channels */}
          <div id="notification-channels" className="pt-4 border-t border-gray-100">
            <label className="block text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wider">
              Notification Channels
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200">
                <input
                  type="checkbox"
                  name="notifyEmail"
                  checked={configForm.notifyEmail}
                  onChange={handleChange}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <Mail className="w-5 h-5 text-gray-600" />
                <span className="text-sm text-gray-700 font-medium">
                  Email
                </span>
              </label>
              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200">
                <input
                  type="checkbox"
                  name="notifySms"
                  checked={configForm.notifySms}
                  onChange={handleChange}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <MessageSquare className="w-5 h-5 text-gray-600" />
                <span className="text-sm text-gray-700 font-medium">
                  SMS
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Utility Billing Section */}
      <div
        id="utility-billing-section"
        className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
      >
        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Droplets className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Utility Billing
              </h3>
              <p className="text-xs text-gray-600 mt-0.5">
                Configure water and electricity billing types
              </p>
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div id="water-billing-type">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                Water Billing Type
              </label>
              <select
                name="water_billing_type"
                value={configForm.water_billing_type}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
              >
                {UTILITY_BILLING_TYPES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div id="electricity-billing-type">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                Electricity Billing Type
              </label>
              <select
                name="electricity_billing_type"
                value={configForm.electricity_billing_type}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
              >
                {UTILITY_BILLING_TYPES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                ⚠️ Changing these settings affects how future tenant billings
                are generated for this property.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Late Payment Section */}
        <div
            id="late-payment-section"
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
        >
            <div className="bg-gradient-to-r from-red-50 to-rose-50 px-5 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-rose-600 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-gray-900">
                            Late Payment Penalty
                        </h3>
                        <p className="text-xs text-gray-600 mt-0.5">
                            Configure late fee penalties and grace periods
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Penalty Type */}
                    <div id="penalty-type">
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                            Penalty Type
                        </label>
                        <select
                            name="lateFeeType"
                            value={configForm.lateFeeType}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                        >
                            <option value="fixed">Fixed Amount</option>
                            <option value="percentage">Percentage (% per day)</option>
                        </select>
                    </div>

                    {/* NEW: Fixed Penalty Application */}
                    {configForm.lateFeeType === "fixed" && (
                        <div id="penalty-frequency">
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                                Penalty Application
                            </label>
                            <select
                                name="lateFeeFrequency"
                                value={configForm.lateFeeFrequency}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                            >
                                <option value="one_time">One-time penalty</option>
                                <option value="per_day">Per day of delay</option>
                            </select>
                        </div>
                    )}

                    {/* Penalty Amount */}
                    <div id="penalty-amount">
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                            {configForm.lateFeeType === "fixed"
                                ? configForm.lateFeeFrequency === "one_time"
                                    ? "Penalty Amount (₱ one-time)"
                                    : "Penalty Amount (₱ per day)"
                                : "Penalty Rate (% per day)"}
                        </label>
                        <input
                            type="number"
                            name="lateFeeAmount"
                            min="0"
                            step="0.01"
                            value={configForm.lateFeeAmount}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                        />
                    </div>

                    {/* Grace Period */}
                    <div id="grace-period">
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                            Grace Period (Days)
                        </label>
                        <input
                            type="number"
                            name="gracePeriodDays"
                            min="0"
                            value={configForm.gracePeriodDays}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                        />
                    </div>

                    <div className="flex items-center">
                        <p className="text-xs text-gray-600">
                            Penalties apply after the grace period.
                            Fixed penalties can be one-time or per day.
                            Percentage penalties are always per day.
                        </p>
                    </div>
                </div>
            </div>
        </div>


        {/* Save Button */}
      <div id="save-button" className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white rounded-lg font-semibold text-sm transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Submitting..." : "Save Configuration"}
        </button>
      </div>
    </form>
  );
}
