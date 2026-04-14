"use client";

import { useState } from "react";
import VerificationLayout from "./VerificationLayout";
import StepID from "@/components/landlord/verifiication/StepID";
import StepSelfie from "@/components/landlord/verifiication/StepSelfie";
import VerificationSuccess from "@/components/landlord/verifiication/VerificationSuccess";

export default function LandlordVerificationPage() {
  const [step, setStep] = useState(1);
  const [idImage, setIdImage] = useState<File | null>(null);
  const [selfieImage, setSelfieImage] = useState<File | null>(null);
  const [idType, setIdType] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleSubmit = async () => {
    if (!idImage || !selfieImage) return;

    setIsSubmitting(true);

    try {
      const formData = new FormData();

      // API expects 'documentType' not 'idType'
      formData.append("documentType", idType);

      // API expects 'uploadedFile' for the ID image
      formData.append("uploadedFile", idImage);

      // API expects 'selfie' as base64 string
      // Convert selfieImage (File) to base64
      const selfieBase64 = await fileToBase64(selfieImage);
      formData.append("selfie", selfieBase64);

      // Add name fields (you may need to update your API to handle these)
      formData.append("firstName", firstName);
      formData.append("lastName", lastName);

      const res = await fetch("/api/landlord/verification-upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setIsComplete(true);
      } else {
        // Handle specific error codes
        if (data.code === "VERIFICATION_EXISTS") {
          alert("You already have a verification pending or approved.");
        } else {
          alert(
            data.error || "Failed to submit verification. Please try again.",
          );
        }
      }
    } catch (error) {
      console.error("Verification submission failed:", error);
      alert("Failed to submit verification. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to convert File to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const canProceed =
    (step === 1 &&
      !!idImage &&
      !!idType &&
      !!firstName.trim() &&
      !!lastName.trim()) ||
    (step === 2 && !!selfieImage);

  const handleNext = () => {
    if (step === 2) {
      handleSubmit();
    } else {
      setStep((s) => Math.min(2, s + 1));
    }
  };

  const handleBack = () => {
    setStep((s) => Math.max(1, s - 1));
  };

  if (isComplete) {
    return <VerificationSuccess />;
  }

  return (
    <VerificationLayout
      currentStep={step}
      totalSteps={2}
      onBack={handleBack}
      onNext={handleNext}
      canProceed={canProceed}
      isSubmitting={isSubmitting}
    >
      <div className="verification-content">
        {step === 1 && (
          <StepID
            value={idImage}
            idType={idType}
            firstName={firstName}
            lastName={lastName}
            onChange={setIdImage}
            onIdTypeChange={setIdType}
            onFirstNameChange={setFirstName}
            onLastNameChange={setLastName}
          />
        )}

        {step === 2 && (
          <StepSelfie value={selfieImage} onChange={setSelfieImage} />
        )}
      </div>
    </VerificationLayout>
  );
}
