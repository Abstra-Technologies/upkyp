// hooks/usePayoutProperty.ts
import axios from "axios";
import Swal from "sweetalert2";

export function usePayoutProperty() {

    /* ======================
       GET ASSIGNED PROPERTIES
    ====================== */
    const getAssignedProperties = async (payout_id: number) => {
        try {
            const res = await axios.get(
                "/api/landlord/payout/getAssignedProperties",
                {
                    params: { payout_id },
                }
            );

            return Array.isArray(res.data) ? res.data : [];
        } catch (error) {
            console.error("Failed to fetch assigned properties:", error);
            return [];
        }
    };

    /* ======================
       ASSIGN PROPERTY
    ====================== */
    const assignProperty = async (payout_id: number, property_id: number) => {
        try {
            await axios.post("/api/landlord/payout/assignProperty", {
                payout_id,
                property_id,
            });

            Swal.fire("Assigned", "Property linked successfully", "success");
        } catch (error) {
            console.error(error);
            Swal.fire("Error", "Failed to assign property", "error");
        }
    };

    /* ======================
       DEASSIGN PROPERTY
    ====================== */
    const deassignProperty = async (payout_id: number, property_id: number) => {
        try {
            await axios.delete("/api/landlord/payout/deassignProperty", {
                data: { payout_id, property_id },
            });

            Swal.fire("Removed", "Property unlinked successfully", "success");
        } catch (error) {
            console.error(error);
            Swal.fire("Error", "Failed to remove property", "error");
        }
    };

    return {
        getAssignedProperties,
        assignProperty,
        deassignProperty,
    };
}