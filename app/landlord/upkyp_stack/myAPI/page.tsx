"use client";

import { useState } from "react";
import axios from "axios";
import { Copy, Eye, EyeOff, RefreshCw } from "lucide-react";
import Swal from "sweetalert2";

export default function MyAPIPage() {
    const [showApiKey, setShowApiKey] = useState(false);
    const [showSecretKey, setShowSecretKey] = useState(false);

    const [apiKey, setApiKey] = useState<string | null>(null);
    const [secretKey, setSecretKey] = useState<string | null>(null);

    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!name.trim()) {
            await Swal.fire({
                icon: "warning",
                title: "Missing Name",
                text: "Please enter a name for your API key.",
                confirmButtonColor: "#2563eb",
            });
            return;
        }

        try {
            setLoading(true);

            await Swal.fire({
                title: "Generating Keys...",
                text: "Please wait",
                allowOutsideClick: false,
                allowEscapeKey: false,
                didOpen: () => {
                    Swal.showLoading();
                },
            });

            const res = await axios.post("/api/upkyp_stack/generate-keys", {
                name,
                environment: "live",
            });

            const data = res.data?.data;

            if (!data?.api_key || !data?.secret_key) {
                throw new Error("Invalid API response");
            }

            setApiKey(data.api_key);
            setSecretKey(data.secret_key);

            setName("");

            await Swal.fire({
                icon: "success",
                title: "API Keys Generated",
                html: `
                <p style="font-size: 14px;">
                    Your API and Secret keys have been created successfully.
                </p>
                <p style="margin-top: 10px; font-size: 12px; color: gray;">
                    ⚠️ Make sure to copy your secret key now. You won't be able to see it again.
                </p>
            `,
                confirmButtonColor: "#10b981",
            });

        } catch (err: any) {
            console.error(err);

            await Swal.fire({
                icon: "error",
                title: "Failed to Generate Keys",
                text:
                    err?.response?.data?.error ||
                    err?.message ||
                    "Something went wrong",
                confirmButtonColor: "#ef4444",
            });

        } finally {
            setLoading(false);
        }
    };


    const copy = (val: string | null) => {
        if (!val) return;
        navigator.clipboard.writeText(val);
    };

    return (
        <div className="px-5 py-6 md:p-8 max-w-5xl mx-auto">

            {/* HEADER */}
            <div className="mb-6">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                    Upkyp API Keys
                </h1>
                <p className="text-gray-500 text-sm sm:text-base mt-1">
                    Generate and manage your API credentials
                </p>
            </div>

            {/* ERROR */}
            {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm">
                    {error}
                </div>
            )}

            {/* 🔥 NAME INPUT */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Key Name
                </label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Production Key"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                />
            </div>

            {/* GENERATE BUTTON */}
            <button
                onClick={handleGenerate}
                disabled={loading || !name.trim()}
                className="mb-6 w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-semibold shadow-md hover:shadow-lg transition disabled:opacity-50"
            >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                {loading ? "Generating..." : "Generate API Keys"}
            </button>

            {/* API KEY */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 mb-5">
                <div className="flex justify-between items-center mb-3">
                    <h2 className="font-semibold text-gray-800">API Key</h2>

                    <button onClick={() => setShowApiKey(!showApiKey)}>
                        {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>

                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                    <span className="text-sm font-mono text-gray-700 truncate">
                        {apiKey
                            ? showApiKey
                                ? apiKey
                                : "••••••••••••••••••••••••••"
                            : "No API key generated"}
                    </span>

                    {apiKey && (
                        <button onClick={() => copy(apiKey)} className="ml-auto">
                            <Copy size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* SECRET KEY */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
                <div className="flex justify-between items-center mb-3">
                    <h2 className="font-semibold text-gray-800">Secret Key</h2>

                    <button onClick={() => setShowSecretKey(!showSecretKey)}>
                        {showSecretKey ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>

                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                    <span className="text-sm font-mono text-gray-700 truncate">
                        {secretKey
                            ? showSecretKey
                                ? secretKey
                                : "••••••••••••••••••••••••••"
                            : "No secret key generated"}
                    </span>

                    {secretKey && (
                        <button onClick={() => copy(secretKey)} className="ml-auto">
                            <Copy size={16} />
                        </button>
                    )}
                </div>

                <p className="text-xs text-gray-400 mt-3">
                    Keep your secret key safe. Never expose it in frontend code.
                </p>
            </div>
        </div>
    );
}