"use client";

import useRoleStore from "@/zustand/store";
import { logEvent } from "@/utils/gtag";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Building2, User, ArrowRight } from "lucide-react";

export default function RegisterAs() {
    const setRole = useRoleStore((state) => state.setRole);
    const router = useRouter();

    const handleSelectRole = (role: string) => {
        setRole(role);
        router.push("/pages/auth/register");
        logEvent(
            "Role Selection",
            "User Interaction",
            `Selected Role: ${role}`,
            1
        );
    };

    return (
        <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-white">
            {/* Background Image */}
            <Image
                src="https://res.cloudinary.com/dpukdla69/image/upload/v1765966152/Whisk_mtnhzwyxajzmdtyw0yn2mtotijzhrtllbjzh1sn_wpw850.jpg"
                alt="City background"
                fill
                priority
                className="absolute inset-0 object-cover"
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm" />

            {/* Main Card */}
            <div className="relative z-10 w-full max-w-sm mx-4">
                {/* Logo Section */}
                <div className="text-center mb-8">

                    <h1
                        className="text-3xl font-extrabold text-gray-900"
                        style={{
                            background: "linear-gradient(90deg, #2563EB, #10B981)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                        }}
                    >
                        Upkyp
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">Connect more. Manage less.</p>
                </div>

                {/* Role Selection Card */}
                <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-emerald-600 px-6 py-5 text-center">
                        <h2 className="text-xl font-bold text-white">Create Account</h2>
                        <p className="text-sm text-white/80 mt-1">Choose how you want to use Upkyp</p>
                    </div>

                    {/* Role Options */}
                    <div className="p-6 space-y-4">
                        {/* Tenant */}
                        <button
                            onClick={() => handleSelectRole("tenant")}
                            className="group w-full p-5 rounded-2xl border-2 border-gray-100 hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-200 text-left"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-blue-500 transition-colors">
                                    <User className="w-7 h-7 text-blue-600 group-hover:text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-900">Tenant</h3>
                                    <p className="text-sm text-gray-500">Find and rent your perfect place</p>
                                </div>
                                <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                            </div>
                        </button>

                        {/* Landlord */}
                        <button
                            onClick={() => handleSelectRole("landlord")}
                            className="group w-full p-5 rounded-2xl border-2 border-gray-100 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all duration-200 text-left"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-emerald-500 transition-colors">
                                    <Building2 className="w-7 h-7 text-emerald-600 group-hover:text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-900">Landlord</h3>
                                    <p className="text-sm text-gray-500">Manage properties and tenants</p>
                                </div>
                                <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                            </div>
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="px-6 pb-4">
                        <div className="relative flex py-2 items-center">
                            <div className="flex-grow border-t border-gray-200"></div>
                            <span className="flex-shrink mx-4 text-xs text-gray-400">or</span>
                            <div className="flex-grow border-t border-gray-200"></div>
                        </div>
                    </div>

                    {/* Login Link */}
                    <div className="px-6 pb-6 text-center">
                        <p className="text-sm text-gray-600">
                            Already have an account?{" "}
                            <button
                                onClick={() => router.push("/pages/auth/login")}
                                className="font-semibold text-blue-600 hover:text-blue-700"
                            >
                                Sign in
                            </button>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-gray-500 mt-6">
                    By continuing, you agree to our Terms of Service
                </p>
            </div>
        </div>
    );
}
