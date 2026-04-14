"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import useAuth from "@/hooks/useSession";
import PropertyPhotos from "@/components/propertyVerification/PropertyPhotos";
import SideNavAdmin from "@/components/navigation/sidebar-admin";
import LoadingScreen from "@/components/loadingScreen";
import Swal from 'sweetalert2';


export default function PropertyDetails() {
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("details");
  const [showMessageBox, setShowMessageBox] = useState(false);

  const params = useParams();
  const router = useRouter();
  const property_id = params.property_id;

  useEffect(() => {
    if (!property_id) {
      setError("Property ID is missing.");
      setLoading(false);
      return;
    }

    async function fetchProperty() {
      try {
        const res = await fetch(`/api/systemadmin/propertyListings/viewDetails/${property_id}`);
        const data = await res.json();

        if (data.message) {
          setError(data.message);
        } else {
          setProperty(data);
        }
      } catch (err) {
        setError("Failed to fetch property details due to a network or server error.");
      }
      setLoading(false);
    }

    fetchProperty();
  }, [property_id]);

  const handleUpdateStatus = async (status) => {
    try {
      const res = await fetch("/api/systemadmin/propertyListings/updateStatus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ property_id, status, message }),
      });

      const data = await res.json();
      if (res.ok) {
        await Swal.fire({
          icon: 'success',
          title: 'Success',
          text: data.message,
          confirmButtonText: 'OK',
        });
        router.push("/system_admin/propertyManagement/list");
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: data.message,
          confirmButtonText: 'OK',
        });
      }
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update property status due to a network or server error.',
        confirmButtonText: 'OK',
      });
    }
  };

  const isPDF = (url) => url && url.toLowerCase().endsWith(".pdf");

  // Tabs configuration
  const tabs = [
    { id: "details", label: "Property Details" },
    { id: "documents", label: "Verification Documents" },
    { id: "photos", label: "Property Photos" },
    { id: "approval", label: "Approval Section" },
  ];

  if (loading) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/0 w-full">
          <LoadingScreen message="Just a moment, getting things ready..." />
        </div>
    );
  }

  if (error) {
    return (
        <div className="max-w-3xl mx-auto mt-10 p-6 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg
                className="h-6 w-6 text-red-500 mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
              <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-lg font-medium text-red-800">
              Error Loading Property
            </h3>
          </div>
          <p className="mt-2 text-red-700">{error}</p>
          <button
              onClick={() =>
                  router.push("/system_admin/propertyManagement/list")
              }
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Back to Property List
          </button>
        </div>
    );
  }

  return (
      <div className="flex">
        <SideNavAdmin />
        <div className="flex-1 bg-gray-50 min-h-screen pb-12">
          {/* Header with property name and navigation */}
          <div className="bg-white shadow">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {property.property_name}
                  </h1>
                </div>
                <div className="mt-4 md:mt-0">
                  <button
                      onClick={() =>
                          router.push("/system_admin/propertyManagement/list")
                      }
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg
                        className="-ml-1 mr-2 h-5 w-5 text-gray-500"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                      <path
                          fillRule="evenodd"
                          d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z"
                          clipRule="evenodd"
                      />
                    </svg>
                    Back to Properties
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tab navigation */}
          <div className="border-b border-gray-200 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <nav className="flex -mb-px space-x-8">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === tab.id
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                    >
                      {tab.label}
                    </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main content area */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              {/* Property Details Tab */}
              {activeTab === "details" && (
                  <div className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">
                      Property Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-medium text-gray-700 mb-3">
                          Location Details
                        </h3>
                        <div className="space-y-3">
                          <div className="flex">
                        <span className="w-32 text-sm font-medium text-gray-500">
                          City:
                        </span>
                            <span className="text-sm text-gray-900">
                          {property.city}
                        </span>
                          </div>
                          <div className="flex">
                        <span className="w-32 text-sm font-medium text-gray-500">
                          Barangay:
                        </span>
                            <span className="text-sm text-gray-900">
                          {property.brgy_district}
                        </span>
                          </div>
                          <div className="flex">
                        <span className="w-32 text-sm font-medium text-gray-500">
                          ZIP Code:
                        </span>
                            <span className="text-sm text-gray-900">
                          {property.zip_code}
                        </span>
                          </div>
                          <div className="flex">
                        <span className="w-32 text-sm font-medium text-gray-500">
                          Province:
                        </span>
                            <span className="text-sm text-gray-900">
                          {property.province}
                        </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-medium text-gray-700 mb-3">
                          Property Details
                        </h3>
                        <div className="space-y-3">
                          <div className="flex">
                        <span className="w-32 text-sm font-medium text-gray-500">
                          Type:
                        </span>
                            <span className="text-sm text-gray-900">
                          {property?.property_type}
                        </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {property.reviewed_by && (
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <svg
                                  className="h-5 w-5 text-blue-400"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                              >
                                <path
                                    fillRule="evenodd"
                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                    clipRule="evenodd"
                                />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-blue-800">
                                Administrative Information
                              </h3>
                              <div className="mt-2 text-sm text-blue-700">
                                <p>Last Updated by Admin: {property.reviewed_by}</p>
                                {property.admin_message && (
                                    <p className="mt-1">
                                      Admin Message: {property.admin_message}
                                    </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                    )}
                  </div>
              )}

              {/* Verification Documents Tab */}
              {activeTab === "documents" && (
                  <div className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">
                      Verification Documents
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {property.submitted_doc ? (
                          <div className="border rounded-lg overflow-hidden">
                            <div className="bg-gray-50 px-4 py-2 border-b">
                              <h3 className="font-medium text-gray-700">
                                {property.doc_type === 'business_permit'
                                    ? "Business Permit"
                                    : property.doc_type === 'occupancy_permit'
                                        ? "Occupancy Permit"
                                        : "Property Title"}
                              </h3>
                            </div>
                            <div className="p-2">
                              {isPDF(property.submitted_doc) ? (
                                  <iframe
                                      src={property.submitted_doc}
                                      width="100%"
                                      height="400px"
                                      className="border-0"
                                      title={property.doc_type}
                                  ></iframe>
                              ) : (
                                  <div className="aspect-w-16 aspect-h-12">
                                    <img
                                        src={property.submitted_doc}
                                        alt={property.doc_type}
                                        className="object-contain w-full h-full"
                                    />
                                  </div>
                              )}
                            </div>
                          </div>
                      ) : (
                          <div className="border rounded-lg overflow-hidden bg-gray-50 p-6 flex items-center justify-center">
                            <p className="text-gray-500">
                              No verification document available
                            </p>
                          </div>
                      )}

                      {property.gov_id ? (
                          <div className="border rounded-lg overflow-hidden">
                            <div className="bg-gray-50 px-4 py-2 border-b">
                              <h3 className="font-medium text-gray-700">
                                Government ID
                              </h3>
                            </div>
                            <div className="p-2">
                              {isPDF(property.gov_id) ? (
                                  <iframe
                                      src={property.gov_id}
                                      width="100%"
                                      height="400px"
                                      className="border-0"
                                      title="Government ID"
                                  ></iframe>
                              ) : (
                                  <div className="aspect-w-16 aspect-h-12">
                                    <img
                                        src={property.gov_id}
                                        alt="Government ID"
                                        className="object-contain w-full h-full"
                                    />
                                  </div>
                              )}
                            </div>
                          </div>
                      ) : (
                          <div className="border rounded-lg overflow-hidden bg-gray-50 p-6 flex items-center justify-center">
                            <p className="text-gray-500">
                              No Government ID available
                            </p>
                          </div>
                      )}
                    </div>
                  </div>
              )}

              {/* Property Photos Tab */}
              {activeTab === "photos" && (
                  <div className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">
                      Property Photos
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div>
                        <h3 className="font-medium text-gray-700 mb-3">
                          Outdoor Photo
                        </h3>
                        {property.outdoor_photo ? (
                            <div className="border rounded-lg overflow-hidden">
                              <img
                                  src={property.outdoor_photo}
                                  alt="Outdoor view of property"
                                  className="w-full h-64 object-cover"
                              />
                            </div>
                        ) : (
                            <div className="border rounded-lg overflow-hidden bg-gray-50 p-6 h-64 flex items-center justify-center">
                              <p className="text-gray-500">
                                No outdoor photo available
                              </p>
                            </div>
                        )}
                      </div>

                      <div>
                        <h3 className="font-medium text-gray-700 mb-3">
                          Indoor Photo
                        </h3>
                        {property.indoor_photo ? (
                            <div className="border rounded-lg overflow-hidden">
                              <img
                                  src={property.indoor_photo}
                                  alt="Indoor view of property"
                                  className="w-full h-64 object-cover"
                              />
                            </div>
                        ) : (
                            <div className="border rounded-lg overflow-hidden bg-gray-50 p-6 h-64 flex items-center justify-center">
                              <p className="text-gray-500">
                                No indoor photo available
                              </p>
                            </div>
                        )}
                      </div>
                    </div>

                    <h3 className="font-medium text-gray-700 mb-3">
                      Additional Property Photos
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <PropertyPhotos property_id={property_id} />
                    </div>
                  </div>
              )}

              {/* Approval Section Tab */}
              {activeTab === "approval" && (
                  <div className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">
                      Property Approval
                    </h2>

                    {/* Current Status */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      <h3 className="font-medium text-gray-700 mb-2">
                        Current Status
                      </h3>
                      <div className="flex items-center">
                    <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            property.verification_status === "Verified"
                                ? "bg-green-100 text-green-800"
                                : property.verification_status === "Rejected"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                        }`}
                    >
                      {property.verification_status || "Pending Review"}
                    </span>
                      </div>

                      {property.admin_message && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-500">
                              Previous Admin Message:
                            </h4>
                            <p className="mt-1 text-sm">{property.admin_message}</p>
                          </div>
                      )}
                    </div>

                    {/* Approval Actions */}
                    <div className="bg-white border rounded-lg p-6">
                      <h3 className="font-medium text-gray-900 mb-4">
                        Update Property Status
                      </h3>

                      {showMessageBox && (
                          <div className="mb-4">
                            <label
                                htmlFor="admin-message"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Message for Property Owner
                            </label>
                            <textarea
                                id="admin-message"
                                rows="4"
                                placeholder="Enter feedback for rejection"
                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            />
                          </div>
                      )}

                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={() => {
                              setShowMessageBox(false);
                              handleUpdateStatus("Verified");
                            }}
                            className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          <svg
                              className="-ml-1 mr-2 h-5 w-5"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                          >
                            <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                            />
                          </svg>
                          Approve Property
                        </button>
                        <button
                            onClick={() => {
                              setShowMessageBox(true);
                              handleUpdateStatus("Rejected");
                            }}
                            className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <svg
                              className="-ml-1 mr-2 h-5 w-5"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                          >
                            <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                            />
                          </svg>
                          Reject Property
                        </button>
                      </div>
                    </div>
                  </div>
              )}
            </div>
          </div>
        </div>
      </div>
  );
}