"use client";

import { Suspense } from "react";
import LoadingScreen from "@/components/loadingScreen";
import DesktopRegisterForm from "@/components/authentication/DesktopRegisterForm";
import MobileRegisterForm from "@/components/authentication/MobileRegisterForm";
import Image from "next/image";

export default function RegisterPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading registration..." />}>
      <div className="relative min-h-screen overflow-hidden">
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
        <div className="relative z-10 flex flex-col min-h-screen">
          <main className="flex-1 flex flex-col lg:flex-row items-center justify-center px-4 sm:px-8 py-10 gap-10 lg:gap-20">
            {/* Hero - Desktop */}
            <div className="hidden lg:block max-w-lg text-center lg:text-left space-y-4">
              <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
                Property Management Made Simple
              </h1>
              <p className="text-lg text-gray-100">
                Create your account and experience seamless property management
                with automated billing and smart tenant tools.
              </p>
            </div>

            {/* Form */}
            <div className="w-full max-w-md">
              {/* Desktop Form */}
              <div className="hidden lg:block">
                <DesktopRegisterForm />
              </div>

              {/* Mobile Form */}
              <div className="lg:hidden">
                <MobileRegisterForm />
              </div>
            </div>
          </main>
        </div>
      </div>
    </Suspense>
  );
}
