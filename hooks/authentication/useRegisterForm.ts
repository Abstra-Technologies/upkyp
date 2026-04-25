"use client";

import { useState, useEffect, useCallback } from "react";
import { z } from "zod";
import useRoleStore from "@/zustand/store";
import { useRouter, useSearchParams } from "next/navigation";
import { logEvent } from "@/utils/gtag";
import Swal from "sweetalert2";

/* --------------------------- Validation Schema --------------------------- */

const registerSchema = z
    .object({
        firstName: z.string().min(1, "First Name is required"),
        lastName: z.string().min(1, "Last Name is required"),
        email: z.string().email("Invalid email address"),
        password: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .refine(
                (value) =>
                    /^[\w!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]+$/.test(value),
                "Password contains invalid characters"
            ),
        confirmPassword: z.string().min(8),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

/* ------------------------------- Hook ----------------------------------- */

export const useRegisterForm = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const role = useRoleStore((state) => state.role);

    /* ------------------------- State ------------------------- */

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        role,
        timezone: "",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [error, setError] = useState("");
    const [focusedField, setFocusedField] = useState("");
    const [agreeToTerms, setAgreeToTerms] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] =
        useState(false);
    const [isRegistering, setIsRegistering] = useState(false);

    const error_2 = searchParams.get("error");

    /* ------------------------- Sync Role Only ------------------------- */

    useEffect(() => {
        setFormData((prev) => {
            if (prev.role === role) return prev;
            return { ...prev, role };
        });
    }, [role]);

    /* ------------------------- SAFE setTimezone ------------------------- */

    const setTimezone = useCallback((timezone: string) => {
        setFormData((prev) => {
            //  Prevent unnecessary update ( prevents infinite loop)
            if (prev.timezone === timezone) return prev;

            return {
                ...prev,
                timezone,
            };
        });
    }, []);

    /* ------------------------- Handlers ------------------------- */

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const { id, value } = e.target;

            setFormData((prev) => ({
                ...prev,
                [id]: value,
            }));

            if (errors[id]) {
                setErrors((prev) => ({ ...prev, [id]: "" }));
            }

            if (error) setError("");
        },
        [errors, error]
    );

    const handleCheckboxChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setAgreeToTerms(e.target.checked);
        },
        []
    );

    const handleGoogleSignup = useCallback(() => {
        logEvent(
            "Login Attempt",
            "Google Sign-Up",
            "User Clicked Google Sign-Up",
            1
        );

        window.location.href = `/api/auth/googleSignUp?userType=${role}`;
    }, [role]);

    /* --------------------------- Submit --------------------------- */

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        setError("");

        try {
            registerSchema.parse(formData);

            if (!agreeToTerms) {
                await Swal.fire({
                    icon: "error",
                    title: "Terms Not Accepted",
                    text:
                        "You must agree to the Terms of Service and Privacy Policy before registering.",
                });
                return;
            }

            setIsRegistering(true);

            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (res.ok) {
                await Swal.fire({
                    title: "Success!",
                    text: "Account successfully registered! Please verify your email.",
                    icon: "success",
                });
                window.location.href = "/auth/verify-email";
                return;
            }

            await Swal.fire({
                icon: "error",
                title: "Registration Failed!",
                text: data.error || "Please try again.",
            });
        } catch (err) {
            if (err instanceof z.ZodError) {
                // @ts-ignore
                const errorObj = err.errors.reduce(
                    (acc: { [x: string]: any; }, curr: { path: string[]; message: any; }) => {
                        acc[curr.path[0] as string] = curr.message;
                        return acc;
                    },
                    {} as Record<string, string>
                );
                setErrors(errorObj);
            } else {
                await Swal.fire({
                    icon: "error",
                    title: "Unexpected Error!",
                    text: "An unexpected error occurred. Please try again.",
                });
            }
        } finally {
            setIsRegistering(false);
        }
    };

    /* --------------------------- Return --------------------------- */

    return {
        formData,
        errors,
        error,
        error_2,
        focusedField,
        setFocusedField,
        agreeToTerms,
        handleCheckboxChange,
        showPassword,
        setShowPassword,
        showConfirmPassword,
        setShowConfirmPassword,
        isRegistering,
        handleChange,
        handleGoogleSignup,
        handleSubmit,
        setTimezone, // ✅ kept safely
    };
};