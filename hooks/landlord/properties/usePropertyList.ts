import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

interface UsePropertyCardProps {
    property: {
        property_id: string;
        property_name: string;
        city: string;
        province: string;
        property_type: string;
        property_subtype?: string;
        total_units: number;
        occupied_units: number;
        total_income: number;
        photos: { photo_id: number; photo_url: string | null }[];
    };
    onMutate: () => void;
}

export const getOccupancyColor = (rate: number) => {
    if (rate >= 80) return "from-emerald-500 to-emerald-400";
    if (rate >= 50) return "from-amber-500 to-amber-400";
    if (rate > 0) return "from-red-500 to-red-400";
    return "from-gray-400 to-gray-300";
};

export function usePropertyCard({ property, onMutate }: UsePropertyCardProps) {
    const router = useRouter();

    const totalUnits = property.total_units || 0;
    const occupiedUnits = property.occupied_units || 0;
    const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

    const handleView = () => {
        router.push(`/landlord/properties/${property.property_id}`);
    };

    const handleEdit = () => {
        router.push(`/landlord/properties/${property.property_id}/editPropertyDetails`);
    };

    const handleDelete = async () => {
        const confirm = await Swal.fire({
            title: "Delete Property?",
            html: `Are you sure you want to delete <strong>${property.property_name}</strong>?<br/><span class="text-red-500 text-sm">This action cannot be undone.</span>`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Yes, Delete",
            cancelButtonText: "Cancel",
        });

        if (!confirm.isConfirmed) return;

        Swal.fire({
            title: "Deleting...",
            html: "Please wait while we delete the property.",
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
        });

        try {
            const res = await fetch(
                `/api/propertyListing/deletePropertyListing/${property.property_id}`,
                { method: "DELETE" }
            );

            const result = await res.json();

            if (res.ok) {
                await Swal.fire({
                    icon: "success",
                    title: "Property Deleted",
                    text: result.message,
                    confirmButtonColor: "#10B981",
                });
                onMutate();
            } else {
                await Swal.fire({
                    icon: "error",
                    title: "Unable to Delete",
                    text: result.error || "Something went wrong.",
                    confirmButtonColor: "#d33",
                });
            }
        } catch {
            await Swal.fire({
                icon: "error",
                title: "Error",
                text: "Failed to delete property. Please try again.",
                confirmButtonColor: "#d33",
            });
        }
    };

    return {
        totalUnits,
        occupiedUnits,
        occupancyRate,
        handleView,
        handleEdit,
        handleDelete,
    };
}
