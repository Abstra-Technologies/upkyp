"use client";

import useSWR from "swr";
import axios from "axios";
import { useState } from "react";
import { Copy, Eye, EyeOff, Plus } from "lucide-react";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function MyAPIPage() {
    const [showKey, setShowKey] = useState(false);

    // 🔥 REAL DATA HOOKS
    const { data: apiData, isLoading: loadingKey } = useSWR(
        "/api/upkyp_stack/api-keys"
    );

    const { data: usageData, isLoading: loadingUsage } = useSWR(
        "/api/upkyp_stack/api-usage"
    );

    const { data: endpointsData, isLoading: loadingEndpoints } = useSWR(
        "/api/upkyp_stack/endpoints"
    );

    const apiKey = apiData?.key;

    const handleCopy = () => {
        if (!apiKey) return;
        navigator.clipboard.writeText(apiKey);
    };

    return (
        <div className="px-5 py-6 md:p-8 max-w-6xl mx-auto">

            {/* HEADER */}
            <div className="mb-6">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                    Upkyp API
                </h1>
                <p className="text-gray-500 text-sm sm:text-base mt-1">
                    Manage your API keys and monitor usage
                </p>
            </div>

            {/* API KEY */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 mb-6">

                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-gray-800">Live API Key</h2>

                    <button
                        onClick={() => setShowKey(!showKey)}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>

                {loadingKey ? (
                    <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
                ) : apiKey ? (
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">

            <span className="text-sm font-mono text-gray-700 truncate">
              {showKey ? apiKey : "••••••••••••••••••••••••••"}
            </span>

                        <button
                            onClick={handleCopy}
                            className="ml-auto text-gray-500 hover:text-gray-700"
                        >
                            <Copy size={16} />
                        </button>
                    </div>
                ) : (
                    <p className="text-sm text-gray-500">No API key found</p>
                )}

                <button
                    className="mt-4 w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 text-white text-sm font-semibold shadow-md"
                    onClick={async () => {
                        await axios.post("/api/upkyp_stack/regenerate-key");
                    }}
                >
                    Regenerate Key
                </button>
            </div>

            {/* USAGE */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 mb-6">

                <h2 className="font-semibold text-gray-800 mb-4">
                    API Usage (This Month)
                </h2>

                {loadingUsage ? (
                    <div className="h-20 bg-gray-100 rounded-xl animate-pulse" />
                ) : usageData ? (
                    <>
                        <div className="mb-4">
                            <div className="flex justify-between text-sm text-gray-600 mb-1">
                                <span>Requests</span>
                                <span>
                  {usageData.total} / {usageData.limit}
                </span>
                            </div>

                            <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500"
                                    style={{
                                        width: `${
                                            (usageData.total / usageData.limit) * 100
                                        }%`,
                                    }}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <p className="text-xs text-gray-500">Total Calls</p>
                                <p className="font-bold text-gray-800 text-lg">
                                    {usageData.total}
                                </p>
                            </div>

                            <div className="p-4 bg-gray-50 rounded-xl">
                                <p className="text-xs text-gray-500">Errors</p>
                                <p className="font-bold text-red-500 text-lg">
                                    {usageData.errors}
                                </p>
                            </div>

                            <div className="p-4 bg-gray-50 rounded-xl">
                                <p className="text-xs text-gray-500">Latency</p>
                                <p className="font-bold text-gray-800 text-lg">
                                    {usageData.latency}ms
                                </p>
                            </div>
                        </div>
                    </>
                ) : (
                    <p className="text-sm text-gray-500">No usage data available</p>
                )}
            </div>

            {/* ENDPOINTS */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">

                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-gray-800">Endpoints</h2>

                    <button className="flex items-center gap-2 text-sm text-blue-600 font-medium hover:underline">
                        <Plus size={16} />
                        New API
                    </button>
                </div>

                {loadingEndpoints ? (
                    <div className="space-y-3">
                        <div className="h-14 bg-gray-100 rounded-xl animate-pulse" />
                        <div className="h-14 bg-gray-100 rounded-xl animate-pulse" />
                    </div>
                ) : endpointsData?.length ? (
                    <div className="space-y-3">
                        {endpointsData.map((endpoint: any) => (
                            <div
                                key={endpoint.id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border border-gray-100 rounded-xl"
                            >
                                <div>
                                    <p className="font-medium text-gray-800 text-sm">
                                        {endpoint.name}
                                    </p>
                                    <p className="text-xs text-gray-500 font-mono">
                                        {endpoint.path}
                                    </p>
                                </div>

                                <span
                                    className={`text-xs px-2 py-1 rounded-md font-medium w-fit ${
                                        endpoint.method === "GET"
                                            ? "bg-blue-50 text-blue-600"
                                            : "bg-green-50 text-green-600"
                                    }`}
                                >
                  {endpoint.method}
                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500">No endpoints available</p>
                )}
            </div>
        </div>
    );
}