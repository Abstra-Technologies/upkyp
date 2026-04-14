"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import useAuth from "@/hooks/useSession";
import LoadingScreen from "@/components/loadingScreen";
import {
  ChevronLeft,
  User,
  MapPin,
  FileText,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  ZoomIn,
  ZoomOut,
  X,
  Download,
  Eye,
} from "lucide-react";

export default function LandlordDetails() {
  const router = useRouter();
  const params = useParams();
  const landlord_id = params.landlord_id;
  const { admin } = useAuth();
  const [landlord, setLandlord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageZoom, setImageZoom] = useState(100);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageErrors, setImageErrors] = useState({});
  const [imageLoading, setImageLoading] = useState({});

  // load details of the landlord
  useEffect(() => {
    if (landlord_id) {
      fetch(`/api/systemadmin/landlord-verifications/details/${landlord_id}`)
        .then((res) => res.json())
        .then((data) => {
          setLandlord(data);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching landlord details:", error);
          setLoading(false);
        });
    }
  }, [landlord_id]);

  const handleVerification = async (status) => {
    if (status === "rejected" && message.trim() === "") {
      alert("Please provide a reason for rejection.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(
        "/api/systemadmin/landlord-verifications/update-status",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            landlord_id,
            status,
            message: message || null,
            document_url: landlord.verification.document_url,
            selfie_url: landlord.verification.selfie_url,
          }),
          credentials: "include",
        }
      );

      const data = await res.json();
      if (res.ok) {
        alert(`Verification ${status} successfully.`);
        router.push("/system_admin/tenant_landlord/verification");
      } else {
        alert(data.error || "Something went wrong.");
      }
    } catch (error) {
      console.error("Error updating verification status:", error);
      alert("Failed to update verification status.");
    }

    setIsSubmitting(false);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: {
        icon: Clock,
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        text: "Pending Review",
      },
      approved: {
        icon: CheckCircle,
        color: "bg-green-100 text-green-800 border-green-200",
        text: "Approved",
      },
      rejected: {
        icon: XCircle,
        color: "bg-red-100 text-red-800 border-red-200",
        text: "Rejected",
      },
    };
    const badge = badges[status] || badges.pending;
    const IconComponent = badge.icon;
    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${badge.color}`}
      >
        <IconComponent size={16} />
        {badge.text}
      </span>
    );
  };

  const handleImageError = (imageType) => {
    setImageErrors((prev) => ({ ...prev, [imageType]: true }));
    setImageLoading((prev) => ({ ...prev, [imageType]: false }));
  };

  const handleImageLoad = (imageType) => {
    setImageLoading((prev) => ({ ...prev, [imageType]: false }));
    setImageErrors((prev) => ({ ...prev, [imageType]: false }));
  };

  const handleImageLoadStart = (imageType) => {
    setImageLoading((prev) => ({ ...prev, [imageType]: true }));
  };

  const openImageModal = (imageUrl, type) => {
    if (imageUrl && !imageErrors[type]) {
      setSelectedImage({ url: imageUrl, type });
      setImageZoom(100);
      setImagePosition({ x: 0, y: 0 });
    }
  };

  const closeImageModal = () => {
    setSelectedImage(null);
    setImageZoom(100);
    setImagePosition({ x: 0, y: 0 });
  };

  const handleZoom = (direction) => {
    setImageZoom((prev) => {
      const newZoom =
        direction === "in" ? Math.min(prev + 25, 300) : Math.max(prev - 25, 50);
      return newZoom;
    });
  };

  const handleMouseDown = (e) => {
    if (imageZoom > 100) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - imagePosition.x,
        y: e.clientY - imagePosition.y,
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && imageZoom > 100) {
      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, dragStart, imageZoom]);

  if (loading) return <LoadingScreen />;
  if (!landlord)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Landlord not found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            The requested landlord could not be located.
          </p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() =>
                  router.push(
                    "/system_admin/tenant_landlord/verification"
                  )
                }
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ChevronLeft size={20} />
                Back to Verifications
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-xl font-semibold text-gray-900">
                Landlord Verification
              </h1>
            </div>
            {landlord?.verification?.status &&
              getStatusBadge(landlord.verification.status)}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Landlord Information */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <User size={20} className="text-blue-600" />
                  Landlord Information
                </h2>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Landlord ID
                  </label>
                  <p className="text-sm text-gray-900 font-mono">
                    {landlord?.landlord?.landlord_id}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    User ID
                  </label>
                  <p className="text-sm text-gray-900 font-mono">
                    {landlord?.landlord?.user_id}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Citizenship
                  </label>
                  <p className="text-sm text-gray-900">
                    {landlord?.landlord?.citizenship}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                    <MapPin size={14} />
                    Address
                  </label>
                  <p className="text-sm text-gray-900">
                    {landlord?.landlord?.address}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Trial Status
                  </label>
                  <p className="text-sm text-gray-900">
                    {landlord?.landlord?.is_trial_used ? (
                      <span className="text-green-600 font-medium">
                        ✓ Trial Used
                      </span>
                    ) : (
                      <span className="text-gray-600">Trial Not Used</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Verification History */}
            {landlord.verification && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <FileText size={20} className="text-purple-600" />
                    Verification Details
                  </h2>
                </div>
                <div className="px-6 py-4 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Document Type
                    </label>
                    <p className="text-sm text-gray-900">
                      {landlord?.verification?.document_type}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Reviewed By
                    </label>
                    <p className="text-sm text-gray-900">
                      {landlord?.verification?.reviewed_by ||
                        "Not yet reviewed"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                      <Calendar size={14} />
                      Review Date
                    </label>
                    <p className="text-sm text-gray-900">
                      {landlord?.verification?.review_date ||
                        "Not yet reviewed"}
                    </p>
                  </div>
                  {landlord?.verification?.message && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <label className="text-sm font-medium text-red-700">
                        Rejection Reason
                      </label>
                      <p className="text-sm text-red-600 mt-1">
                        {landlord?.verification?.message}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Documents and Actions */}
          <div className="lg:col-span-2 space-y-6">
            {landlord.verification ? (
              <>
                {/* Documents */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">
                      Submitted Documents
                    </h2>
                  </div>
                  <div className="px-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* ID Document */}
                      <div className="space-y-3">
                        <h3 className="text-sm font-medium text-gray-900">
                          Identity Document
                        </h3>
                        <div className="relative group">
                          {imageLoading.document ? (
                            <div className="w-full h-48 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                              <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                            </div>
                          ) : imageErrors.document ? (
                            <div className="w-full h-48 bg-gray-100 rounded-lg border border-gray-200 flex flex-col items-center justify-center text-gray-500">
                              <FileText size={32} className="mb-2" />
                              <p className="text-sm">Failed to load image</p>
                              <button
                                onClick={() => {
                                  setImageErrors((prev) => ({
                                    ...prev,
                                    document: false,
                                  }));
                                  handleImageLoadStart("document");
                                }}
                                className="text-xs text-blue-600 hover:text-blue-700 mt-1"
                              >
                                Try again
                              </button>
                            </div>
                          ) : (
                            <img
                              src={landlord?.verification?.document_url}
                              alt="Identity Document"
                              className="w-full h-48 object-cover rounded-lg border border-gray-200 cursor-pointer transition-transform group-hover:scale-[1.02]"
                              onClick={() =>
                                openImageModal(
                                  landlord?.verification?.document_url,
                                  "Identity Document"
                                )
                              }
                              onLoad={() => handleImageLoad("document")}
                              onError={() => handleImageError("document")}
                              onLoadStart={() =>
                                handleImageLoadStart("document")
                              }
                            />
                          )}
                          {!imageErrors.document && !imageLoading.document && (
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all flex items-center justify-center">
                              <Eye
                                className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                size={24}
                              />
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() =>
                            openImageModal(
                              landlord?.verification?.document_url,
                              "Identity Document"
                            )
                          }
                          disabled={
                            imageErrors.document || imageLoading.document
                          }
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
                        >
                          <Eye size={16} />
                          View Full Size
                        </button>
                      </div>

                      {/* Selfie */}
                      <div className="space-y-3">
                        <h3 className="text-sm font-medium text-gray-900">
                          Identity Verification Selfie
                        </h3>
                        <div className="relative group">
                          {imageLoading.selfie ? (
                            <div className="w-full h-48 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                              <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                            </div>
                          ) : imageErrors.selfie ? (
                            <div className="w-full h-48 bg-gray-100 rounded-lg border border-gray-200 flex flex-col items-center justify-center text-gray-500">
                              <User size={32} className="mb-2" />
                              <p className="text-sm">Failed to load image</p>
                              <button
                                onClick={() => {
                                  setImageErrors((prev) => ({
                                    ...prev,
                                    selfie: false,
                                  }));
                                  handleImageLoadStart("selfie");
                                }}
                                className="text-xs text-blue-600 hover:text-blue-700 mt-1"
                              >
                                Try again
                              </button>
                            </div>
                          ) : (
                            <img
                              src={landlord?.verification?.selfie_url}
                              alt="Identity Selfie"
                              className="w-full h-48 object-cover rounded-lg border border-gray-200 cursor-pointer transition-transform group-hover:scale-[1.02]"
                              onClick={() =>
                                openImageModal(
                                  landlord?.verification?.selfie_url,
                                  "Identity Verification Selfie"
                                )
                              }
                              onLoad={() => handleImageLoad("selfie")}
                              onError={() => handleImageError("selfie")}
                              onLoadStart={() => handleImageLoadStart("selfie")}
                            />
                          )}
                          {!imageErrors.selfie && !imageLoading.selfie && (
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all flex items-center justify-center">
                              <Eye
                                className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                size={24}
                              />
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() =>
                            openImageModal(
                              landlord?.verification?.selfie_url,
                              "Identity Verification Selfie"
                            )
                          }
                          disabled={imageErrors.selfie || imageLoading.selfie}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
                        >
                          <Eye size={16} />
                          View Full Size
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Verification Actions */}
                {landlord?.verification?.status === "pending" && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h2 className="text-lg font-medium text-gray-900">
                        Review Actions
                      </h2>
                    </div>
                    <div className="px-6 py-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Rejection Reason (if rejecting)
                        </label>
                        <textarea
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          placeholder="Please provide a detailed reason for rejection..."
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          rows={4}
                        ></textarea>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={() => handleVerification("approved")}
                          disabled={isSubmitting}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-lg transition-colors"
                        >
                          {isSubmitting ? (
                            <>
                              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                              Approving...
                            </>
                          ) : (
                            <>
                              <CheckCircle size={18} />
                              Approve Verification
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleVerification("rejected")}
                          disabled={isSubmitting}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium rounded-lg transition-colors"
                        >
                          {isSubmitting ? (
                            <>
                              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                              Rejecting...
                            </>
                          ) : (
                            <>
                              <XCircle size={18} />
                              Reject Verification
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-8 text-center">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No Verification Details
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    This landlord hasn't submitted verification documents yet.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 bg-white rounded-t-lg">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedImage.type}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleZoom("out")}
                  disabled={imageZoom <= 50}
                  className="p-2 text-gray-600 hover:text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  <ZoomOut size={20} />
                </button>
                <span className="text-sm font-medium text-gray-700 min-w-[60px] text-center">
                  {imageZoom}%
                </span>
                <button
                  onClick={() => handleZoom("in")}
                  disabled={imageZoom >= 300}
                  className="p-2 text-gray-600 hover:text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  <ZoomIn size={20} />
                </button>
                <div className="w-px h-6 bg-gray-300 mx-2"></div>
                <button
                  onClick={closeImageModal}
                  className="p-2 text-gray-600 hover:text-gray-900"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div
              className="flex-1 bg-gray-100 rounded-b-lg overflow-hidden relative"
              style={{ cursor: imageZoom > 100 ? "grab" : "default" }}
            >
              <img
                src={selectedImage.url}
                alt={selectedImage.type}
                className="transition-transform duration-200 ease-out"
                style={{
                  transform: `scale(${imageZoom / 100}) translate(${
                    imagePosition.x
                  }px, ${imagePosition.y}px)`,
                  transformOrigin: "center center",
                  maxWidth: "none",
                  maxHeight: "none",
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
                onMouseDown={handleMouseDown}
                draggable={false}
              />
              {imageZoom > 100 && (
                <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded text-sm">
                  Click and drag to pan
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
