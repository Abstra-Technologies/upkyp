"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
    X,
    DollarSign,
    Tag,
    FileText,
    Loader2,
    Building2,
} from "lucide-react";
import { toast } from "react-toastify";

const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
};

const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { type: "spring", stiffness: 300, damping: 25 },
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        y: 20,
        transition: { duration: 0.2 },
    },
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
};

const fadeInUp = {
    hidden: { opacity: 0, y: 15 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: "spring", stiffness: 300, damping: 24 },
    },
};

const expenseCategories = [
    { value: "maintenance", label: "Maintenance", icon: "🔧", color: "from-blue-500 to-cyan-500" },
    { value: "utilities", label: "Utilities", icon: "💡", color: "from-amber-500 to-orange-500" },
    { value: "supplies", label: "Supplies", icon: "📦", color: "from-purple-500 to-indigo-500" },
    { value: "repairs", label: "Repairs", icon: "🛠️", color: "from-emerald-500 to-teal-500" },
    { value: "insurance", label: "Insurance", icon: "🛡️", color: "from-rose-500 to-pink-500" },
    { value: "taxes", label: "Taxes", icon: "📄", color: "from-slate-500 to-gray-500" },
    { value: "advertising", label: "Advertising", icon: "📢", color: "from-violet-500 to-purple-500" },
    { value: "other", label: "Other", icon: "📋", color: "from-gray-400 to-gray-500" },
];

interface ExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function ExpenseModal({ isOpen, onClose, onSuccess }: ExpenseModalProps) {
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("other");
    const [propertyId, setPropertyId] = useState("");
    const [loading, setLoading] = useState(false);
    const [properties, setProperties] = useState<{ property_id: string; property_name: string }[]>([]);

    useEffect(() => {
        if (isOpen) {
            fetchProperties();
            setAmount("");
            setDescription("");
            setCategory("other");
            setPropertyId("");
        }
    }, [isOpen]);

    const fetchProperties = async () => {
        try {
            const res = await axios.get("/api/landlord/properties/getAllPropertieName");
            setProperties(res.data || []);
        } catch (err) {
            console.error("Error fetching properties:", err);
        }
    };

    const selectedCategory = expenseCategories.find((c) => c.value === category);

    const handleSave = async () => {
        if (!amount || Number(amount) <= 0) {
            toast.warn("Please enter a valid expense amount.");
            return;
        }

        setLoading(true);

        try {
            await axios.post("/api/landlord/expenses", {
                amount: parseFloat(amount),
                description: description.trim() || null,
                category,
                property_id: propertyId || null,
                reference_type: "manual",
                reference_id: null,
            });

            toast.success("Expense recorded successfully!");
            onSuccess?.();
            onClose();
        } catch (error: any) {
            console.error(error);
            toast.error(error?.response?.data?.message || "Failed to save expense. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    variants={backdropVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    onClick={onClose}
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center"
                >
                    <motion.div
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white w-full sm:max-w-md rounded-t-xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                        style={{ maxHeight: "90vh" }}
                    >
                        {/* Mobile drag handle */}
                        <div className="sm:hidden flex justify-center pt-2 bg-gradient-to-r from-blue-500 to-emerald-500">
                            <div className="w-9 h-1 rounded-full bg-white/40" />
                        </div>

                        {/* Header */}
                        <div className="relative overflow-hidden flex-shrink-0">
                            <div className={`absolute inset-0 bg-gradient-to-r ${selectedCategory?.color || "from-blue-500 to-emerald-500"}`} />
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full" />
                            <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/10 rounded-full" />

                            <div className="relative p-3 sm:p-5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center">
                                            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-sm sm:text-lg font-bold text-white">
                                                Add Expense
                                            </h2>
                                            <p className="text-[11px] sm:text-sm text-white/80">
                                                Record a new expense
                                            </p>
                                        </div>
                                    </div>

                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={onClose}
                                        className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg sm:rounded-xl transition-colors"
                                    >
                                        <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                    </motion.button>
                                </div>
                            </div>
                        </div>

                        {/* Body */}
                        <motion.div
                            variants={staggerContainer}
                            initial="hidden"
                            animate="visible"
                            className="p-3 sm:p-5 space-y-3 sm:space-y-5 flex-1 overflow-y-auto overscroll-contain"
                        >
                            {/* Amount Input */}
                            <motion.div variants={fadeInUp}>
                                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                                    Expense Amount
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm sm:text-base">
                                        ₱
                                    </span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        inputMode="decimal"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full pl-8 sm:pl-9 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl text-base sm:text-lg font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        placeholder="0.00"
                                    />
                                </div>
                            </motion.div>

                            {/* Property Selection */}
                            <motion.div variants={fadeInUp}>
                                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                                    Property
                                    <span className="text-gray-400 font-normal ml-1">(Optional)</span>
                                </label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                                    <select
                                        value={propertyId}
                                        onChange={(e) => setPropertyId(e.target.value)}
                                        className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white appearance-none"
                                    >
                                        <option value="">No property selected</option>
                                        {properties.map((p) => (
                                            <option key={p.property_id} value={p.property_id}>
                                                {p.property_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </motion.div>

                            {/* Category Selection */}
                            <motion.div variants={fadeInUp}>
                                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                                    Category
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
                                    {expenseCategories.map((cat) => (
                                        <motion.button
                                            key={cat.value}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setCategory(cat.value)}
                                            className={`flex flex-col items-center gap-0.5 sm:gap-1 p-1.5 sm:p-3 rounded-lg sm:rounded-xl border-2 transition-all duration-200 ${
                                                category === cat.value
                                                    ? `border-transparent bg-gradient-to-r ${cat.color} text-white shadow-lg`
                                                    : "border-gray-200 bg-white text-gray-700"
                                            }`}
                                        >
                                            <span className="text-base sm:text-xl">{cat.icon}</span>
                                            <span className="text-[9px] sm:text-xs font-medium text-center leading-tight">
                                                {cat.label}
                                            </span>
                                        </motion.button>
                                    ))}
                                </div>
                            </motion.div>

                            {/* Description */}
                            <motion.div variants={fadeInUp}>
                                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                                    Description
                                    <span className="text-gray-400 font-normal ml-1">(Optional)</span>
                                </label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-2.5 sm:top-3 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none text-xs sm:text-sm"
                                        placeholder="Add notes about this expense..."
                                        rows={2}
                                    />
                                </div>
                            </motion.div>
                        </motion.div>

                        {/* Footer */}
                        <div
                            className="p-3 sm:p-5 border-t border-gray-100 bg-gray-50/50 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 flex-shrink-0"
                            style={{
                                paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0.75rem))",
                            }}
                        >
                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                onClick={onClose}
                                disabled={loading}
                                className="flex-1 px-4 py-2.5 sm:py-3 bg-white border border-gray-200 text-gray-700 rounded-xl transition-all font-medium text-xs sm:text-sm disabled:opacity-50"
                            >
                                Cancel
                            </motion.button>

                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSave}
                                disabled={loading}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-xl font-semibold text-xs sm:text-sm transition-all ${
                                    loading
                                        ? "bg-blue-400 cursor-not-allowed"
                                        : `bg-gradient-to-r ${selectedCategory?.color || "from-blue-600 to-emerald-600"}`
                                } text-white`}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Tag className="w-4 h-4" />
                                        Save Expense
                                    </>
                                )}
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
