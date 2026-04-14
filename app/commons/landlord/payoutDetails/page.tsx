"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import Swal from "sweetalert2";
import useAuthStore from "@/zustand/authStore";
import { BackButton } from "@/components/navigation/backButton";
import {
    Wallet,
    Eye,
    EyeOff,
    Pencil,
    Trash2,
    Shield,
    Plus,
    CheckCircle,
} from "lucide-react";

/* =====================
   HELPERS
===================== */
const maskNumber = (value: string) => {
    if (!value) return "";
    if (value.length <= 4) return value;
    return "•".repeat(value.length - 4) + value.slice(-4);
};

const fadeUp = {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0 },
};

const normalizeText = (val?: string) =>
    typeof val === "string" && val.trim() !== "" && val !== "0"
        ? val
        : undefined;

/* =====================
   PAGE
===================== */
export default function PayoutDetails() {
    const { user, fetchSession } = useAuthStore();
    const landlord_id = user?.landlord_id;

    const [loading, setLoading] = useState(true);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [channels, setChannels] = useState<any[]>([]);

    /* ADD */
    const [showAddForm, setShowAddForm] = useState(false);
    const [channelSearch, setChannelSearch] = useState("");
    const [showChannels, setShowChannels] = useState(false);
    const [selectedChannel, setSelectedChannel] = useState<any>(null);
    const [addForm, setAddForm] = useState({
        account_name: "",
        account_number: "",
    });

    /* EDIT */
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState({
        account_name: "",
        account_number: "",
    });

    const [saving, setSaving] = useState(false);
    const [visibleNumbers, setVisibleNumbers] = useState<Record<number, boolean>>(
        {},
    );

    /* =====================
       LOAD DATA
    ===================== */
    useEffect(() => {
        if (!user) fetchSession();
        if (!user?.landlord_id) return;

        async function loadAll() {
            const [accRes, chRes] = await Promise.all([
                axios.get("/api/landlord/payout/getAllAccount", {
                    params: { landlord_id },
                }),
                axios.get("/api/payment/payoutChannels"),
            ]);

            const normalized =
                accRes.data.accounts?.map((a: any) => ({
                    ...a,
                    bank_name: normalizeText(a.bank_name),
                    account_name: normalizeText(a.account_name),
                })) || [];

            setAccounts(normalized);
            setChannels(chRes.data || []);
            setLoading(false);
        }

        loadAll();
    }, [user]);

    const activeAccount = useMemo(
        () => accounts.find((a) => a.is_active === 1),
        [accounts],
    );

    const otherAccounts = useMemo(
        () => accounts.filter((a) => a.is_active === 0),
        [accounts],
    );

    /* =====================
       SET ACTIVE
    ===================== */
    const setActive = async (payout_id: number) => {
        await axios.post("/api/landlord/payout/setActive", {
            landlord_id,
            payout_id,
        });

        setAccounts((prev) =>
            prev.map((a) => ({
                ...a,
                is_active: a.payout_id === payout_id ? 1 : 0,
            })),
        );
    };

    /* =====================
       ADD ACCOUNT
    ===================== */
    const handleAdd = async () => {
        if (
            !selectedChannel ||
            !addForm.account_name ||
            !addForm.account_number
        ) {
            Swal.fire("Missing fields", "Complete all required fields", "warning");
            return;
        }

        setSaving(true);

        try {
            await axios.post("/api/landlord/payout/AddAccount", {
                landlord_id,
                channel_code: selectedChannel.code,
                bank_name: selectedChannel.name,
                account_name: addForm.account_name,
                account_number: addForm.account_number,
            });

            Swal.fire("Saved", "New payout account added", "success");
            window.location.reload();
        } finally {
            setSaving(false);
        }
    };

    /* =====================
       EDIT
    ===================== */
    const startEdit = (acc: any) => {
        setEditingId(acc.payout_id);
        setEditForm({
            account_name: acc.account_name || "",
            account_number: acc.account_number || "",
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm({ account_name: "", account_number: "" });
    };

    const saveEdit = async (payout_id: number) => {
        if (!editForm.account_name || !editForm.account_number) {
            Swal.fire("Missing fields", "Complete all required fields", "warning");
            return;
        }

        setSaving(true);

        try {
            await axios.put("/api/landlord/payout/updateAccount", {
                payout_id,
                landlord_id,
                ...editForm,
            });

            setAccounts((prev) =>
                prev.map((a) =>
                    a.payout_id === payout_id ? { ...a, ...editForm } : a,
                ),
            );

            Swal.fire("Updated", "Payout account updated", "success");
            cancelEdit();
        } finally {
            setSaving(false);
        }
    };

    /* =====================
       DELETE
    ===================== */
    const handleDelete = async (acc: any) => {
        if (acc.is_active) {
            Swal.fire(
                "Not allowed",
                "You cannot delete the active payout account",
                "warning",
            );
            return;
        }

        const confirm = await Swal.fire({
            title: "Delete payout account?",
            text: "This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
        });

        if (!confirm.isConfirmed) return;

        await axios.delete("/api/landlord/payout/deleteAccount", {
            data: { payout_id: acc.payout_id, landlord_id },
        });

        setAccounts((prev) =>
            prev.filter((a) => a.payout_id !== acc.payout_id),
        );
    };

    if (loading) return null;

    /* =====================
       CARD
    ===================== */
    const renderCard = (acc: any) => {
        const isEditing = editingId === acc.payout_id;
        const showNumber = visibleNumbers[acc.payout_id];
        const isActive = acc.is_active === 1;

        return (
            <motion.div
                key={acc.payout_id}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className={`rounded-2xl p-4 space-y-2 ${
                    isActive
                        ? "bg-gradient-to-br from-blue-600 to-emerald-600 text-white"
                        : "bg-white border"
                }`}
            >
                <div className="flex justify-between">
                    <div>
                        <p className="font-semibold">{acc.bank_name}</p>
                        {isActive && (
                            <span className="text-xs flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> ACTIVE
              </span>
                        )}
                    </div>

                    {!isEditing && (
                        <div className="flex gap-2">
                            <button onClick={() => startEdit(acc)}>
                                <Pencil className="w-4 h-4" />
                            </button>
                            {!isActive && (
                                <button onClick={() => handleDelete(acc)}>
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {isEditing ? (
                    <>
                        <input
                            className="w-full border rounded-xl px-3 py-2 text-sm"
                            value={editForm.account_name}
                            onChange={(e) =>
                                setEditForm({ ...editForm, account_name: e.target.value })
                            }
                        />
                        <input
                            className="w-full border rounded-xl px-3 py-2 text-sm"
                            value={editForm.account_number}
                            onChange={(e) =>
                                setEditForm({ ...editForm, account_number: e.target.value })
                            }
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => saveEdit(acc.payout_id)}
                                className="flex-1 py-2 bg-black text-white rounded-xl"
                            >
                                Save
                            </button>
                            <button onClick={cancelEdit} className="flex-1 py-2 border rounded-xl">
                                Cancel
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <p className="text-sm">{acc.account_name}</p>
                        <div className="flex justify-between items-center">
                            <p className="font-mono">
                                {showNumber ? acc.account_number : maskNumber(acc.account_number)}
                            </p>
                            <button
                                onClick={() =>
                                    setVisibleNumbers((v) => ({
                                        ...v,
                                        [acc.payout_id]: !v[acc.payout_id],
                                    }))
                                }
                            >
                                {showNumber ? <EyeOff /> : <Eye />}
                            </button>
                        </div>

                        {!isActive && (
                            <button
                                onClick={() => setActive(acc.payout_id)}
                                className="w-full py-2 bg-blue-600 text-white rounded-xl"
                            >
                                Set Active
                            </button>
                        )}
                    </>
                )}
            </motion.div>
        );
    };

    /* =====================
       RENDER
    ===================== */
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b px-4 py-4">
                <BackButton />
                <div className="flex gap-3 mt-3 items-center">
                    <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center">
                        <Wallet className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold">Payout Accounts</h1>
                        <p className="text-xs text-gray-500">
                            Manage where you receive your income
                        </p>
                    </div>
                </div>
            </div>

            <div className="px-4 py-6 max-w-xl mx-auto space-y-4">
                {activeAccount && renderCard(activeAccount)}
                {otherAccounts.map(renderCard)}

                {/* ADD ACCOUNT */}
                <div className="bg-white border rounded-2xl p-4">
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="w-full flex justify-between font-semibold"
                    >
                        Add New Payout Account <Plus />
                    </button>

                    <AnimatePresence>
                        {showAddForm && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4 space-y-3"
                            >
                                <input
                                    value={channelSearch}
                                    onChange={(e) => {
                                        setChannelSearch(e.target.value);
                                        setShowChannels(true);
                                    }}
                                    placeholder="Search payout partner"
                                    className="w-full border rounded-xl px-4 py-2"
                                />

                                {showChannels && (
                                    <div className="border rounded-xl max-h-40 overflow-auto">
                                        {channels
                                            .filter((c) =>
                                                c.name
                                                    .toLowerCase()
                                                    .includes(channelSearch.toLowerCase()),
                                            )
                                            .map((c) => (
                                                <div
                                                    key={c.code}
                                                    onClick={() => {
                                                        setSelectedChannel(c);
                                                        setChannelSearch(c.name);
                                                        setShowChannels(false);
                                                    }}
                                                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer"
                                                >
                                                    {c.name}
                                                </div>
                                            ))}
                                    </div>
                                )}

                                <input
                                    placeholder="Account name"
                                    className="w-full border rounded-xl px-4 py-2"
                                    value={addForm.account_name}
                                    onChange={(e) =>
                                        setAddForm({ ...addForm, account_name: e.target.value })
                                    }
                                />

                                <input
                                    placeholder="Account / Mobile number"
                                    className="w-full border rounded-xl px-4 py-2"
                                    value={addForm.account_number}
                                    onChange={(e) =>
                                        setAddForm({ ...addForm, account_number: e.target.value })
                                    }
                                />

                                <button
                                    onClick={handleAdd}
                                    disabled={saving}
                                    className="w-full py-2 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-xl"
                                >
                                    {saving ? "Saving..." : "Add Payout Account"}
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                    <Shield className="text-amber-600" />
                    <p className="text-xs text-amber-700">
                        Your payout information is encrypted and securely stored.
                    </p>
                </div>
            </div>
        </div>
    );
}
