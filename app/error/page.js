import React from "react";

export default function ErrorPage()  {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 text-gray-800">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-blue-600 mb-4">

        </h1>
        <p className="text-xl mb-6">
        </p>
        <a
          href="/public"
          className="px-6 py-3 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition"
        >
          Go Back Home
        </a>
      </div>
    </div>
  );
}
