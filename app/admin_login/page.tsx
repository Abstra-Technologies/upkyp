"use client";

import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import { logEvent } from "@/utils/gtag";

export default function LoginAdmin() {
    const router = useRouter();

    const [form, setForm] = useState({
        login: "",
        password: "",
    });

    const [attempts, setAttempts] = useState(0);
    const [isLocked, setIsLocked] = useState(false);
    const [remainingSeconds, setRemainingSeconds] = useState(0);

    /* ================= LOCK STATE ================= */
    useEffect(() => {
        const stored = localStorage.getItem("admin_lock_until");
        if (!stored) return;

        const lockUntil = Number(stored);
        if (Date.now() < lockUntil) {
            setIsLocked(true);
            startCountdown(lockUntil);
        } else {
            localStorage.removeItem("admin_lock_until");
        }
    }, []);

    const startCountdown = (lockUntil: number) => {
        const interval = setInterval(() => {
            const remaining = Math.ceil((lockUntil - Date.now()) / 1000);
            if (remaining <= 0) {
                clearInterval(interval);
                setIsLocked(false);
                setRemainingSeconds(0);
                setAttempts(0);
                localStorage.removeItem("admin_lock_until");
            } else {
                setRemainingSeconds(remaining);
            }
        }, 1000);
    };

    /* ================= HANDLERS ================= */
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isLocked) {
            await Swal.fire({
                icon: "warning",
                title: "Account Locked",
                text: `Try again in ${remainingSeconds}s`,
            });
            return;
        }

        try {
            const res = await fetch("/api/systemadmin/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(form),
            });

            /* ================= SUCCESS (REDIRECT) ================= */
            if (res.redirected) {
                logEvent("Admin Login", "Authentication", "Success", 1);
                window.location.href = res.url;
                return;
            }

            /* ================= SUCCESS (JSON 200) ================= */
            if (res.ok) {
                const data = await res.json().catch(() => ({}));
                const redirectTo =
                    data.redirectTo || "/pages/system_admin/dashboard";

                logEvent("Admin Login", "Authentication", "Success", 1);
                window.location.href = redirectTo;
                return;
            }

            /* ================= FAILURE ================= */
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || "Invalid credentials");

        } catch (err: any) {
            const newAttempts = attempts + 1;
            setAttempts(newAttempts);

            logEvent("Admin Login", "Authentication", "Failed", newAttempts);

            await Swal.fire({
                icon: "error",
                title: "Login Failed",
                text: err.message,
            });

            if (newAttempts >= 3) {
                const lockUntil = Date.now() + 60_000;
                setIsLocked(true);
                setRemainingSeconds(60);
                localStorage.setItem("admin_lock_until", String(lockUntil));
                startCountdown(lockUntil);
            }
        }
    };

    /* ================= UI ================= */
    return (
        <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4">
            {/* Background glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.15),transparent_60%)]" />

            <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-white/95 p-8 shadow-2xl backdrop-blur">
                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-extrabold tracking-tight text-blue-600">
                        UPKYP Admin
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Authorized personnel only
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Login */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Email or Username
                        </label>
                        <input
                            name="login"
                            required
                            disabled={isLocked}
                            value={form.login}
                            onChange={handleChange}
                            placeholder="admin@upkyp.com"
                            className={`w-full rounded-lg border px-4 py-3 text-sm outline-none transition ${
                                isLocked
                                    ? "bg-gray-100 text-gray-400"
                                    : "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                            }`}
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <input
                            type="password"
                            name="password"
                            required
                            disabled={isLocked}
                            value={form.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            className={`w-full rounded-lg border px-4 py-3 text-sm outline-none transition ${
                                isLocked
                                    ? "bg-gray-100 text-gray-400"
                                    : "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                            }`}
                        />
                    </div>

                    {/* Button */}
                    <button
                        type="submit"
                        disabled={isLocked}
                        className={`mt-2 w-full rounded-lg py-3 text-sm font-semibold tracking-wide text-white transition-all ${
                            isLocked
                                ? "cursor-not-allowed bg-gray-400"
                                : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:scale-[0.98]"
                        }`}
                    >
                        {isLocked ? `Locked (${remainingSeconds}s)` : "Sign in"}
                    </button>
                </form>

                {/* Attempts */}
                {attempts > 0 && attempts < 3 && !isLocked && (
                    <p className="mt-4 text-center text-xs text-amber-600">
                        {3 - attempts} login attempt{3 - attempts > 1 ? "s" : ""} remaining
                    </p>
                )}

                {/* Lock warning */}
                {isLocked && (
                    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-center text-xs font-medium text-red-700">
                        Too many failed attempts. Please wait before trying again.
                    </div>
                )}
            </div>
        </div>
    );

}
