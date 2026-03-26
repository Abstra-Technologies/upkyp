"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Download, X, CalendarDays, Building2 } from "lucide-react";
import { useEffect, useState } from "react";

interface PropertyOption {
    property_id: string;
    property_name: string;
}

interface Props {
    open: boolean;
    onClose: () => void;
    landlord_id: string;
    onDownload: (filters: {
        property_id: string | "all";
        year: string;
        month: string; // "01"–"12"
    }) => void;
    properties: PropertyOption[];
    isDownloading: boolean; // ✅ used properly now
}

const MONTHS = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
];

export default function PaymentReportModal({
                                               open,
                                               onClose,
                                               onDownload,
                                               landlord_id,
                                               properties,
                                               isDownloading,
                                           }: Props) {
    const [propertyId, setPropertyId] = useState<string | "all">("all");
    const [years, setYears] = useState<number[]>([]);
    const [year, setYear] = useState("");
    const [month, setMonth] = useState("");
    const [loadingYears, setLoadingYears] = useState(false);

    /* =========================
       FETCH YEARS (PROPERTY-BASED)
    ========================== */
    useEffect(() => {
        if (!open || !landlord_id) return;

        setLoadingYears(true);
        setYears([]);
        setYear("");
        setMonth("");

        const params = new URLSearchParams({ landlord_id });
        if (propertyId !== "all") params.set("property_id", propertyId);

        fetch(`/api/landlord/properties/getStartYearOfLease?${params.toString()}`)
            .then((res) => res.json())
            .then((data) => {
                const list = data?.years || [];
                setYears(list);
                if (list.length) setYear(String(list[0]));
            })
            .catch(() => {
                setYears([]);
                setYear("");
            })
            .finally(() => setLoadingYears(false));
    }, [open, landlord_id, propertyId]);

    /* =========================
       RESET ON CLOSE
    ========================== */
    useEffect(() => {
        if (!open) {
            setPropertyId("all");
            setYears([]);
            setYear("");
            setMonth("");
        }
    }, [open]);

    /* =========================
       AUTO-SET CURRENT MONTH
    ========================== */
    useEffect(() => {
        if (year && !month) {
            setMonth(String(new Date().getMonth() + 1).padStart(2, "0"));
        }
    }, [year, month]);

    const canDownload = Boolean(year && month);

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop (locked while downloading) */}
                    <motion.div
                        className="fixed inset-0 bg-black/50 z-40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => !isDownloading && onClose()}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 40 }}
                        className="
              fixed z-50 inset-x-4 bottom-6
              lg:inset-auto lg:top-24 lg:right-8 lg:left-auto lg:bottom-auto
              lg:w-96 lg:max-w-none
              bg-white rounded-2xl shadow-xl p-5
            "
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                                <Download className="w-5 h-5 text-emerald-600" />
                                Download Report
                            </h3>

                            <button
                                onClick={onClose}
                                disabled={isDownloading}
                                className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 disabled:opacity-40"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Filters */}
                        <div className="space-y-4">
                            {/* Property */}
                            <div>
                                <label className="text-xs font-semibold text-gray-600 mb-1 block">
                                    Property
                                </label>
                                <div className="relative">
                                    <Building2 className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <select
                                        value={propertyId}
                                        disabled={isDownloading}
                                        onChange={(e) =>
                                            setPropertyId(e.target.value as "all" | string)
                                        }
                                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm bg-white disabled:bg-gray-100"
                                    >
                                        <option value="all">All Properties</option>
                                        {properties.map((p) => (
                                            <option key={p.property_id} value={p.property_id}>
                                                {p.property_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Year */}
                            <div>
                                <label className="text-xs font-semibold text-gray-600 mb-1 block">
                                    Year
                                </label>
                                <div className="relative">
                                    <CalendarDays className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <select
                                        value={year}
                                        disabled={loadingYears || !years.length || isDownloading}
                                        onChange={(e) => {
                                            setYear(e.target.value);
                                            setMonth("");
                                        }}
                                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm bg-white disabled:bg-gray-100"
                                    >
                                        {loadingYears && <option>Loading years…</option>}
                                        {!loadingYears && !years.length && (
                                            <option>No data available</option>
                                        )}
                                        {years.map((y) => (
                                            <option key={y} value={y}>
                                                {y}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Month */}
                            <div>
                                <label className="text-xs font-semibold text-gray-600 mb-1 block">
                                    Month
                                </label>
                                <div className="relative">
                                    <CalendarDays className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <select
                                        value={month}
                                        disabled={!year || isDownloading}
                                        onChange={(e) => setMonth(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm bg-white disabled:bg-gray-100"
                                    >
                                        <option value="">Select month</option>
                                        {MONTHS.map((m) => (
                                            <option key={m.value} value={m.value}>
                                                {m.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-6 flex flex-col sm:flex-row gap-2">
                            <button
                                onClick={onClose}
                                disabled={isDownloading}
                                className="w-full sm:w-auto px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                disabled={!canDownload || isDownloading}
                                onClick={() =>
                                    onDownload({
                                        property_id: propertyId,
                                        year,
                                        month,
                                    })
                                }
                                className="
                  w-full sm:w-auto px-4 py-2 rounded-lg
                  bg-gradient-to-r from-blue-600 to-emerald-600
                  text-white font-semibold
                  flex items-center justify-center gap-2
                  disabled:opacity-60 disabled:cursor-not-allowed
                "
                            >
                                {isDownloading ? (
                                    <>
                                        <motion.span
                                            animate={{ rotate: 360 }}
                                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                            className="inline-block"
                                        >
                                            <Download className="w-4 h-4" />
                                        </motion.span>
                                        Preparing report…
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-4 h-4" />
                                        Download PDF
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
