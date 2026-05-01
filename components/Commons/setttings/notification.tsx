"use client";

import { useEffect, useState } from "react";

/* ===============================
   HELPERS
================================ */
function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    const raw = atob(base64);
    return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

interface NotificationManagerProps {
    user_id: string;
}

export default function NotificationManager({ user_id }: NotificationManagerProps) {
    const [active, setActive] = useState(false);
    const [loading, setLoading] = useState(true);
    const [platform, setPlatform] = useState<"web" | "android" | "ios">("web");

    /* ===============================
       LOAD CURRENT STATUS
    ================================ */
    useEffect(() => {
        if (!user_id || !platform) return;

        fetch(`/api/push/notification-status?user_id=${user_id}&platform=${platform}`)
            .then((res) => res.json())
            .then((data) => {
                if (typeof data.active === "boolean") {
                    setActive(data.active);
                }
            })
            .catch((err) =>
                console.error("Error loading notification status:", err)
            )
            .finally(() => setLoading(false));
    }, [user_id, platform]);

    /* ===============================
       ENABLE WEB PUSH
    ================================ */
    const enableWebPush = async () => {
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
            alert("Push notifications are not supported on this browser.");
            return false;
        }

        // iOS Web Push works ONLY in PWA-installed Safari
        if (
            platform === "ios" &&
            !(window.matchMedia("(display-mode: standalone)").matches)
        ) {
            alert("Please add this app to your Home Screen to enable notifications.");
            return false;
        }

        const permission = await Notification.requestPermission();
        if (permission !== "granted") return false;

        const registration = await navigator.serviceWorker.register("/sw.js");

        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
        const appServerKey = urlBase64ToUint8Array(vapidKey);

        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: appServerKey,
            });
        }

        await fetch("/api/push/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userId: user_id,
                subscription,
                userAgent: navigator.userAgent,
                platform,
            }),
        });

        return true;
    };

    /* ===============================
       DISABLE WEB PUSH
    ================================ */
    const disableWebPush = async () => {
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = await reg?.pushManager.getSubscription();
        await sub?.unsubscribe();

        await fetch("/api/push/unsubscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user_id, platform }),
        });
    };

    /* ===============================
       TOGGLE HANDLER
    ================================ */
    const handleToggle = async () => {
        const newActive = !active;
        setActive(newActive); // optimistic

        try {
            if (newActive) {
                if (platform === "android") {
                    // Android handled globally in ClientLayout
                    await fetch("/api/push/toggle", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ userId: user_id, platform, active: true }),
                    });
                    return;
                }

                const success = await enableWebPush();
                if (!success) throw new Error("Enable failed");
            } else {
                if (platform !== "android") {
                    await disableWebPush();
                }

                await fetch("/api/push/toggle", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId: user_id, platform, active: false }),
                });
            }
        } catch (err) {
            console.error("Toggle failed:", err);
            setActive(!newActive);
        }
    };

    if (loading) {
        return <p className="text-gray-500 text-sm">Loading notification settings…</p>;
    }

    return (
        <label className="flex items-center cursor-pointer space-x-3">
            <div className="relative">
                <input
                    type="checkbox"
                    checked={active}
                    onChange={handleToggle}
                    className="sr-only"
                />
                <div
                    className={`w-12 h-6 rounded-full transition-colors ${
                        active ? "bg-emerald-600" : "bg-gray-300"
                    }`}
                />
                <div
                    className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        active ? "translate-x-6" : "translate-x-0"
                    }`}
                />
            </div>

            <span className="text-gray-700 font-medium">
                Push Notifications ({platform.toUpperCase()}) {active ? "ON" : "OFF"}
            </span>
        </label>
    );
}
