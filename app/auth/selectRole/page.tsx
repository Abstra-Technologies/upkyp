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
        router.push("/auth/register");
        logEvent(
            "Role Selection",
            "User Interaction",
            `Selected Role: ${role}`,
            1
        );
    };

    return (
        <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-white">

            {/* Background */}
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
            <div className="relative z-10 w-full max-w-5xl px-4">

                <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">

                    {/* Header (UNCHANGED) */}
                    <div className="bg-gradient-to-r from-blue-600 to-emerald-600 px-6 py-5 text-center">
                        <h2 className="text-xl font-bold text-white">Create Account</h2>
                        <p className="text-sm text-white/80 mt-1">
                            Choose how you want to use Upkyp
                        </p>
                    </div>

                    {/* Role Options → ONE ROW SCROLL */}
                    <div className="p-4">
                        <div className="flex gap-3">

                            {/* Tenant */}
                            <button
                                onClick={() => handleSelectRole("tenant")}
                                className="group flex-1 p-4 rounded-xl border-2 border-gray-100 hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-200 text-center hover:shadow-sm"
                            >
                                <div className="flex flex-col items-center gap-2">

                                    {/* Image */}
                                    <div className="w-full h-24 flex items-center justify-center">
                                        <Image
                                            src="https://res.cloudinary.com/dptmeluy0/image/upload/v1776310728/1_ybgjtw.png"
                                            alt="Tenant"
                                            width={100}
                                            height={100}
                                            className="h-full w-auto object-contain"
                                        />
                                    </div>

                                    {/* Text */}
                                    <div>
                                        <h3 className="font-semibold text-gray-900 text-sm">Tenant</h3>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Find your place
                                        </p>
                                    </div>

                                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-all" />
                                </div>
                            </button>

                            {/* Landlord */}
                            <button
                                onClick={() => handleSelectRole("landlord")}
                                className="group flex-1 p-4 rounded-xl border-2 border-gray-100 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all duration-200 text-center hover:shadow-sm"
                            >
                                <div className="flex flex-col items-center gap-2">

                                    {/* Image */}
                                    <div className="w-full h-24 flex items-center justify-center">
                                        <Image
                                            src="https://res.cloudinary.com/dptmeluy0/image/upload/v1776310728/2_jzoxbr.png"
                                            alt="Landlord"
                                            width={100}
                                            height={100}
                                            className="h-full w-auto object-contain"
                                        />
                                    </div>

                                    {/* Text */}
                                    <div>
                                        <h3 className="font-semibold text-gray-900 text-sm">
                                            Landlord/ Property Owner
                                        </h3>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Manage rental units and tenants
                                        </p>
                                    </div>

                                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 transition-all" />
                                </div>
                            </button>

                        </div>
                    </div>
                    {/* Divider */}
                    <div className="px-6 pb-4">
                        <div className="relative flex py-2 items-center">
                            <div className="flex-grow border-t border-gray-200"></div>
                            <span className="mx-4 text-xs text-gray-400">or</span>
                            <div className="flex-grow border-t border-gray-200"></div>
                        </div>
                    </div>

                    {/* Sign In (UNCHANGED) */}
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
            </div>
        </div>
    );


}
