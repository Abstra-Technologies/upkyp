"use client";

import { useEffect, useState } from "react";
import {
    Download,
    X,
    Smartphone,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] =
        useState<any>(null);
    const [showPrompt, setShowPrompt] =
        useState(false);
    const [isInstalling, setIsInstalling] =
        useState(false);

    useEffect(() => {
        const handleBeforeInstallPrompt = (
            e: any
        ) => {
            e.preventDefault();
            setDeferredPrompt(e);

            const dismissed =
                localStorage.getItem(
                    "installPromptDismissed"
                );

            if (!dismissed) {
                setTimeout(
                    () => setShowPrompt(true),
                    2500
                );
            }
        };

        window.addEventListener(
            "beforeinstallprompt",
            handleBeforeInstallPrompt
        );

        return () => {
            window.removeEventListener(
                "beforeinstallprompt",
                handleBeforeInstallPrompt
            );
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        setIsInstalling(true);
        deferredPrompt.prompt();

        const { outcome } =
            await deferredPrompt.userChoice;

        setDeferredPrompt(null);
        setShowPrompt(false);
        setIsInstalling(false);
        localStorage.setItem(
            "installPromptDismissed",
            "true"
        );
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem(
            "installPromptDismissed",
            "true"
        );
    };

    return (
        <AnimatePresence>
            {showPrompt && (
                <>
                    {/* =========================
             DESKTOP CARD (Bottom Left)
          ========================== */}
                    <motion.div
                        initial={{
                            opacity: 0,
                            x: -40,
                            scale: 0.95,
                        }}
                        animate={{
                            opacity: 1,
                            x: 0,
                            scale: 1,
                        }}
                        exit={{
                            opacity: 0,
                            x: -40,
                            scale: 0.95,
                        }}
                        transition={{
                            type: "spring",
                            damping: 25,
                            stiffness: 260,
                        }}
                        className="hidden sm:block fixed bottom-6 left-6 z-[90]"
                    >
                        <div className="relative w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">

                            {/* Top Accent */}
                            <div className="h-0.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500" />

                            {/* Close */}
                            <button
                                onClick={handleDismiss}
                                className="absolute top-2 right-2 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>

                            <div className="p-4">

                                {/* Header */}
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-emerald-500 flex items-center justify-center shadow-md flex-shrink-0">
                                        <Smartphone className="w-5 h-5 text-white" />
                                    </div>

                                    <div>
                                        <h3 className="font-semibold text-gray-900 text-sm">
                                            Install Upkyp
                                        </h3>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Faster access from your home screen.
                                        </p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 mt-4">
                                    <button
                                        onClick={handleDismiss}
                                        className="flex-1 px-3 py-2 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition"
                                    >
                                        Not now
                                    </button>

                                    <button
                                        onClick={handleInstallClick}
                                        disabled={isInstalling}
                                        className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-700 hover:to-emerald-600 shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-70"
                                    >
                                        {isInstalling ? (
                                            <>
                                                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Installing...
                                            </>
                                        ) : (
                                            <>
                                                <Download className="w-3.5 h-3.5" />
                                                Install
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* Don't show again */}
                                <label className="flex items-center gap-2 mt-3 text-xs text-gray-500 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                localStorage.setItem("installPromptDismissed", "true");
                                            }
                                        }}
                                    />
                                    Don't show again
                                </label>
                            </div>
                        </div>
                    </motion.div>

                    {/* =========================
              MOBILE FAB (Bottom Left)
           ========================== */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        transition={{
                            type: "spring",
                            damping: 25,
                            stiffness: 260,
                        }}
                        className="sm:hidden fixed bottom-6 left-4 z-[90]"
                    >
                        <button
                            onClick={handleInstallClick}
                            disabled={isInstalling}
                            className="w-12 h-12 bg-gradient-to-r from-blue-600 to-emerald-500 text-white rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center active:scale-95 transition-transform disabled:opacity-70"
                        >
                            {isInstalling ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Download className="w-5 h-5" />
                            )}
                        </button>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
