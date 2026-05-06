"use client";

import { useEffect, useState } from "react";
import { Download, Smartphone, Globe, AlertCircle, CheckCircle, ArrowRight } from "lucide-react";

const isIOS = () => {
    if (typeof window === "undefined") return false;
    return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
};

const isStandalone = () => {
    if (typeof window === "undefined") return false;
    return (
        window.matchMedia("(display-mode: standalone).matches") ||
        (window.navigator as any).standalone === true
    );
};

const getBrowserName = () => {
    if (typeof window === "undefined") return "Unknown";
    const ua = window.navigator.userAgent;
    if (ua.includes("Chrome")) return "Chrome";
    if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
    if (ua.includes("Edge")) return "Edge";
    if (ua.includes("Firefox")) return "Firefox";
    return "Unknown";
};

const isBrowserSupported = () => {
    if (typeof window === "undefined") return false;
    const ua = window.navigator.userAgent;
    return ua.includes("Chrome") || ua.includes("Safari") || ua.includes("Edge");
};

const openCompatibleBrowser = () => {
    if (typeof window === "undefined") return;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
        window.location.href = "googlechrome://https://upkyp.com/public/download";
        setTimeout(() => {
            window.open("https://play.google.com/store/apps/details?id=com.android.chrome", "_blank");
        }, 2000);
    } else {
        window.open("https://www.google.com/chrome/", "_blank");
    }
};

