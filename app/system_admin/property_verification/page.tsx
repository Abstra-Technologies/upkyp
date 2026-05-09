"use client";
import React from "react";
import { useRouter } from "next/navigation";
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Chip
} from "@mui/material";
import { useEffect, useState } from "react";
import LoadingScreen from "@/components/loadingScreen";
import { FileCheck, Clock, XCircle, Building2 } from "lucide-react";

interface PropertyVerification {
    verification_id: number;
    property_id: string;
    doc_type: string;
    tin_number: string | null;
    status: string;
    reviewed_by: string | null;
    created_at: string;
    updated_at: string;
    attempts: number;
}

export default function PropertyVerificationList() {
    const [verifications, setVerifications] = useState<PropertyVerification[]>([]);
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVerifications = async () => {
            try {
                setLoading(true);
                const response = await fetch("/api/systemadmin/property-verifications");
                const data = await response.json();
                setVerifications(data);
            } catch (error) {
                console.error("Error fetching property verifications:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchVerifications();
    }, []);

    const getStatusChip = (status: string) => {
        const styles: Record<string, { color: "warning" | "success" | "error"; icon: React.ReactElement }> = {
            Pending: { color: "warning", icon: <Clock size={16} /> },
            Verified: { color: "success", icon: <FileCheck size={16} /> },
            Rejected: { color: "error", icon: <XCircle size={16} /> }
        };
        const style = styles[status] || styles.Pending;
        return (
            <Chip
                icon={style.icon}
                label={status}
                color={style.color}
                size="small"
                variant="outlined"
            />
        );
    };

    const getDocTypeLabel = (docType: string) => {
        const labels: Record<string, string> = {
            business_permit: "Business Permit",
            occupancy_permit: "Occupancy Permit",
            property_title: "Property Title"
        };
        return labels[docType] || docType;
    };

    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <div className="flex">
            <div className="flex-1 p-6 max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-blue-600 flex items-center gap-2">
                        <Building2 size={28} />
                        Property Verification
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Review and manage property document verifications
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <TableContainer component={Paper}>
                        <Table className="min-w-full">
                            <TableHead className="bg-gray-50">
                                <TableRow>
                                    <TableCell className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Property ID</TableCell>
                                    <TableCell className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Document Type</TableCell>
                                    <TableCell className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">TIN Number</TableCell>
                                    <TableCell className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</TableCell>
                                    <TableCell className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Submitted</TableCell>
                                    <TableCell className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Reviewed By</TableCell>
                                    <TableCell className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {verifications.length > 0 ? (
                                    verifications.map((item) => (
                                        <TableRow key={item.verification_id} className="hover:bg-gray-50">
                                            <TableCell className="px-6 py-4 font-mono text-sm">
                                                {item.property_id}
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                {getDocTypeLabel(item.doc_type)}
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                {item.tin_number || "N/A"}
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                {getStatusChip(item.status)}
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-sm text-gray-600">
                                                {new Date(item.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="px-6 py-4 text-sm text-gray-600">
                                                {item.reviewed_by || "Not yet reviewed"}
                                            </TableCell>
                                            <TableCell className="px-6 py-4">
                                                <button
                                                    onClick={() =>
                                                        router.push(`/system_admin/property_verification/${item.property_id}`)
                                                    }
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm font-medium"
                                                >
                                                    Review
                                                </button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">
                                            <div className="flex flex-col items-center gap-2">
                                                <FileCheck size={48} className="text-gray-300" />
                                                <p>No property verifications found</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </div>
            </div>
        </div>
    );
}
