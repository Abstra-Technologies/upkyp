"use client";

import { Suspense, useEffect } from "react";
import LoadingScreen from "@/components/loadingScreen";
import LoginForm from "@/components/authentication/loginForm";
import MobileLoginForm from "@/components/authentication/mobileLoginForm";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import useAuthStore from "@/zustand/authStore";
import Image from "next/image";

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
        if (!user || user.loading) return;
        
        const isLoggedIn = user.landlord_id || user.tenant_id;
        if (isLoggedIn) {
            if (callbackUrl) {
                router.push(callbackUrl);
            } else if (user.userType === "tenant") {
                router.push("/tenant/feeds");
            } else if (user.userType === "landlord") {
                router.push("/landlord/dashboard");
            } else {
                router.push("/landlord/dashboard");
            }
        }
    }, [user, router, callbackUrl]);

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden">

            {/* Background */}
            <Image
                src="https://res.cloudinary.com/dpukdla69/image/upload/v1765966152/Whisk_mtnhzwyxajzmdtyw0yn2mtotijzhrtllbjzh1sn_wpw850.jpg"
                alt="City background"
                fill
                priority
                className="absolute inset-0 object-cover"
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

            {/* Main Content */}
            <div className="relative z-10 w-full flex items-center justify-center p-4">
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