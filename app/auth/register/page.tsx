"use client";

import { Suspense } from "react";
import LoadingScreen from "@/components/loadingScreen";
import DesktopRegisterForm from "@/components/authentication/DesktopRegisterForm";
import MobileRegisterForm from "@/components/authentication/MobileRegisterForm";
import AuthBackground from "@/components/authentication/AuthBackground";

export default function RegisterPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading registration..." />}>
      <AuthBackground>
        <div className="flex flex-col min-h-screen">
          {/* Main - Centered */}
          <main className="flex-1 flex flex-col lg:flex-row items-center justify-center px-4 sm:px-8 py-10 gap-10 lg:gap-20">
            {/* Hero - Desktop */}
            <div className="hidden lg:block max-w-lg text-center lg:text-left space-y-4">
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
                Property Management Made Simple
              </h1>
              <p className="text-lg text-gray-600">
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
      </AuthBackground>
    </Suspense>
  );
}
