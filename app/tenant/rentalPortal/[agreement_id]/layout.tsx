"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";

export default function TenantPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const agreement_id = params?.agreement_id as string | undefined;

  // Store agreement ID when on portal pages
  useEffect(() => {
    if (agreement_id) {
      localStorage.setItem("portalAgreementId", agreement_id);
    }
  }, [agreement_id]);

  if (!agreement_id) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-pulse space-y-3 text-center">
          <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
          <div className="h-3 bg-gray-200 rounded w-24 mx-auto"></div>
        </div>
      </div>
    );
  }

  // TenantLayout handles all the UI (sidebar, bottom nav, etc.)
  return <>{children}</>;
}
