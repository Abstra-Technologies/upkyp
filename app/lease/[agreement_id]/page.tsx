
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
    Box,
    Typography,
    Divider,
    Tabs,
    Tab,
} from "@mui/material";
import { BackButton } from "@/components/navigation/backButton";
import LoadingScreen from "@/components/loadingScreen";

import LeaseInfo from "@/components/landlord/activeLease/leaseInfo";
import LeasePayments from "@/components/landlord/activeLease/leasePayments";
// import LeaseBilling from "./LeaseBilling";
// import LeasePayments from "./LeasePayments";
// import LeaseRequests from "./LeaseRequests";
import LeasePDCs from "@/components/landlord/activeLease/LeasePDCs";

interface BillingDetail {
    billing_id: number;
    billing_period: string;
    total_amount_due: number;
    status: string;
    due_date: string;
}

// LeaseDetailsPage.tsx (or wherever the interface is defined)
interface LeaseDetails {
    lease_id: number;
    property_name: string;
    unit_name: string;
    tenant_name: string;
    start_date: string;
    end_date: string;
    lease_status: "pending" | "active" | "expired" | "cancelled";
    agreement_url?: string;
    security_deposit_amount?: number;
    advance_payment_amount?: number;
    grace_period_days?: number;
    late_penalty_amount?: number;
    billing_due_day?: number;
    rent_amount?: number;
    email?: string; // Added
    phoneNumber?: string; // Added
    pdcs?: {
        pdc_id: number;
        check_number: string;
        bank_name: string;
        amount: number;
        due_date: string;
        uploaded_image_url:string;
        status: "pending" | "cleared" | "bounced" | "replaced";
    }[];
    payments?: {
        payment_id: number;
        amount: number;
        method: string;
        paid_on: string;
        status: string;
    }[];
    billing?: BillingDetail[];
}


export default function LeaseDetailsPage() {
    const { agreement_id } = useParams();
    const [lease, setLease] = useState<LeaseDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState(0);

    useEffect(() => {
        if (!agreement_id) return;

        const fetchLeaseDetails = async () => {
            try {
                const res = await fetch(
                    `/api/leaseAgreement/getDetailedLeaseInfo/${agreement_id}`
                );
                const data = await res.json();
                console.log('lease info:', data);
                setLease(data);
            } catch (err) {
                console.error("Error fetching lease details:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaseDetails();
    }, [agreement_id]);

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/0 w-full">
                 <LoadingScreen message='Just a moment, getting things ready...' />;
            </div>
        );
    }

    if (!lease) {
        return (
            <Box className="fixed inset-0 flex items-center justify-center p-4 bg-gray-100">
                <Box className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg text-center space-y-4">
                    <Typography variant="h6" className="font-semibold text-red-600">
                        Lease Not Found
                    </Typography>
                    <Typography variant="body1" className="text-gray-600">
                        The lease agreement you're looking for could not be found. Please check the agreement ID or try again later.
                    </Typography>
                    <BackButton label="Return to Dashboard" />
                </Box>
            </Box>
        );
    }

    return (
        <Box className="p-6 space-y-6">
            {/* Title */}
            <BackButton label="Go Back" />

            <div className="space-y-2">
                <h4 className='gradient-header'>
                     {lease.property_name} - {lease.unit_name}
                </h4>
                <Typography variant="subtitle1" color="text.secondary" className="text-sm md:text-base">
                    Manage and review this lease agreement.
                    All details displayed are based on the current lease agreement document. Any modifications require notifying the tenant.
                </Typography>
            </div>

            <Divider />

            {/* Tabs */}
            <Tabs
                value={tab}
                onChange={(_, newValue) => setTab(newValue)}
                textColor="primary"
                indicatorColor="primary"
            >
                <Tab label="Info" />
                <Tab label="Billing Statements" />
                <Tab label="Payments" />
                <Tab label="PDCs" />
            </Tabs>

            {/* Tab Contents */}
            {tab === 0 && <LeaseInfo lease={lease} />}
            {tab === 2 && <LeasePayments lease={lease} />}
            {tab === 3 && <LeasePDCs lease={lease} />}

        </Box>
    );
}