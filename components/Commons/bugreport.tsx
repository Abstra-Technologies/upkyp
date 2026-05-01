"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { bugTypes } from "@/constant/bugTypes";

export default function BugReportForm({ user_id }: { user_id: string }) {
  const [bugType, setBugType] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/systemPerformance/submitBugReport", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id, bugType, subject, description }),
      });

      if (response.ok) {
        setMessage("Bug report submitted successfully.");
        setBugType("");
        setSubject("");
        setDescription("");
        router.refresh();
      } else {
        setMessage("Failed to submit bug report. Please try again.");
      }
    } catch (error) {
      setMessage("An error occurred. Please try again later.");
    }

    setLoading(false);
  };

  return (
    <div className="max-w-lg w-full mx-auto p-6 bg-white shadow-lg rounded-2xl">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        Report System Bug
      </h2>

      {message && (
        <div
          className={`p-3 text-white text-sm rounded-md mb-4 ${
            message.includes("success") ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
        {/* Bug Type Dropdown */}
        <div>
          <label className="block text-gray-700 font-medium mb-1">
            Bug Type:
          </label>
          <select
            value={bugType}
            onChange={(e) => setBugType(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            required
          >
            <option value="" disabled>
              Select Bug Type
            </option>
            {bugTypes.map((type, index) => (
              <option key={index} value={type.value}>
                {type.value}
              </option>
            ))}
          </select>
        </div>

        {/* Subject Input */}
        <div>
          <label className="block text-gray-700 font-medium mb-1">
            Subject:
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            required
          />
        </div>

        {/* Description Textarea */}
        <div>
          <label className="block text-gray-700 font-medium mb-1">
            Description:
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 h-28 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            required
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className={`w-full p-3 rounded-lg text-white font-medium ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 transition duration-200 transform hover:scale-105"
          }`}
          disabled={loading}
        >
          {loading ? "Submitting..." : "Submit Bug Report"}
        </button>
      </form>
    </div>
  );
}
