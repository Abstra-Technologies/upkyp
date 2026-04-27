"use client";

import { useEffect, useState } from "react";
import {
    Download,
    X,
    Smartphone,
    Sparkles,
    Rocket,
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
                sessionStorage.getItem(
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
        sessionStorage.setItem(
            "installPromptDismissed",
            "true"
        );
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        sessionStorage.setItem(
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
                        <div className="relative w-88 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">

                            {/* Top Accent */}
                            <div className="h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500" />

                            {/* Close */}
                            <button
                                onClick={handleDismiss}
                                className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <div className="p-6">

                                {/* Header */}
                                <div className="flex items-start gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-500 flex items-center justify-center shadow-lg">
                                        <Smartphone className="w-7 h-7 text-white" />
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">
                                            Install Upkyp
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Get faster access directly
                                            from your home screen.
                                        </p>
                                    </div>
                                </div>

                                {/* Benefits */}
                                <div className="flex items-center gap-5 mt-5 text-xs text-gray-500">
                                    <div className="flex items-center gap-1.5">
                                        <Rocket className="w-4 h-4 text-blue-500" />
                                        <span>Instant launch</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Sparkles className="w-4 h-4 text-emerald-500" />
                                        <span>Smoother experience</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-3 mt-6">
                                    <button
                                        onClick={handleDismiss}
                                        className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition"
                                    >
                                        Not now
                                    </button>

                                    <button
                                        onClick={handleInstallClick}
                                        disabled={isInstalling}
                                        className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-700 hover:to-emerald-600 shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                                    >
                                        {isInstalling ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Installing...
                                            </>
                                        ) : (
                                            <>
                                                <Download className="w-4 h-4" />
                                                Install
                                            </>
                                        )}
                                    </button>
                                </div>
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
