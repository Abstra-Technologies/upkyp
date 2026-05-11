"use client";

import { useState, useEffect, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import LoadingScreen from "@/components/loadingScreen";
import HeroSection from "@/components/landing/HeroSection";
import PainPointsSection from "@/components/landing/PainPointsSection";
import "@/app/styles/landing-animations.css";

const AnimatedFeatures = lazy(() => import("@/components/ui/Process"));
const FeaturesShowcase = lazy(() => import("@/components/landing/FeaturesShowcase"));
const CTASection = lazy(() => import("@/components/landing/CTASection"));
const Page_footer = lazy(() => import("../components/navigation/page_footer"));

function SectionSkeleton() {
  return (
    <div className="w-full h-64 bg-gray-50 animate-pulse">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    </div>
  );
}

export default function SplashScreen() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    async function redirectIfAuthenticated() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          const routes = {
            tenant: "/tenant/my-unit",
            landlord: "/landlord/dashboard",
            admin: "/admin/dashboard",
          };
          router.replace(
            routes[data.userType as keyof typeof routes] || "/auth/login"
          );
          return;
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      }
      setCheckingAuth(false);
    }
    redirectIfAuthenticated();
  }, [router]);

  if (checkingAuth) return <LoadingScreen />;

  return (
    <div className="flex flex-col min-h-screen bg-white overflow-hidden">

      <HeroSection />

      {/* Narrative Divider */}
      <div className="relative py-8 sm:py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 justify-center">
            <div className="h-px flex-1 max-w-32 bg-gradient-to-r from-transparent to-gray-200" />
            <div className="flex gap-2">
              <span className="w-2 h-2 rounded-full bg-gray-300" />
              <span className="w-2 h-2 rounded-full bg-gray-300" />
              <span className="w-2 h-2 rounded-full bg-gray-300" />
            </div>
            <div className="h-px flex-1 max-w-32 bg-gradient-to-l from-transparent to-gray-200" />
          </div>
        </div>
      </div>

      <PainPointsSection />

      {/* Narrative Divider */}
      <div className="relative py-8 sm:py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 justify-center">
            <div className="h-px flex-1 max-w-32 bg-gradient-to-r from-transparent to-gray-200" />
            <div className="flex gap-2">
              <span className="w-2 h-2 rounded-full bg-gray-300" />
              <span className="w-2 h-2 rounded-full bg-gray-300" />
              <span className="w-2 h-2 rounded-full bg-gray-300" />
            </div>
            <div className="h-px flex-1 max-w-32 bg-gradient-to-l from-transparent to-gray-200" />
          </div>
        </div>
      </div>

      <Suspense fallback={<SectionSkeleton />}>
        <AnimatedFeatures />
      </Suspense>

      {/* Narrative Divider */}
      <div className="relative py-8 sm:py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 justify-center">
            <div className="h-px flex-1 max-w-32 bg-gradient-to-r from-transparent to-gray-200" />
            <div className="flex gap-2">
              <span className="w-2 h-2 rounded-full bg-gray-300" />
              <span className="w-2 h-2 rounded-full bg-gray-300" />
              <span className="w-2 h-2 rounded-full bg-gray-300" />
            </div>
            <div className="h-px flex-1 max-w-32 bg-gradient-to-l from-transparent to-gray-200" />
          </div>
        </div>
      </div>

      <Suspense fallback={<SectionSkeleton />}>
        <FeaturesShowcase />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <CTASection />
      </Suspense>

      <Suspense fallback={<div className="h-64" />}>
        <Page_footer />
      </Suspense>
    </div>
  );
}