export default function DownloadPage() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [browserSupported, setBrowserSupported] = useState(true);
    const [currentBrowser, setCurrentBrowser] = useState("");
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        if (isStandalone()) {
            setIsInstalled(true);
        }

        const browser = getBrowserName();
        setCurrentBrowser(browser);
        setBrowserSupported(isBrowserSupported());

        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstall = async () => {
        if (isIOS()) return;
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;

        if (choiceResult.outcome === "accepted") {
            setIsInstalled(true);
        }

        setDeferredPrompt(null);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-600 via-emerald-600 to-teal-700 px-4 py-8 sm:px-6">
            <div className="max-w-lg mx-auto">
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4">
                        <Smartphone className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">
                        Get Upkyp App
                    </h1>
                    <p className="text-white/80 text-sm mt-2">
                        Install for the best experience on your device
                    </p>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                    {/* Install Status */}
                    {isInstalled && (
                        <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-4 flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                            <p className="text-sm font-medium text-emerald-800">
                                App is installed! Enjoy the best experience.
                            </p>
                        </div>
                    )}

                    <div className="p-6">
                        {/* Install Button (non-iOS) */}
                        {!isIOS() && browserSupported && (
                            <button
                                onClick={handleInstall}
                                disabled={!deferredPrompt}
                                className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white transition-all mb-6 ${
                                    deferredPrompt
                                        ? "bg-gradient-to-r from-blue-600 to-emerald-600 hover:shadow-lg"
                                        : "bg-gray-400 cursor-not-allowed"
                                }`}
                            >
                                <Download className="w-5 h-5" />
                                Install App
                            </button>
                        )}

                        {/* Unsupported Browser */}
                        {!browserSupported && (
                            <div className="mb-6">
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-amber-800 text-sm">
                                                Use a compatible browser
                                            </h3>
                                            <p className="text-xs text-amber-700 mt-1">
                                                {currentBrowser} doesn't support PWA installation. 
                                                Please use Chrome, Safari, or Edge.
                                            </p>
                                            <button
                                                onClick={openCompatibleBrowser}
                                                className="mt-3 w-full py-2.5 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600"
                                            >
                                                Open in Chrome
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* iOS Instructions */}
                        {isIOS() && (
                            <div className="mb-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <Smartphone className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <h2 className="text-base font-bold text-gray-900">
                                        Install on iPhone
                                    </h2>
                                </div>

                                <div className="space-y-3">
                                    {/* Step 1 */}
                                    <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
                                        <div className="flex items-center gap-3 px-4 py-3">
                                            <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
                                                <span className="text-white text-xs font-bold">1</span>
                                            </div>
                                            <p className="text-sm text-gray-700">
                                                Tap the <span className="font-semibold">Share</span> button at the bottom of Safari
                                            </p>
                                        </div>
                                        <img
                                            src="https://res.cloudinary.com/dptmeluy0/image/upload/v1778076532/Step_1_zpcjfy.jpg"
                                            alt="Step 1: Tap Share button"
                                            className="w-full h-auto"
                                        />
                                    </div>

                                    {/* Step 2 */}
                                    <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
                                        <div className="flex items-center gap-3 px-4 py-3">
                                            <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
                                                <span className="text-white text-xs font-bold">2</span>
                                            </div>
                                            <p className="text-sm text-gray-700">
                                                Scroll and tap <span className="font-semibold">Add to Home Screen</span>
                                            </p>
                                        </div>
                                        <img
                                            src="https://res.cloudinary.com/dptmeluy0/image/upload/v1778076533/Step_2_qp7fpo.jpg"
                                            alt="Step 2: Tap Add to Home Screen"
                                            className="w-full h-auto"
                                        />
                                    </div>

                                    {/* Step 3 */}
                                    <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
                                        <div className="flex items-center gap-3 px-4 py-3">
                                            <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
                                                <span className="text-white text-xs font-bold">3</span>
                                            </div>
                                            <p className="text-sm text-gray-700">
                                                Tap <span className="font-semibold">Add</span> to confirm
                                            </p>
                                        </div>
                                        <img
                                            src="https://res.cloudinary.com/dptmeluy0/image/upload/v1778076534/Step_3_eoz8oy.jpg"
                                            alt="Step 3: Tap Add to confirm"
                                            className="w-full h-auto"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Android/Other Instructions */}
                        {!isIOS() && browserSupported && (
                            <div className="mb-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                                        <Download className="w-4 h-4 text-emerald-600" />
                                    </div>
                                    <h2 className="text-base font-bold text-gray-900">
                                        Install on {currentBrowser}
                                    </h2>
                                </div>

                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                    <ol className="text-sm text-gray-700 space-y-2">
                                        <li className="flex items-start gap-2">
                                            <span className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                                <span className="text-white text-[10px] font-bold">1</span>
                                            </span>
                                            Tap the browser menu (⋮ or ☰)
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                                <span className="text-white text-[10px] font-bold">2</span>
                                            </span>
                                            Select <span className="font-semibold">Install App</span> or <span className="font-semibold">Add to Home Screen</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                                <span className="text-white text-[10px] font-bold">3</span>
                                            </span>
                                            Confirm to install
                                        </li>
                                    </ol>
                                </div>
                            </div>
                        )}

                        {/* Recommended Browsers */}
                        {!browserSupported && (
                            <div className="mt-4">
                                <p className="text-xs font-medium text-gray-500 mb-2 text-center">
                                    Recommended browsers:
                                </p>
                                <div className="flex justify-center gap-4">
                                    <a href="https://www.google.com/chrome/" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1">
                                        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                                            <Globe className="w-6 h-6 text-white" />
                                        </div>
                                        <span className="text-[10px] text-gray-600 font-medium">Chrome</span>
                                    </a>
                                    <a href="https://www.apple.com/safari/" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1">
                                        <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center">
                                            <Globe className="w-6 h-6 text-white" />
                                        </div>
                                        <span className="text-[10px] text-gray-600 font-medium">Safari</span>
                                    </a>
                                    <a href="https://www.microsoft.com/edge/" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1">
                                        <div className="w-12 h-12 bg-cyan-600 rounded-xl flex items-center justify-center">
                                            <Globe className="w-6 h-6 text-white" />
                                        </div>
                                        <span className="text-[10px] text-gray-600 font-medium">Edge</span>
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Features Footer */}
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
                        <p className="text-xs font-medium text-gray-500 mb-3 text-center">
                            Features when installed:
                        </p>
                        <div className="flex justify-center gap-6">
                            <div className="text-center">
                                <Smartphone className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                                <span className="text-[10px] text-gray-600">Push Alerts</span>
                            </div>
                            <div className="text-center">
                                <Download className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                                <span className="text-[10px] text-gray-600">Fast Loading</span>
                            </div>
                            <div className="text-center">
                                <ArrowRight className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                                <span className="text-[10px] text-gray-600">Offline Access</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Skip Link */}
                <p className="text-center mt-6">
                    <a href="/auth/login" className="text-white/70 hover:text-white text-sm underline">
                        Skip and open web version
                    </a>
                </p>
            </div>
        </div>
    );
}
