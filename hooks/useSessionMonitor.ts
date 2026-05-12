import { useEffect, useRef, useCallback } from "react";
import Swal from "sweetalert2";
import useAuthStore from "@/zustand/authStore";

const WARNING_BEFORE_EXPIRY = 5 * 60 * 1000;
const SESSION_DURATION = 2 * 60 * 60 * 1000;
const ACTIVITY_EVENTS = ["mousedown", "keydown", "scroll", "touchstart", "mousemove"];

let swalShown = false;

export function useSessionMonitor() {
    const { signOut, signOutAdmin, user, admin } = useAuthStore();
    const lastActivityRef = useRef(0);
    const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const resetTimer = useCallback(() => {
        lastActivityRef.current = Date.now();
    }, []);

    const handleLogout = useCallback(() => {
        if (admin) {
            signOutAdmin();
        } else {
            signOut();
        }
    }, [signOut, signOutAdmin, admin]);

    const handleExtend = useCallback(async () => {
        try {
            await fetch("/api/auth/refresh", {
                method: "POST",
                credentials: "include",
            });
            lastActivityRef.current = Date.now();
            Swal.close();
            swalShown = false;
        } catch {
            handleLogout();
        }
    }, [handleLogout]);

    useEffect(() => {
        if (!user && !admin) return;

        resetTimer();

        for (const event of ACTIVITY_EVENTS) {
            window.addEventListener(event, resetTimer, { passive: true });
        }

        checkIntervalRef.current = setInterval(() => {
            const elapsed = Date.now() - lastActivityRef.current;
            const remaining = SESSION_DURATION - elapsed;

            if (remaining <= WARNING_BEFORE_EXPIRY && remaining > 0 && !swalShown) {
                swalShown = true;

                const minutes = Math.floor(remaining / 60000);
                const seconds = Math.floor((remaining % 60000) / 1000);

                Swal.fire({
                    title: "Session Expiring Soon",
                    html: `
                        <p class="text-gray-600 mb-2">Your session will expire in <strong id="countdown">${minutes}:${String(seconds).padStart(2, "0")}</strong>.</p>
                        <p class="text-sm text-gray-500">Would you like to stay logged in?</p>
                    `,
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonText: "Stay Logged In",
                    cancelButtonText: "Log Out",
                    confirmButtonColor: "#059669",
                    cancelButtonColor: "#dc2626",
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    didOpen: () => {
                        let remainingMs = remaining;
                        const countdownEl = document.getElementById("countdown");

                        const countdownInterval = setInterval(() => {
                            remainingMs -= 1000;
                            if (remainingMs <= 0) {
                                clearInterval(countdownInterval);
                                handleLogout();
                                return;
                            }
                            if (countdownEl) {
                                const m = Math.floor(remainingMs / 60000);
                                const s = Math.floor((remainingMs % 60000) / 1000);
                                countdownEl.textContent = `${m}:${String(s).padStart(2, "0")}`;
                            }
                        }, 1000);

                        const popup = Swal.getPopup();
                        if (popup) {
                            popup.dataset.countdownInterval = countdownInterval.toString();
                        }
                    },
                    willClose: () => {
                        const popup = Swal.getPopup();
                        if (popup?.dataset.countdownInterval) {
                            clearInterval(parseInt(popup.dataset.countdownInterval));
                        }
                    },
                }).then((result) => {
                    if (result.isConfirmed) {
                        handleExtend();
                    } else {
                        handleLogout();
                    }
                });
            }

            if (remaining <= 0 && !swalShown) {
                handleLogout();
            }
        }, 30000);

        return () => {
            for (const event of ACTIVITY_EVENTS) {
                window.removeEventListener(event, resetTimer);
            }
            if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
            if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
            swalShown = false;
        };
    }, [user, admin, resetTimer, handleExtend, handleLogout]);
}
