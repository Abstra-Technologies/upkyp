"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Plus } from "lucide-react";

export default function AddPayoutAccount({ onSuccess }: any) {
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    const [channels, setChannels] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedChannel, setSelectedChannel] = useState<any>(null);

    const [form, setForm] = useState({
        account_name: "",
        account_number: "",
    });

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
       SUBMIT
    ====================== */
    const handleSubmit = async () => {
        if (!selectedChannel || !form.account_name || !form.account_number) {
            Swal.fire("Missing fields", "Complete all fields", "warning");
            return;
        }

        setSaving(true);

        try {
            const res = await axios.post(
                "/api/landlord/payout/AddAccount",
                {
                    channel_code: selectedChannel.code,
                    bank_name: selectedChannel.name,
                    account_name: form.account_name,
                    account_number: form.account_number,
                }
            );

            Swal.fire("Success", "Account added", "success");

            setForm({ account_name: "", account_number: "" });
            setSelectedChannel(null);
            setSearch("");
            setOpen(false);

            // ✅ better: pass created account if backend returns it
            onSuccess?.(res.data?.account);

        } catch (err) {
            console.error(err);
            Swal.fire("Error", "Failed to add account", "error");
        } finally {
            setSaving(false);
        }
    };

    const filteredChannels = channels.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            {/* TRIGGER */}
            <button
                onClick={() => setOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-xl text-sm font-semibold flex items-center gap-2"
            >
                <Plus className="w-4 h-4" />
                Add Account
            </button>

            {/* MODAL */}
            {open && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">

                        <h2 className="text-lg font-bold">
                            Add Payout Account
                        </h2>

                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
                            <span className="text-amber-600 text-sm">⚠️</span>
                            <p className="text-xs text-amber-700 leading-snug">
                                Please ensure your account details are accurate and correct.
                                Incorrect information may result in failed or delayed payouts.
                            </p>
                        </div>

                        {/* BANK SEARCH */}
                        <div className="relative">
                            <input
                                placeholder="Search bank / e-wallet"
                                className="w-full border rounded-xl px-4 py-2"
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
                            placeholder="Account Name"
                            className="w-full border rounded-xl px-4 py-2"
                            value={form.account_name}
                            onChange={(e) =>
                                setForm({ ...form, account_name: e.target.value })
                            }
                        />

                        {/* ACCOUNT NUMBER */}
                        <input
                            placeholder="Account / Mobile Number"
                            className="w-full border rounded-xl px-4 py-2"
                            value={form.account_number}
                            onChange={(e) =>
                                setForm({ ...form, account_number: e.target.value })
                            }
                        />

                        {/* ACTIONS */}
                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={handleSubmit}
                                disabled={saving}
                                className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-xl text-sm font-semibold"
                            >
                                {saving ? "Saving..." : "Save"}
                            </button>

                            <button
                                onClick={() => setOpen(false)}
                                className="flex-1 py-2 border rounded-xl text-sm"
                            >
                                Cancel
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}