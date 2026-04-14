"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import axios from "axios";
import { BackButton } from "@/components/navigation/backButton";
import { formatDate } from "@/utils/formatter/formatters";
import {
    BuildingOffice2Icon,
    HomeIcon,
    WrenchIcon,
    QrCodeIcon,
    PrinterIcon,
} from "@heroicons/react/24/outline";

const fetcher = async (url: string) => {
    const res = await axios.get(url, { headers: { Accept: "application/json" } });
    return res.data;
};

export default function ViewAssetPage() {
    const { id, asset_id } = useParams();
    const router = useRouter();
    const [printCopies, setPrintCopies] = useState(1);

    const { data: asset, isLoading, error } = useSWR(
        asset_id
            ? `/api/landlord/properties/assets/detailed?asset_id=${asset_id}`
            : null,
        fetcher
    );

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-500">
                Loading asset details...
            </div>
        );
    }

    if (error || !asset) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-gray-500">
                <p className="text-lg font-medium text-red-600">
                    Failed to load asset details.
                </p>
                <button
                    onClick={() => router.back()}
                    className="mt-3 text-blue-600 underline"
                >
                    Go Back
                </button>
            </div>
        );
    }

    const imageUrls = Array.isArray(asset.image_urls) ? asset.image_urls : [];

    // 🖨️ Print QR function
    const handlePrintQr = () => {
        if (!asset.qr_code_url) return alert("No QR code found for this asset.");

        const printWindow = window.open("", "_blank", "width=900,height=700");

        const copies = Array.from({ length: printCopies }, (_, i) => i);

        const qrHtml = `
      <html>
        <head>
          <title>Print QR Codes</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 30px;
            }
            .qr-grid {
              display: grid;
              grid-template-columns: repeat(${printCopies > 1 ? 2 : 1}, 1fr);
              gap: 20px;
              justify-items: center;
              align-items: center;
            }
            .qr-item {
              border: 1px solid #ccc;
              padding: 16px;
              border-radius: 12px;
              box-shadow: 0 2px 6px rgba(0,0,0,0.1);
            }
            .qr-item img {
              width: 200px;
              height: 200px;
              object-fit: contain;
            }
            .asset-name {
              margin-top: 8px;
              font-weight: bold;
              font-size: 14px;
            }
            @media print {
              body {
                padding: 0;
                margin: 0;
              }
              .qr-grid {
                gap: 10px;
              }
              .qr-item {
                box-shadow: none;
              }
            }
          </style>
        </head>
        <body>
          <h2>Asset QR Codes — ${asset.asset_name}</h2>
          <div class="qr-grid">
            ${copies
            .map(
                () => `
                <div class="qr-item">
                  <img src="${asset.qr_code_url}" alt="QR Code" />
                  <div class="asset-name">${asset.asset_name}</div>
                  <div style="font-size:12px;">${asset.asset_id}</div>
                </div>`
            )
            .join("")}
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `;

        printWindow?.document.write(qrHtml);
        printWindow?.document.close();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-6">
            <BackButton label="Back to Assets" />

            <div className="mt-4 bg-white rounded-2xl shadow-lg border border-gray-100 p-5 sm:p-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div className="flex items-start gap-3">
                        <div className="bg-gradient-to-br from-emerald-500 to-blue-600 p-2.5 rounded-xl shadow-md">
                            <WrenchIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">
                                {asset.asset_name}
                            </h1>
                            <p className="text-gray-500 text-sm">
                                Asset ID: <span className="font-mono">{asset.asset_id}</span>
                            </p>
                        </div>
                    </div>

                    {/* QR Print Controls */}
                    {asset.qr_code_url && (
                        <div className="flex items-center gap-3">
                            <label className="text-sm text-gray-700">
                                Copies:
                                <select
                                    value={printCopies}
                                    onChange={(e) => setPrintCopies(Number(e.target.value))}
                                    className="ml-2 border rounded-md text-sm px-2 py-1"
                                >
                                    <option value={1}>1</option>
                                    <option value={2}>2</option>
                                    <option value={4}>4</option>
                                </select>
                            </label>
                            <button
                                onClick={handlePrintQr}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-lg font-medium hover:opacity-90 active:scale-95 transition-all"
                            >
                                <PrinterIcon className="w-5 h-5" />
                                Print QR
                            </button>
                        </div>
                    )}
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="space-y-2 text-sm">
                        <p>
                            <span className="font-medium text-gray-700">Category:</span>{" "}
                            {asset.category || "—"}
                        </p>
                        <p>
                            <span className="font-medium text-gray-700">Model:</span>{" "}
                            {asset.model || "—"}
                        </p>
                        <p>
                            <span className="font-medium text-gray-700">Manufacturer:</span>{" "}
                            {asset.manufacturer || "—"}
                        </p>
                        <p>
                            <span className="font-medium text-gray-700">Serial Number:</span>{" "}
                            {asset.serial_number || "—"}
                        </p>
                        <p>
                            <span className="font-medium text-gray-700">Status:</span>{" "}
                            <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    asset.status === "active"
                                        ? "bg-green-100 text-green-700"
                                        : asset.status === "under_maintenance"
                                            ? "bg-yellow-100 text-yellow-700"
                                            : "bg-gray-100 text-gray-700"
                                }`}
                            >
                {asset.status}
              </span>
                        </p>
                        <p>
                            <span className="font-medium text-gray-700">Condition:</span>{" "}
                            {asset.condition || "—"}
                        </p>
                    </div>

                    <div className="space-y-2 text-sm">
                        <p>
                            <span className="font-medium text-gray-700">Purchase Date:</span>{" "}
                            {asset.purchase_date ? formatDate(asset.purchase_date) : "—"}
                        </p>
                        <p>
                            <span className="font-medium text-gray-700">Warranty Expiry:</span>{" "}
                            {asset.warranty_expiry ? formatDate(asset.warranty_expiry) : "—"}
                        </p>
                        <p>
                            <span className="font-medium text-gray-700">Assigned To:</span>{" "}
                            {asset.unit_name ? (
                                <span className="inline-flex items-center gap-1 text-blue-600">
                  <HomeIcon className="w-4 h-4" /> {asset.unit_name}
                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 text-gray-500">
                  <BuildingOffice2Icon className="w-4 h-4" /> Property-Level
                </span>
                            )}
                        </p>
                    </div>
                </div>

                {/* Description */}
                {asset.description && (
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-2">
                            Description
                        </h2>
                        <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                            {asset.description}
                        </p>
                    </div>
                )}

                {/* Uploaded Images */}
                {imageUrls.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-lg font-semibold text-gray-800 mb-3">
                            Uploaded Images
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {imageUrls.map((url, index) => (
                                <a
                                    key={index}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group"
                                >
                                    <img
                                        src={url}
                                        alt={`Asset Image ${index + 1}`}
                                        className="w-full h-32 object-cover rounded-lg border group-hover:opacity-90 transition"
                                    />
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {/* QR Code Section */}
                {asset.qr_code_url && (
                    <div className="mb-8">
                        <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <QrCodeIcon className="w-5 h-5 text-gray-700" />
                            Asset QR Code
                        </h2>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            <img
                                src={asset.qr_code_url}
                                alt="Asset QR Code"
                                className="w-40 h-40 rounded-lg border shadow-sm"
                            />
                            <div>
                                <p className="text-gray-600 text-sm mb-2">
                                    Scan this code to quickly access this asset record.
                                </p>
                                <a
                                    href={asset.qr_code_url}
                                    download={`QR-${asset.asset_id}.png`}
                                    target="_blank"
                                    className="inline-block px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-emerald-600 rounded-lg hover:opacity-90 transition"
                                >
                                    Download QR Code
                                </a>
                            </div>
                        </div>
                    </div>
                )}

                {/* Page_footer */}
                <div className="text-xs text-gray-500 border-t border-gray-200 pt-4 text-center sm:text-left">
                    <p>
                        Created at: {formatDate(asset.created_at)} | Last updated:{" "}
                        {formatDate(asset.updated_at)}
                    </p>
                </div>
            </div>
        </div>
    );
}
