"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaCheckCircle } from "react-icons/fa";

const SuccessPage = () => {
  const router = useRouter();

  useEffect(() => {
    // Automatically redirect after 1 second
    const timer = setTimeout(() => {
      router.push("/pages/tenant/my-unit");
    }, 3000);

    return () => clearTimeout(timer); // Cleanup timeout
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Tenant Application Form
      </h1>
      <FaCheckCircle className="text-green-500 text-6xl mb-4" />
      <p className="text-lg text-gray-700 text-center mb-4">
        Your Application has been submitted. Your application will be reviewed
        shortly.
      </p>
      <button
        onClick={() => router.push("/pages/tenant/my-unit")}
        className="bg-indigo-700 hover:bg-indigo-800 text-white font-semibold py-2 px-6 rounded"
      >
        Finished
      </button>
    </div>
  );
};

export default SuccessPage;
