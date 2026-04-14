"use client";
import Link from "next/link";
import { useState } from "react";
import Page_footer from "../../../../components/navigation/page_footer";
import Image from "next/image";

export default function GoogleLoginError() {
  const [errorDetails] = useState({
    title: "Authentication Error",
    message: "User not registered or Google ID missing. Please register first.",
  });

  return (
    <>
      <div className="relative flex justify-center items-center h-screen bg-gray-100 overflow-hidden">
        <Image
          src="/images/hero-section.jpeg"
          alt="Cityscape view of high-rise buildings"
          fill
          className="object-cover brightness-75 z-0"
          priority
        />
        <div className="relative z-10 bg-white p-8 rounded-lg shadow-md w-96 text-center">
          <div className="mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 text-red-500 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {errorDetails.title}
          </h1>

          <p className="text-gray-600 mb-6">{errorDetails.message}</p>

          <div className="space-y-4">
            <Link href="../auth/selectRole">
              <button className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition mb-2">
                Register Now
              </button>
            </Link>

            <Link href="../auth/login">
              <button className="w-full py-2 px-4 border border-gray-300 bg-white text-gray-700 font-medium rounded-md hover:bg-gray-50 transition">
                Back to Login
              </button>
            </Link>
          </div>
        </div>
      </div>
      <Page_footer />
    </>
  );
}
