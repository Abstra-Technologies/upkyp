"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ReviewingListing() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);
  const [isAutoRedirecting, setIsAutoRedirecting] = useState(true);

  useEffect(() => {
    let timer;
    let countdownTimer;

    if (isAutoRedirecting && countdown > 0) {
      countdownTimer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);

      timer = setTimeout(() => {
        router.replace("/pages/landlord/property-listing");
      }, countdown * 1000);
    }

    return () => {
      clearTimeout(timer);
      clearInterval(countdownTimer);
    };
  }, [router, countdown, isAutoRedirecting]);

  const handleFinished = () => {
    setIsAutoRedirecting(false);
    router.push("/pages/landlord/property-listing");
  };

  const handleStayHere = () => {
    setIsAutoRedirecting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Success Animation */}
        <div className="text-center mb-8">
          <div className="relative inline-flex items-center justify-center">
            <div className="w-24 h-24 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div className="absolute -inset-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full opacity-20 animate-ping"></div>
          </div>
        </div>

        {/* Success Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="p-8 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Listing Submitted Successfully!
            </h1>

            <div className="mb-6">
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-emerald-50 px-4 py-2 rounded-full border border-blue-200">
                <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-blue-700">
                  Under Review
                </span>
              </div>
            </div>

            <p className="text-gray-600 mb-8 leading-relaxed">
              Thank you for submitting your property listing. Our team will
              review your submission and verify all documents. You'll receive a
              notification once your listing is approved and goes live.
            </p>

            {/* Timeline */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">
                What's Next?
              </h3>
              <div className="space-y-3 text-left">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white font-bold text-xs">1</span>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">
                      Document Verification
                    </p>
                    <p className="text-gray-600">
                      We'll verify your uploaded documents and photos
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-gray-600 font-bold text-xs">2</span>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">Quality Check</p>
                    <p className="text-gray-600">
                      Property details and images review
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-gray-600 font-bold text-xs">3</span>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">
                      Listing Goes Live
                    </p>
                    <p className="text-gray-600">
                      Your property will be visible to potential tenants
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Estimated Time */}
            <div className="bg-gradient-to-r from-blue-50 to-emerald-50 rounded-xl p-4 mb-6 border border-blue-200">
              <div className="flex items-center justify-center space-x-2">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-sm font-medium text-blue-700">
                  Estimated Review Time: 24-48 hours
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-gray-50 px-8 py-6 border-t border-gray-100">
            {isAutoRedirecting ? (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">
                    Redirecting to your properties in {countdown} seconds...
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-emerald-500 h-2 rounded-full transition-all duration-1000 ease-linear"
                      style={{ width: `${((5 - countdown) / 5) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleStayHere}
                    className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all duration-200 text-sm"
                  >
                    Stay Here
                  </button>
                  <button
                    onClick={handleFinished}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl text-sm"
                  >
                    Go to Properties
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() =>
                      router.push("/pages/landlord/property-listing/create")
                    }
                    className="flex items-center justify-center space-x-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl font-semibold transition-all duration-200 text-sm"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    <span>Add Another Property</span>
                  </button>

                  <button
                    onClick={handleFinished}
                    className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl text-sm"
                  >
                    View All Properties
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 mb-2">
            Need help or have questions?
          </p>
          <div className="flex justify-center space-x-4 text-xs">
            <button className="text-blue-600 hover:text-blue-700 transition-colors underline">
              Contact Support
            </button>
            <span className="text-gray-300">|</span>
            <button className="text-blue-600 hover:text-blue-700 transition-colors underline">
              FAQ
            </button>
            <span className="text-gray-300">|</span>
            <button className="text-blue-600 hover:text-blue-700 transition-colors underline">
              Guidelines
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
