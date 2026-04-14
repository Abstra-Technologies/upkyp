'use client'
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import useAuth from "../../../../hooks/useSession";

const AccessDenied = () => {
    const router = useRouter();
    const { user, admin} = useAuth();

    const handleGoBack = () => {
        const previousPage = document.referrer || "/";

        router.back();

        setTimeout(() => {
            router.replace(previousPage);
        }, 100);
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen text-center">
            <h1 className="text-4xl font-bold text-red-600 mb-4">Access Denied</h1>
            <p className="text-lg text-gray-700 mb-6">
                You do not have permission to view this page.
            </p>
            <button
                onClick={handleGoBack}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
                Go Back
            </button>
        </div>
    );
};

export default AccessDenied;
