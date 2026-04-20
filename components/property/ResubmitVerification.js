"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Swal from "sweetalert2";

export default function ResubmitVerification({ property_id }) {
  const router = useRouter();
  const [property, setProperty] = useState(null);
  const [occPermit, setOccPermit] = useState(null);
  const [mayorPermit, setMayorPermit] = useState(null);
  const [govID, setGovID] = useState(null);
  const [propTitle, setPropTitle] = useState(null);
  const [indoorPhoto, setIndoorPhoto] = useState(null);
  const [outdoorPhoto, setOutdoorPhoto] = useState(null);

  useEffect(() => {
    if (property_id) {
      fetch(`/api/propertyListing/propListing?property_id=${property_id}`)
        .then((res) => res.json())
        .then((data) => setProperty(data))
        .catch((error) => console.error("Error fetching property:", error));
    }
  }, [property_id]);

  const handleFileChange = (e, setFile) => {
    const file = e.target.files[0];
    setFile(file);
  };

  const handleResubmit = async (e) => {
    e.preventDefault();

    if (
      !occPermit ||
      !mayorPermit ||
      !govID ||
      !indoorPhoto ||
      !outdoorPhoto ||
      !propTitle
    ) {
      Swal.fire(
        "Missing Files",
        "Please upload all required documents.",
        "warning"
      );
      return;
    }

    const formData = new FormData();
    formData.append("property_id", property_id);
    formData.append("occPermit", occPermit);
    formData.append("mayorPermit", mayorPermit);
    formData.append("govID", govID);
    formData.append("propTitle", propTitle);
    formData.append("indoor", indoorPhoto);
    formData.append("outdoor", outdoorPhoto);

    try {
      Swal.fire({
        title: "Submitting...",
        text: "Please wait while we process your request.",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading(); // Show loading indicator
        },
      });

      await axios.post("/api/propertyListing/propVerify", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      Swal.fire(
        "Success",
        "Verification documents resubmitted successfully.",
        "success"
      );
      router.push("/landlord/property-listing/review-listing");
    } catch (error) {
      Swal.fire(
        "Error",
        `Failed to resubmit verification: ${error.message}`,
        "error"
      );
    }
  };

  return (
    <div className="p-8 bg-white shadow-lg rounded-lg border border-gray-100">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        Document Verification
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Occupancy Permit (PDF)
          </label>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => handleFileChange(e, setOccPermit)}
            className="mt-1 block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-medium
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100 cursor-pointer"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Mayor's Permit (PDF)
          </label>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => handleFileChange(e, setMayorPermit)}
            className="mt-1 block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-medium
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100 cursor-pointer"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Government ID (Image/PDF)
          </label>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => handleFileChange(e, setGovID)}
            className="mt-1 block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-medium
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100 cursor-pointer"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Indoor Property Photo
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange(e, setIndoorPhoto)}
            className="mt-1 block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-medium
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100 cursor-pointer"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Outdoor Property Photo
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange(e, setOutdoorPhoto)}
            className="mt-1 block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-medium
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100 cursor-pointer"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Property Title
          </label>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => handleFileChange(e, setPropTitle)}
            className="mt-1 block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-medium
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100 cursor-pointer"
          />
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={handleResubmit}
          className="px-6 py-2.5 bg-blue-600 text-white font-medium text-sm rounded-lg
                shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg
                focus:outline-none focus:ring-2 focus:ring-blue-300 transition duration-150 ease-in-out"
        >
          Resubmit for Verification
        </button>
      </div>
    </div>
  );
}
