"use client";

import { Suspense } from "react";
import useAuthStore from "@/zustand/authStore";
import MyApplications from "@/components/tenant/myApplication/MyApplications";
import { useEffect } from "react";

function TenantMyApplicationsContent() {
  const { fetchSession, user, admin } = useAuthStore();
  const tenantId = user?.tenant_id;

  useEffect(() => {
    if (!user && !admin) {
      fetchSession();
    }
  }, [user, admin, fetchSession]);

  if (!tenantId) return <p>No tenant information available.</p>;

  return <MyApplications tenantId={tenantId} />;
}

export default function TenantMyApplicationsPage() {
  return (
    <Suspense fallback={<div>Loading My Applications...</div>}>
      <TenantMyApplicationsContent />
    </Suspense>
  );
}
