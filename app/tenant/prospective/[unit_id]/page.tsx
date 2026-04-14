"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Swal from "sweetalert2";
import {
    Box,
    Button,
    Stepper,
    Step,
    StepLabel,
    Typography,
    useMediaQuery,
    useTheme,
} from "@mui/material";

import LoadingScreen from "@/components/loadingScreen";
import useAuthStore from "@/zustand/authStore";
import StepEmploymentInfo from "@/components/tenant/myApplication/applicationForm/steps/StepEmploymentInfo";
import StepDocuments from "@/components/tenant/myApplication/applicationForm/steps/StepDocuments";
import StepBasicInfo from "@/components/tenant/myApplication/applicationForm/steps/StepBasicInfo";
import {validateBasicInfo} from "@/components/tenant/myApplication/applicationForm/hooks/useApplicationValidation";
import AlreadyAppliedCard from "@/components/tenant/myApplication/applicationForm/AlreadyAppliedCard";
import {useTenantApplication} from "@/components/tenant/myApplication/applicationForm/hooks/useTenantApplication";


const steps = ["Basic Info", "Employment Info", "Documentary Requirements"];

export default function TenantApplicationForm() {
    const { unit_id } = useParams();
    const router = useRouter();
    const { user } = useAuthStore();

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    const app = useTenantApplication(unit_id as string);

    /* ================= Guards ================= */
    if (!user || app.loading) {
        return <LoadingScreen message="Preparing your form..." />;
    }

    if (app.hasApplied) {
        return <AlreadyAppliedCard />;
    }

    /* ================= Navigation ================= */
    const handleNext = () => {
        if (app.activeStep === 0 && !validateBasicInfo(app.formData)) return;
        app.setActiveStep((s) => s + 1);
    };

    const handleBack = () => {
        app.setActiveStep((s) => s - 1);
    };

    /* ================= Submit ================= */
    const handleSubmit = async () => {
        if (!app.validIdFile) {
            return Swal.fire("Error", "Please upload a valid ID.", "error");
        }

        const confirm = await Swal.fire({
            title: "Confirm submission?",
            text: "Do you want to submit your application?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Submit",
        });

        if (!confirm.isConfirmed) return;

        try {
            app.setIsSubmitting(true);
            Swal.fire({
                title: "Submitting...",
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading(),
            });

            const fd = new FormData();
            fd.append("user_id", user?.user_id);
            fd.append("tenant_id", user?.tenant_id);
            fd.append("unit_id", app.formData.unit_id);
            fd.append("address", app.formData.address);
            fd.append("occupation", app.formData.occupation);
            fd.append("employment_type", app.formData.employment_type);
            fd.append("monthly_income", app.formData.monthly_income);
            fd.append("birthDate", app.formData.birthDate);
            fd.append("phoneNumber", app.formData.phoneNumber);

            if (app.validIdFile) fd.append("valid_id", app.validIdFile);
            if (app.incomeFile) fd.append("income_proof", app.incomeFile);

            await axios.post("/api/tenant/applications/submitApplication", fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            Swal.close();
            await Swal.fire({
                icon: "success",
                title: "Application submitted!",
                timer: 2000,
                showConfirmButton: false,
            });

            router.push("/pages/tenant/prospective/success");
        } catch (err: any) {
            Swal.close();
            Swal.fire("Error", err.message || "Submission failed.", "error");
        } finally {
            app.setIsSubmitting(false);
        }
    };

    /* ================= Render ================= */
    return (
        <Box
            maxWidth={{ xs: "100%", sm: "600px", md: "700px" }}
            mx="auto"
            py={{ xs: 2, sm: 6 }}
            px={{ xs: 2, sm: 4 }}
            pb={{ xs: 20, sm: 6 }}
            minHeight="100vh"
            display="flex"
            flexDirection="column"
        >
            {/* Title */}
            <Typography
                variant={isMobile ? "h6" : "h4"}
                align="center"
                fontWeight={700}
                gutterBottom
            >
                {app.propertyDetails
                    ? `${app.propertyDetails.property_name} – Unit ${app.propertyDetails.unit_name} Tenant Application`
                    : "Tenant Application Form"}
            </Typography>

            {/* Stepper */}
            <Stepper
                activeStep={app.activeStep}
                alternativeLabel={!isMobile}
                orientation={isMobile ? "vertical" : "horizontal"}
                sx={{ mb: { xs: 2, sm: 4 } }}
            >
                {steps.map((label) => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            {/* Step Content */}
            <Box flexGrow={1}>
                {app.activeStep === 0 && (
                    <StepBasicInfo
                        formData={app.formData}
                        setFormData={app.setFormData}
                        isMobile={isMobile}
                    />
                )}

                {app.activeStep === 1 && (
                    <StepEmploymentInfo
                        formData={app.formData}
                        setFormData={app.setFormData}
                        isMobile={isMobile}
                    />
                )}

                {app.activeStep === 2 && (
                    <StepDocuments
                        validIdFile={app.validIdFile}
                        incomeFile={app.incomeFile}
                        validIdRef={app.validIdRef}
                        incomeRef={app.incomeRef}
                        onFile={app.handleFile}
                    />
                )}
            </Box>

            {/* Actions */}
            <Box
                position={{ xs: "fixed", sm: "static" }}
                bottom={0}
                left={0}
                right={0}
                bgcolor={{ xs: "background.paper", sm: "transparent" }}
                p={2}
                boxShadow={{ xs: "0 -2px 10px rgba(0,0,0,0.1)", sm: "none" }}
            >
                <Box display="flex" gap={2}>
                    {app.activeStep > 0 && (
                        <Button variant="outlined" fullWidth onClick={handleBack}>
                            Back
                        </Button>
                    )}

                    {app.activeStep < steps.length - 1 ? (
                        <Button variant="contained" fullWidth onClick={handleNext}>
                            Next
                        </Button>
                    ) : (
                        <Button
                            variant="contained"
                            color="success"
                            fullWidth
                            onClick={handleSubmit}
                            disabled={app.isSubmitting}
                        >
                            {app.isSubmitting ? "Submitting..." : "Submit Application"}
                        </Button>
                    )}
                </Box>
            </Box>
        </Box>
    );
}
