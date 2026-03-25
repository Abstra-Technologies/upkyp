"use client";

import { useEffect, useState } from "react";
import { Download, Smartphone, Globe, AlertCircle, Check } from "lucide-react";

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
        window.location.href = "googlechrome://https://upkyp.com/pages/public/download";
        setTimeout(() => {
            window.open("https://play.google.com/store/apps/details?id=com.android.chrome", "_blank");
        }, 2000);
    } else {
        window.open("https://www.google.com/chrome/", "_blank");
    }
};

export default function DownloadPage() {
    const [isPWAInstalled, setIsPWAInstalled] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [browserSupported, setBrowserSupported] = useState(true);
    const [currentBrowser, setCurrentBrowser] = useState("");

    useEffect(() => {
        if (isStandalone()) {
            setIsPWAInstalled(true);
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
            setIsPWAInstalled(true);
        }

        setDeferredPrompt(null);
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 sm:px-6">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-emerald-600 to-teal-700" />

            <div className="relative z-10 w-full max-w-md">
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4">
                        <Smartphone className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">
                        Get Upkyp App
                    </h1>
                    <p className="text-white/80 text-sm mt-2">
                        Install for the best experience
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                    {isPWAInstalled ? (
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Check className="w-8 h-8 text-green-600" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">App Installed!</h2>
                            <p className="text-gray-600 text-sm mt-2">
                                UpKyp is ready to use. Open it from your home screen.
                            </p>
                        </div>
                    ) : (
                        <div className="p-6">
                            {!browserSupported ? (
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

                                    <div className="mt-4">
                                        <p className="text-xs font-medium text-gray-500 mb-2">
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
                                </div>
                            ) : (
                                <>
                                    <button
                                        onClick={handleInstall}
                                        disabled={!deferredPrompt && !isIOS()}
                                        className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white transition-all ${
                                            deferredPrompt || isIOS()
                                                ? "bg-gradient-to-r from-blue-600 to-emerald-600 hover:shadow-lg"
                                                : "bg-gray-400 cursor-not-allowed"
                                        }`}
                                    >
                                        <Download className="w-5 h-5" />
                                        Install App
                                    </button>

                                    {isIOS() && (
                                        <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                                            <p className="text-sm font-medium text-gray-800 mb-2">
                                                How to install on iPhone:
                                            </p>
                                            <ol className="text-xs text-gray-600 space-y-1">
                                                <li>1. Tap the <span className="font-semibold">Share</span> button</li>
                                                <li>2. Tap <span className="font-semibold">Add to Home Screen</span></li>
                                                <li>3. Tap <span className="font-semibold">Add</span> to confirm</li>
                                            </ol>
                                        </div>
                                    )}

                                    {!isIOS() && !deferredPrompt && (
                                        <p className="text-xs text-gray-500 text-center mt-3">
                                            Already installed? Look for the install icon in your browser menu.
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    <div className="bg-gray-50 px-6 py-4">
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
                        </div>
                    </div>
                </div>

                <p className="text-center mt-6">
                    <a href="/pages/auth/login" className="text-white/70 hover:text-white text-sm underline">
                        Skip and open web version
                    </a>
                </p>
            </div>
        </div>
    );
}
