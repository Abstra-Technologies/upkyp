"use client";

import { useState } from "react";
import { Mail, UserPlus, Building2, Send, Calendar, Home } from "lucide-react";
import { BackButton } from "@/components/navigation/backButton";

import { useTenantInvite } from "@/hooks/landlord/useTenantInvite";

export default function InviteTenantPage() {
    const {
        loading,
        properties,
        units,
        selectedProperty,
        setSelectedProperty,
        selectedUnit,
        setSelectedUnit,
        tenantEmail,
        setTenantEmail,
        leaseStart,
        setLeaseStart,
        leaseEnd,
        setLeaseEnd,
        setDatesLaterValue,
        handleSendInvite,
    } = useTenantInvite();

    const [setDatesLater, setSetDatesLater] = useState(false);

    const handleDatesLaterChange = (checked: boolean) => {
        setSetDatesLater(checked);
        setDatesLaterValue(checked);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50 px-3 pb-20 pt-12 sm:px-4 sm:pt-16">
            <div className="max-w-xl mx-auto">
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg border p-4 sm:p-7">

                    {/* Back */}
                    <div className="mb-4 sm:mb-5">
                        <BackButton label="Back to Dashboard" />
                    </div>

                    {/* Header */}
                    <div className="text-center mb-5 sm:mb-7">
                        <div className="mx-auto w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3">
                            <UserPlus className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                        </div>
                        <h1 className="text-lg sm:text-2xl font-bold">Invite Tenant</h1>
                        <p className="text-gray-500 text-xs sm:text-sm mt-1">
                            Send an invitation with lease details
                        </p>
                    </div>

                    {/* Form */}
                    <div className="space-y-3 sm:space-y-4">

                        <InputField
                            label="Tenant Email"
                            icon={<Mail className="w-4 h-4" />}
                            value={tenantEmail}
                            onChange={setTenantEmail}
                            type="email"
                            placeholder="tenant@email.com"
                        />

                        <SelectField
                            label="Property"
                            icon={<Building2 className="w-4 h-4" />}
                            value={selectedProperty}
                            onChange={setSelectedProperty}
                            options={properties.map(p => ({
                                value: p.property_id,
                                label: p.property_name,
                            }))}
                        />

                        <SelectField
                            label="Unit"
                            icon={<Home className="w-4 h-4" />}
                            value={selectedUnit}
                            onChange={setSelectedUnit}
                            disabled={!selectedProperty}
                            options={units.map(u => ({
                                value: u.unit_id,
                                label: `${u.unit_name} — ${u.status}`,
                            }))}
                        />

                        {/* Toggle */}
                        <div className="flex gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs sm:text-sm">
                            <input
                                type="checkbox"
                                checked={setDatesLater}
                                onChange={(e) => handleDatesLaterChange(e.target.checked)}
                                className="mt-1 h-4 w-4 text-blue-600"
                            />
                            <div>
                                <p className="font-semibold">
                                    Set lease dates after tenant accepts
                                </p>
                                <p className="text-gray-600">
                                    You can finalize the lease period later.
                                </p>
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <InputField
                                label="Lease Start"
                                icon={<Calendar className="w-4 h-4" />}
                                type="date"
                                value={leaseStart}
                                onChange={setLeaseStart}
                            />
                            <InputField
                                label="Lease End"
                                icon={<Calendar className="w-4 h-4" />}
                                type="date"
                                value={leaseEnd}
                                onChange={setLeaseEnd}
                            />
                        </div>

                        <button
                            onClick={handleSendInvite}
                            disabled={loading}
                            className="w-full mt-3 sm:mt-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 text-white text-sm sm:text-base font-semibold flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
                        >
                            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                            Send Invitation
                        </button>

                    </div>
                </div>
            </div>
        </div>
    );
}

/* ===============================
   Reusable Inputs
============================== */

function InputField({ label, icon, value, onChange, disabled, ...props }: any) {
    return (
        <div>
            <label className="text-sm font-semibold">{label}</label>
            <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {icon}
                </span>
                <input
                    {...props}
                    value={value}
                    disabled={disabled}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                />
            </div>
        </div>
    );
}

function SelectField({ label, icon, value, onChange, options, disabled }: any) {
    return (
        <div>
            <label className="text-sm font-semibold">{label}</label>
            <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {icon}
                </span>
                <select
                    value={value}
                    disabled={disabled}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50"
                >
                    <option value="">Select {label.toLowerCase()}</option>
                    {options.map((o: any) => (
                        <option key={o.value} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}