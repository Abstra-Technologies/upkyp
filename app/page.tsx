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
const PhilippineMarketSection = lazy(() => import("@/components/landing/MarketSection"));
const Page_footer = lazy(() => import("@/components/navigation/page_footer"));

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

      <PainPointsSection />

      <Suspense fallback={<SectionSkeleton />}>
        <AnimatedFeatures />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <FeaturesShowcase />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <PhilippineMarketSection />
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
