"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import Navbar from "../components/navigation/navbar";
import useAuthStore from "../zustand/authStore";
import Swal from "sweetalert2";
import { SpeedInsights } from "@vercel/speed-insights/next"

function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const raw = atob(base64);
    return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const { fetchSession, user, admin } = useAuthStore();
    const user_id = user?.user_id ?? admin?.admin_id;
    const [sessionExpired, setSessionExpired] = useState(false);
    const [sessionChecked, setSessionChecked] = useState(false);

    /* =========================================
       REAL-TIME SESSION POLLING (30s)
    ========================================= */
    useEffect(() => {
        if (!user && !admin) return;

        const interval = setInterval(async () => {
            try {
                await fetchSession(); // This will refresh Zustand user/admin state
            } catch (err: any) {
                if (err?.status === 401) {
                    setSessionExpired(true);
                }
            }
        }, 20000);

        return () => clearInterval(interval);
    }, [user?.user_id, admin?.admin_id]);

    // ANDROID PUSH (CAPACITOR)
    useEffect(() => {
        const loadAndroidPush = async () => {
            const isNativeAndroid = typeof window !== "undefined" &&
                (window as any).Capacitor?.getPlatform?.() === "android";

            if (!isNativeAndroid || !user_id) return;

            const { initAndroidPush } = await import("@/utils/android/push-android");

            const fcmToken = await initAndroidPush();

            if (fcmToken) {
                await fetch("/api/push/save-token", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        userId: user_id,
                        token: fcmToken,
                        platform: "android",
                    }),
                });
            }
        };

        loadAndroidPush();
    }, [user_id]);

    /* =========================================
       REAL-TIME STATUS CHECK
    ========================================= */
    useEffect(() => {
        if (!sessionChecked) return;

        const currentStatus = user?.status || admin?.status;

        if (!currentStatus) return;

        if (currentStatus !== "active") {

            Swal.fire({
                title: "Account Suspended",
                text: "Your account has been suspended by the system administrator.",
                icon: "error",
                allowOutsideClick: false,
                allowEscapeKey: false,
                confirmButtonText: "OK",
            }).then(() => {

                // Clear both tokens
                document.cookie = "token=; path=/; max-age=0; SameSite=Lax";
                document.cookie = "adminToken=; path=/; max-age=0; SameSite=Lax";

                const isAdmin = !!admin && !user;

                const loginUrl = isAdmin
                    ? "/admin_login"
                    : "/auth/login";

                window.location.href = loginUrl;
            });
        }
    }, [user?.status, admin?.status, sessionChecked]);

    // Session Expired

    useEffect(() => {
        if (!sessionExpired) return;

        const isAdmin = !!admin && !user;

        // 🔁 Preserve current page (path + query)
        const callbackUrl =
            typeof window !== "undefined"
                ? window.location.pathname + window.location.search
                : "/";

        Swal.fire({
            title: "Session Expired",
            text: "Your session has expired. Redirecting to login...",
            icon: "warning",
            showConfirmButton: false,
            timer: 2500,
            timerProgressBar: true,
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
                Swal.showLoading();
            },
        });

        const redirectTimer = setTimeout(() => {
            setSessionExpired(false);

            const loginUrl = isAdmin
                ? `/admin_login?callbackUrl=${encodeURIComponent(callbackUrl)}`
                : `/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;

            window.location.href = loginUrl;
        }, 2500);

        return () => clearTimeout(redirectTimer);
    }, [sessionExpired, admin, user]);


    useEffect(() => {
        if (!user_id) return;

        const setupWebPush = async () => {
            if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
                console.warn("🚫 Push not supported in this browser.");
                return;
            }
            try {
                // 1) Register service worker
                const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
                console.log("✅ SW registered:", registration);

                // 2) Ask for permission
                let permission = Notification.permission;
                if (permission === "default") {
                    permission = await Notification.requestPermission();
                }
                if (permission !== "granted") {
                    console.warn("🔕 Notifications not granted");
                    return;
                }

                // 3) Subscribe (reuse if already exists)
                const existing = await registration.pushManager.getSubscription();
                const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
                const appServerKey = urlBase64ToUint8Array(vapidKey);

                const subscription =
                    existing ||
                    (await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: appServerKey,
                    }));

                // 4) Save to backend if new
                const cacheKey = admin ? "push_endpoint_admin" : "push_endpoint";
                const isNewSubscription = localStorage.getItem(cacheKey) !== subscription.endpoint;
                
                if (isNewSubscription) {
                    await fetch("/api/push/subscribe", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            userId: user?.user_id || null,
                            adminId: admin?.admin_id || null,
                            subscription,
                            userAgent: navigator.userAgent,
                        }),
                    });
                    localStorage.setItem(cacheKey, subscription.endpoint);
                    console.log("📬 Subscription saved to backend");
                }
            } catch (err) {
                console.error("🔥 Web Push setup failed:", err);
            }
        };

        setupWebPush();
    }, [user_id]);

    return (
        <>
            <Script
                strategy="afterInteractive"
                src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
            />
            <Script
                id="google-analytics"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}', {
            page_path: window.location.pathname,
          });
        `,
                }}
            />

            <Script
                id="facebook-sdk"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
      window.fbAsyncInit = function() {
        FB.init({
          appId      : '${process.env.NEXT_PUBLIC_FB_APP_ID}', 
          cookie     : true,
          xfbml      : true,
          version    : 'v20.0' // latest stable Graph API version
        });
      };

      (function(d, s, id){
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) {return;}
        js = d.createElement(s); js.id = id;
        js.src = "https://connect.facebook.net/en_US/sdk.js";
        fjs.parentNode.insertBefore(js, fjs);
      }(document, 'script', 'facebook-jssdk'));
    `,
                }}
            />

            <Script
                src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
                strategy="afterInteractive"
            />

            <Script id="onesignal-init" strategy="afterInteractive">
                {`
            window.OneSignalDeferred = window.OneSignalDeferred || [];
            OneSignalDeferred.push(async function(OneSignal) {
              await OneSignal.init({
                appId: "c769cbc6-d65e-4ad4-b981-04f58acc2cf7",
                safari_web_id: "web.onesignal.auto.10e68f2c-7ec7-4c79-8552-0b1b9ea0a897",
                notifyButton: {
                  enable: true,
                },
              });
            });
          `}
            </Script>


            {/*<Script src='https://cdn.jotfor.ms/agent/embedjs/019b0280f4fb7d588c91faf90b838470de4b/embed.js'>*/}
            {/*</Script>*/}




            {/* ✅ Facebook SDK root */}
            <div id="fb-root"></div>


            <Navbar />
            {children}


        </>
    );
}
