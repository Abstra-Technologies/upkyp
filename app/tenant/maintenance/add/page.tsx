import { Suspense } from "react";
import MaintenanceRequestForm from "@/components/maintenance/maintenanceRequestForm";

export default function AddMaintenancePage() {
  return (
      <Suspense fallback={<div>Loading form...</div>}>
        <MaintenanceRequestForm />
      </Suspense>
  );
}
