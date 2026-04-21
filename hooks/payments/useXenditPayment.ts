"use client";

import Swal from "sweetalert2";
import axios from "axios";
import { useState } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/zustand/authStore";

interface XenditRedirectUrls {
    success: string;
    failure: string;
    cancel: string;
}

interface UseXenditPaymentParams {
    billing_id: string;
    amount: number | string;
    agreement_id?: string;
    payment_method_id?: number;
    redirectUrl?: XenditRedirectUrls;
}

interface UseSubscriptionPaymentParams {
    amount: number | string;
    description: string;
    plan_name: string;
    plan_code: string;
    redirectUrl?: XenditRedirectUrls;
}

export function useXenditPayment() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [loadingPayment, setLoadingPayment] = useState(false);

    const payWithXendit = async ({
                                     billing_id,
                                     amount,
                                     payment_method_id = 7,
                                     redirectUrl,
                                 }: UseXenditPaymentParams) => {
        const confirm = await Swal.fire({
            title: "Pay Billing Now?",
            text: "You will be redirected to Xendit's secure checkout page.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Proceed",
        });

        if (!confirm.isConfirmed) return;

        setLoadingPayment(true);

        try {
            const formattedAmount = Number(amount);

            const res = await axios.post("/api/tenant/billing/payment", {
                amount: formattedAmount,
                billing_id,
                tenant_id: user?.tenant_id,

                firstName: user?.firstName ?? null,
                lastName: user?.lastName ?? null,
                emailAddress: user?.email ?? null,
                phoneNumber: user?.phoneNumber ?? null,

                payment_method_id,
                redirectUrl: redirectUrl ?? {
                    success: `${process.env.NEXT_PUBLIC_BASE_URL}/pages/payment/billSuccess`,
                    failure: `${process.env.NEXT_PUBLIC_BASE_URL}/pages/payment/billFailed`,
                    cancel: `${process.env.NEXT_PUBLIC_BASE_URL}/pages/payment/billCancelled`,
                },
            });

            if (res.data?.checkoutUrl) {
                window.location.href = res.data.checkoutUrl;
            } else {
                Swal.fire("Error", "No checkout URL returned.", "error");
            }
        } catch (err) {
            console.error("Xendit payment error:", err);
            Swal.fire("Error", "Failed to initiate payment.", "error");
        } finally {
            setLoadingPayment(false);
        }
    };

    const paySubscriptionWithXendit = async ({
                                                 amount,
                                                 description,
                                                 plan_name,
                                                 plan_code,
                                                 redirectUrl,
                                             }: UseSubscriptionPaymentParams) => {
        if (!user?.landlord_id) {
            Swal.fire("Error", "Please log in first.", "error");
            return;
        }

        setLoadingPayment(true);

        try {
            const formattedAmount = Number(amount);

            const res = await axios.post("/api/payment/checkout-payment", {
                amount: formattedAmount,
                description,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                landlord_id: user.landlord_id,
                plan_name,
                plan_code,
                redirectUrl: redirectUrl ?? {
                    success: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/subscriptionSuccess`,
                    failure: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/failure`,
                    cancel: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/cancelled`,
                },
            });

            if (res.status === 201) {
                Swal.fire({
                    title: "Free Trial Activated!",
                    text: `Your trial ends on ${res.data.trialEndDate}`,
                    icon: "success",
                }).then(() => {
                    router.push("/landlord/dashboard");
                });
                return;
            }

            if (res.data?.checkoutUrl) {
                window.location.href = res.data.checkoutUrl;
            } else {
                Swal.fire("Error", "No checkout URL returned.", "error");
            }
        } catch (err: unknown) {
            console.error("Subscription payment error:", err);
            if (axios.isAxiosError(err) && err.response?.data?.error) {
                Swal.fire("Error", err.response.data.error, "error");
            } else {
                Swal.fire("Error", "Failed to initiate payment.", "error");
            }
        } finally {
            setLoadingPayment(false);
        }
    };

    return {
        payWithXendit,
        paySubscriptionWithXendit,
        loadingPayment,
    };
}