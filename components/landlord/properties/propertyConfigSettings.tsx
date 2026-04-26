"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
  Bell,
  Droplets,
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

  const DaySelector = ({ name, value, onChange, label, icon: Icon, description }: {
    name: string;
    value: number;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    label: string;
    icon: React.ElementType;
    description: string;
  }) => (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
        {label}
      </label>
      <div className="relative">
        <select
          name={name}
          value={value}
          onChange={onChange}
          className="w-full appearance-none rounded-lg border border-gray-300 bg-white pl-4 pr-10 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        >
          {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
            <option key={day} value={day}>
              {day}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <Icon className="w-4 h-4 text-gray-400" />
        </div>
      </div>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  );

  return (
    <form onSubmit={handleSave} className="space-y-4">
      {/* Notifications Section */}
      <div
        id="notifications-section"
        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
      >
        <div className="bg-gradient-to-r from-blue-50 to-emerald-50 px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Bell className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Notification & Reminders
              </h3>
              <p className="text-xs text-gray-600">
                Set billing schedule dates
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800 leading-relaxed">
                <span className="font-semibold">Submetered:</span> Set the meter reading date to include utility charges. Without it, only rent will be billed.
              </p>
            </div>
          </div>

          {/* Date Pickers - Stacked on mobile, grid on tablet */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <DaySelector
              name="meterReadingDay"
              value={configForm.meterReadingDay}
              onChange={handleChange}
              label="Meter Reading Day"
              icon={Droplets}
              description="Record meter readings"
            />
            <DaySelector
              name="billingReminderDay"
              value={configForm.billingReminderDay}
              onChange={handleChange}
              label="Generate Billing Day"
              icon={Bell}
              description="Generate monthly billing"
            />
            <DaySelector
              name="billingDueDay"
              value={configForm.billingDueDay}
              onChange={handleChange}
              label="Due Date Day"
              icon={DollarSign}
              description="Payment due date"
            />
          </div>

          {/* Notification Channels */}
          <div className="pt-3 border-t border-gray-100">
            <label className="block text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">
              Notification Channels
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200">
                <input
                  type="checkbox"
                  name="notifyEmail"
                  checked={configForm.notifyEmail}
                  onChange={handleChange}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <Mail className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <span className="text-xs text-gray-700 font-medium truncate">
                  Email
                </span>
              </label>
              <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200">
                <input
                  type="checkbox"
                  name="notifySms"
                  checked={configForm.notifySms}
                  onChange={handleChange}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <MessageSquare className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <span className="text-xs text-gray-700 font-medium truncate">
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
        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
      >
        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Droplets className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Utility Billing
              </h3>
              <p className="text-xs text-gray-600">
                Configure water and electricity billing
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Water Billing
              </label>
              <select
                name="water_billing_type"
                value={configForm.water_billing_type}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors bg-white"
              >
                {UTILITY_BILLING_TYPES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Electricity Billing
              </label>
              <select
                name="electricity_billing_type"
                value={configForm.electricity_billing_type}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors bg-white"
              >
                {UTILITY_BILLING_TYPES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 leading-relaxed">
                Changing these affects future tenant billings.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Late Payment Section */}
      <div
        id="late-payment-section"
        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
      >
        <div className="bg-gradient-to-r from-red-50 to-rose-50 px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-red-600 to-rose-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Late Payment Penalty
              </h3>
              <p className="text-xs text-gray-600">
                Configure penalties and grace periods
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Penalty Type */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Penalty Type
              </label>
              <select
                name="lateFeeType"
                value={configForm.lateFeeType}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors bg-white"
              >
                <option value="fixed">Fixed Amount</option>
                <option value="percentage">Percentage (% per day)</option>
              </select>
            </div>

            {/* Penalty Frequency */}
            {configForm.lateFeeType === "fixed" && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Penalty Application
                </label>
                <select
                  name="lateFeeFrequency"
                  value={configForm.lateFeeFrequency || "one_time"}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors bg-white"
                >
                  <option value="one_time">One-time</option>
                  <option value="per_day">Per day</option>
                </select>
              </div>
            )}

            {/* Penalty Amount */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                {configForm.lateFeeType === "fixed"
                  ? configForm.lateFeeFrequency === "per_day"
                    ? "Amount (₱/day)"
                    : "Amount (₱)"
                  : "Rate (%/day)"}
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
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
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
          </div>

          <p className="text-xs text-gray-500">
            Penalties apply after grace period. Fixed can be one-time or per day.
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white rounded-lg font-semibold text-sm transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Saving..." : "Save Configuration"}
        </button>
      </div>
    </form>
  );
}