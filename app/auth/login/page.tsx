"use client";

import { Suspense, useEffect } from "react";
import LoadingScreen from "@/components/loadingScreen";
import LoginForm from "@/components/authentication/loginForm";
import MobileLoginForm from "@/components/authentication/mobileLoginForm";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import useAuthStore from "@/zustand/authStore";

export default function LoginPage() {
    return (
        <Suspense fallback={<LoadingScreen message="Loading authentication..." />}>
            <Login />
        </Suspense>
    );
}

function Login() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl");
    const { user, fetchSession } = useAuthStore();

    useEffect(() => {
        fetchSession();
    }, []);

    useEffect(() => {
        if (user?.landlord_id) {
            // Priority: 1. callbackUrl from query param, 2. redirectAfterLogin from localStorage
            const redirectUrl = callbackUrl || localStorage.getItem("redirectAfterLogin");
            if (redirectUrl) {
                localStorage.removeItem("redirectAfterLogin");
                router.push(redirectUrl);
            }
        }
    }, [user, router, callbackUrl]);

    return (
        <div
            className="fixed inset-0 overflow-hidden"
            style={{
                backgroundImage:
                    "url('https://res.cloudinary.com/dptmeluy0/image/upload/v1767326297/f2aa6c44-eb73-41ea-9d68-5c11237a7cd5_uwielr.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
            }}
        >
            <div className="absolute inset-0 bg-black/30" />

            <div className="relative z-10 h-full w-full flex items-center justify-center p-4">
                <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-16 max-w-full">
                    {/* Hero Text */}
                    <div className="hidden lg:block max-w-md text-center flex-shrink-0">
                        <h1
                            className="text-3xl lg:text-4xl font-extrabold leading-tight text-white"
                            style={{
                                textShadow:
                                    "0 2px 4px rgba(0,0,0,0.35), 0 10px 28px rgba(0,0,0,0.25)",
                            }}
                        >
                            Your Property Journey, Simplified.
                            <span
                                className="block mt-2 typographica font-extrabold"
                                style={{
                                    color: "#FFF95B",
                                    textShadow: "0 1px 4px rgba(0,0,0,0.35)",
                                }}
                            >
                                Upkyp
                            </span>
                        </h1>
                        <p
                            className="text-base text-gray-100 mt-3"
                            style={{
                                textShadow: "0 1px 3px rgba(0,0,0,0.4)",
                            }}
                        >
                            From browsing to billing, Upkyp keeps your rentals organized.
                        </p>
                    </div>

                    {/* Forms */}
                    <div className="w-full max-w-sm flex-shrink-0">
                        <div className="hidden sm:block">
                            <LoginForm callbackUrl={callbackUrl} />
                        </div>
                        <div className="sm:hidden">
                            <MobileLoginForm />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}