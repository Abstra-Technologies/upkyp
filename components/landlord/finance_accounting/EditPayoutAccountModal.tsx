"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

export default function EditPayoutAccountModal({
                                                   open,
                                                   onClose,
                                                   account,
                                                   onSave,
                                               }: any) {

    const [form, setForm] = useState({
        account_name: "",
        account_number: "",
    });

    const [channels, setChannels] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [selectedChannel, setSelectedChannel] = useState<any>(null);
    const [showDropdown, setShowDropdown] = useState(false);

    const [saving, setSaving] = useState(false);

    /* ======================
       LOAD CHANNELS
    ====================== */
    useEffect(() => {
        async function loadChannels() {
            try {
                const res = await axios.get("/api/payment/payoutChannels");
                setChannels(res.data || []);
            } catch (error) {
                console.error("Failed to load channels", error);
            }
        }

        if (open) loadChannels();
    }, [open]);

    /* ======================
       PREFILL
    ====================== */
    useEffect(() => {
        if (account) {
            setForm({
                account_name: account.account_name || "",
                account_number: account.account_number || "",
            });

            const existing = {
                code: account.channel_code,
                name: account.bank_name,
            };

            setSelectedChannel(existing);
            setSearch(existing.name);
        }
    }, [account]);

    if (!open) return null;

    /* ======================
       SAVE
    ====================== */
    const handleSave = async () => {
        if (!selectedChannel || !form.account_name || !form.account_number) {
            Swal.fire("Missing fields", "Complete all fields", "warning");
            return;
        }

        try {
            setSaving(true);

            await onSave(account.payout_id, {
                channel_code: selectedChannel.code,
                bank_name: selectedChannel.name,
                account_name: form.account_name,
                account_number: form.account_number,
            });

            onClose();

        } catch (error) {
            console.error(error);
            Swal.fire("Error", "Failed to update account", "error");
        } finally {
            setSaving(false);
        }
    };

    const filteredChannels = channels.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">

                {/* HEADER */}
                <div>
                    <h2 className="text-lg font-bold text-gray-900">
                        Edit Payout Account
                    </h2>
                    <p className="text-xs text-gray-500">
                        Update your payout account details
                    </p>
                </div>

                {/* BANK SELECT */}
                <div className="relative">
                    <input
                        placeholder="Search bank / e-wallet"
                        className="w-full border rounded-xl px-4 py-2 text-sm"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setShowDropdown(true);
                        }}
                        onFocus={() => setShowDropdown(true)}
                    />

                    {showDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border rounded-xl max-h-40 overflow-auto shadow">
                            {filteredChannels.length === 0 && (
                                <div className="px-4 py-2 text-sm text-gray-500">
                                    No results
                                </div>
                            )}

                            {filteredChannels.map((c) => (
                                <div
                                    key={c.code}
                                    onClick={() => {
                                        setSelectedChannel(c);
                                        setSearch(c.name);
                                        setShowDropdown(false);
                                    }}
                                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                                >
                                    {c.name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ACCOUNT NAME */}
                <input
                    className="w-full border rounded-xl px-4 py-2 text-sm"
                    placeholder="Account Name"
                    value={form.account_name}
                    onChange={(e) =>
                        setForm({ ...form, account_name: e.target.value })
                    }
                />

                {/* ACCOUNT NUMBER */}
                <input
                    className="w-full border rounded-xl px-4 py-2 text-sm"
                    placeholder="Account / Mobile Number"
                    value={form.account_number}
                    onChange={(e) =>
                        setForm({ ...form, account_number: e.target.value })
                    }
                />

                {/* REMINDER */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
                    <span className="text-amber-600 text-sm">⚠️</span>
                    <p className="text-xs text-amber-800 font-medium leading-snug">
                        Ensure your account details are accurate and correct.
                        Incorrect information may result in failed or delayed payouts.
                    </p>
                </div>

                {/* ACTIONS */}
                <div className="flex gap-2 pt-2">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-xl text-sm font-semibold"
                    >
                        {saving ? "Saving..." : "Save Changes"}
                    </button>

                    <button
                        onClick={onClose}
                        className="flex-1 py-2 border rounded-xl text-sm"
                    >
                        Cancel
                    </button>
                </div>

            </div>
        </div>
    );
}