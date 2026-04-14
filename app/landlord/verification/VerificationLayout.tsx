"use client";

import { ReactNode } from "react";
import {
  FiShield,
  FiFileText,
  FiUser,
  FiCheck,
  FiArrowLeft,
  FiArrowRight,
  FiLoader,
} from "react-icons/fi";

interface VerificationLayoutProps {
  children: ReactNode;
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  canProceed: boolean;
  isSubmitting?: boolean;
}

const steps = [
  {
    id: 1,
    title: "Upload ID",
    description: "Government-issued ID",
    icon: FiFileText,
  },
  {
    id: 2,
    title: "Take Selfie",
    description: "Face verification",
    icon: FiUser,
  },
];

export default function VerificationLayout({
  children,
  currentStep,
  totalSteps,
  onBack,
  onNext,
  canProceed,
  isSubmitting = false,
}: VerificationLayoutProps) {
  return (
    <div className="w-full min-h-[calc(100vh-56px)] lg:min-h-screen py-6 sm:py-8 lg:py-10 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 max-w-3xl mx-auto">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-600 to-emerald-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <FiShield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
              Landlord Verification
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              Secure identity verification
            </p>
          </div>
        </div>
      </header>

      {/* Step Indicator */}
      <div className="mb-6 sm:mb-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-4 sm:gap-6 lg:gap-8">
            {steps.map((step, index) => {
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              const Icon = step.icon;

              return (
                <div key={step.id} className="flex items-center">
                  {/* Step circle */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`
                                            relative w-14 h-14 sm:w-16 sm:h-16 lg:w-18 lg:h-18 rounded-2xl flex items-center justify-center
                                            transition-all duration-300 ease-out
                                            ${
                                              isCompleted
                                                ? "bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/30"
                                                : isActive
                                                  ? "bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30"
                                                  : "bg-white border-2 border-gray-200"
                                            }
                                        `}
                    >
                      {isCompleted ? (
                        <FiCheck className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                      ) : (
                        <Icon
                          className={`w-6 h-6 sm:w-7 sm:h-7 ${
                            isActive ? "text-white" : "text-gray-400"
                          }`}
                        />
                      )}

                      {/* Active pulse ring */}
                      {isActive && (
                        <div className="absolute inset-0 rounded-2xl bg-blue-500/20 animate-ping" />
                      )}
                    </div>

                    {/* Step label */}
                    <div className="mt-3 text-center">
                      <p
                        className={`text-sm sm:text-base font-medium ${
                          isActive || isCompleted
                            ? "text-gray-900"
                            : "text-gray-400"
                        }`}
                      >
                        {step.title}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-400 hidden sm:block">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  {/* Connector line */}
                  {index < steps.length - 1 && (
                    <div className="w-20 sm:w-32 lg:w-40 h-1 mx-4 sm:mx-6 rounded-full overflow-hidden bg-gray-200 self-start mt-7 sm:mt-8">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ease-out ${
                          isCompleted
                            ? "w-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                            : "w-0"
                        }`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-gray-900/5 border border-gray-100 overflow-hidden">
          <div className="p-5 sm:p-8 lg:p-10">{children}</div>

          {/* Bottom Navigation inside card */}
          <div className="border-t border-gray-100 bg-gray-50/50 px-5 sm:px-8 lg:px-10 py-4 sm:py-5">
            <div className="flex items-center justify-between gap-3">
              {/* Back Button */}
              {currentStep > 1 ? (
                <button
                  onClick={onBack}
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-medium hover:border-gray-300 hover:bg-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              ) : (
                <div />
              )}

              {/* Progress dots - mobile only */}
              <div className="flex sm:hidden justify-center gap-1.5">
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i < currentStep
                        ? "w-6 bg-gradient-to-r from-blue-500 to-emerald-500"
                        : "w-1.5 bg-gray-300"
                    }`}
                  />
                ))}
              </div>

              {/* Next/Submit Button */}
              <button
                onClick={onNext}
                disabled={!canProceed || isSubmitting}
                className={`
                                flex items-center justify-center gap-2 
                                px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold
                                transition-all duration-300 ease-out
                                ${
                                  canProceed && !isSubmitting
                                    ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 active:translate-y-0"
                                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                }
                            `}
              >
                {isSubmitting ? (
                  <>
                    <FiLoader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : currentStep === totalSteps ? (
                  <>
                    <span>Submit</span>
                    <FiCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                  </>
                ) : (
                  <>
                    <span>Continue</span>
                    <FiArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Trust badges */}
      <div className="mt-6">
        <div className="max-w-3xl mx-auto flex items-center justify-center gap-4 sm:gap-6 text-xs text-gray-400">
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
            <span>Encrypted</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>Secure</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2V7a5 5 0 00-5-5zm3 7V7a3 3 0 10-6 0v2h6z" />
            </svg>
            <span>Private</span>
          </div>
        </div>
      </div>
    </div>
  );
}
