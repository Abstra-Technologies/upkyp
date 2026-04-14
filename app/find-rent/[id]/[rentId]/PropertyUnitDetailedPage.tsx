"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import InquiryBooking from "@/components/tenant/find-rent/inquiry";
import Image from "next/image";
import "leaflet/dist/leaflet.css";
import LoadingScreen from "@/components/loadingScreen";
import { IoArrowBackOutline, IoExpand, IoClose } from "react-icons/io5";
import {
  FaExclamationTriangle,
  FaSwimmingPool,
  FaWifi,
  FaRuler,
  FaCouch,
  FaBed,
  FaShieldAlt,
  FaCalendarAlt,
  FaHome,
  FaMapMarkerAlt,
  FaStar,
  FaMoneyBillWave,
  FaBuilding,
  FaCheck,
  FaComments,
  FaFileContract,
} from "react-icons/fa";
import { BsImageAlt } from "react-icons/bs";
import { MdVerified, MdPayment } from "react-icons/md";
import { HiLocationMarker } from "react-icons/hi";
import { RiShoppingBag3Fill } from "react-icons/ri";
import { SiZcash } from "react-icons/si";
import ReviewsList from "../../../../../components/tenant/reviewList";
import { UnitDetails } from "@/types/units";
import LandlordCard from "@/components/landlord/properties/LandlordCard";
import useAuthStore from "@/zustand/authStore";
import MapDisplay from "@/components/find-rent/MapDisplay";

interface NearbyPlace {
  name: string;
  vicinity: string;
  photoUrl: string | null;
  type: string;
}

interface NearbyData {
  summary: string;
  places: NearbyPlace[];
}

export default function PropertyUnitDetailedPage() {
  const router = useRouter();
  const { rentId, id } = useParams();
  const { user } = useAuthStore();
  const [unit, setUnit] = useState<UnitDetails | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [nearbyData, setNearbyData] = useState<NearbyData>({
    summary: "",
    places: [],
  });
  const [nearbyLoading, setNearbyLoading] = useState(false);

  // Mobile bottom sheet state
  const [showMobileSheet, setShowMobileSheet] = useState(false);
  const [mobileSheetView, setMobileSheetView] = useState<
    "inquire" | "schedule" | "apply"
  >("inquire");

  // Ref for scrolling to booking section on desktop
  const bookingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rentId) return;

    async function fetchUnitDetails() {
      try {
        const res = await fetch(
          `/api/properties/findRent/viewPropUnitDetails?rentId=${rentId}`,
        );
        if (!res.ok) throw new Error("Failed to fetch unit details");
        const data = await res.json();
        setUnit(data);
        setPhotos(data.photos || []);

        if (data?.property_id) {
          fetchNearbyPlaces(data.property_id);
        }
      } catch (error: any) {
        console.error(error.message);
      } finally {
        setLoading(false);
      }
    }

    async function fetchNearbyPlaces(propertyId: string) {
      setNearbyLoading(true);
      try {
        const res = await fetch(
          `/api/properties/findRent/nearbyPlaces?id=${propertyId}`,
        );
        if (!res.ok) throw new Error("Failed to fetch nearby places");
        const data: NearbyData = await res.json();
        setNearbyData(data);
      } catch (error) {
        console.error("Error fetching nearby places:", error);
        setNearbyData({ summary: "", places: [] });
      } finally {
        setNearbyLoading(false);
      }
    }

    fetchUnitDetails();
  }, [rentId, id]);

  // Helper functions
  const parseAmenities = (amenitiesString: any) => {
    if (!amenitiesString) return [];
    return amenitiesString.split(",").map((item: string) => item.trim());
  };

  const parsePaymentMethods = (methodsString: any) => {
    if (!methodsString) return [];
    if (typeof methodsString === "string") {
      const cleaned = methodsString.replace(/[\[\]"'\\]/g, "").trim();
      if (cleaned === "") return [];
      return cleaned
        .split(/[\n,]+/)
        .map((item: string) => item.trim())
        .filter((item: string) => item.length > 0)
        .map((item: string) => {
          // Normalize the text
          const normalized = item
            .toLowerCase()
            .replace(/-/g, " ")
            .replace(/\s+/g, " ")
            .trim();

          // Map to proper display names
          if (normalized === "gcash" || normalized === "g cash") return "GCash";
          if (normalized === "maya") return "Maya";
          if (normalized === "pdc" || normalized === "post dated check")
            return "PDC";
          if (normalized === "cash") return "Cash";
          if (normalized.includes("bank")) return "Bank Transfer";

          // Fallback: capitalize each word
          return item
            .split(/[-\s]+/)
            .map(
              (word: string) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
            )
            .join(" ");
        });
    }
    return [];
  };

  const getAmenityIcon = (amenity: string) => {
    const lower = amenity.toLowerCase();
    if (lower.includes("pool")) return <FaSwimmingPool className="w-5 h-5" />;
    if (lower.includes("wifi") || lower.includes("internet"))
      return <FaWifi className="w-5 h-5" />;
    if (lower.includes("furniture") || lower.includes("furnished"))
      return <FaCouch className="w-5 h-5" />;
    if (lower.includes("bed")) return <FaBed className="w-5 h-5" />;
    if (lower.includes("security")) return <FaShieldAlt className="w-5 h-5" />;
    return <FaCheck className="w-5 h-5" />;
  };

  const getPaymentIcon = (method: string) => {
    const lower = method.toLowerCase();
    if (lower.replace("-", "").includes("gcash"))
      return <SiZcash className="w-5 h-5" />;
    if (lower.includes("maya")) return <FaMoneyBillWave className="w-5 h-5" />;
    if (lower.includes("cash")) return <FaMoneyBillWave className="w-5 h-5" />;
    if (lower.includes("bank") || lower.includes("pdc"))
      return <FaBuilding className="w-5 h-5" />;
    return <MdPayment className="w-5 h-5" />;
  };

  const formatUnitStyle = (style: string) => {
    if (!style) return "Standard Unit";
    return style
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Mobile action handlers
  const openMobileSheet = (view: "inquire" | "schedule" | "apply") => {
    setMobileSheetView(view);
    setShowMobileSheet(true);
  };

  if (loading) {
    return <LoadingScreen message="Loading property details..." />;
  }

  if (!unit) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-emerald-50 p-4">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md w-full border border-gray-100">
          <FaExclamationTriangle className="text-5xl text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Unit Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            We couldn't find the property you're looking for.
          </p>
          <button
            onClick={() => router.push("/pages/find-rent")}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Back to Listings
          </button>
        </div>
      </div>
    );
  }

  const isOccupied = unit.status === "occupied";
  const amenities = parseAmenities(unit.amenities);
  const propertyAmenities = parseAmenities(unit.property_amenities);
  const paymentMethods = parsePaymentMethods(unit.accepted_payment_methods);
  const hasValidLocation = unit.latitude && unit.longitude;

  return (
    <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 min-h-screen pt-16 sm:pt-20 pb-32 lg:pb-0">
      {/* Sticky Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-700 hover:text-blue-600 font-medium transition-colors text-sm sm:text-base"
            >
              <IoArrowBackOutline className="w-5 h-5" />
              <span className="hidden sm:inline">Back</span>
            </button>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                  ₱{unit.rent_amount?.toLocaleString()}
                </span>
                <span className="text-xs sm:text-sm text-gray-500">/month</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Photo Gallery */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {photos.length > 0 ? (
          <div className="relative rounded-2xl overflow-hidden shadow-xl">
            {/* Simplified photo grid - works for all counts */}
            <div
              className={`grid gap-2 h-[280px] sm:h-[400px] lg:h-[500px] ${
                photos.length === 1
                  ? "grid-cols-1"
                  : photos.length === 2
                    ? "grid-cols-2"
                    : "grid-cols-4"
              }`}
            >
              <div
                className={`relative cursor-pointer group ${
                  photos.length >= 3
                    ? "col-span-4 sm:col-span-2 row-span-2"
                    : ""
                }`}
                onClick={() => {
                  setActiveImage(0);
                  setIsGalleryOpen(true);
                }}
              >
                <Image
                  src={photos[0]}
                  alt="Main property image"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {photos.slice(1, 5).map((photo, index) => (
                <div
                  key={index}
                  className="relative cursor-pointer group hidden sm:block"
                  onClick={() => {
                    setActiveImage(index + 1);
                    setIsGalleryOpen(true);
                  }}
                >
                  <Image
                    src={photo}
                    alt={`Property image ${index + 2}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  {index === 3 && photos.length > 5 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                      <span className="text-white font-semibold text-lg">
                        +{photos.length - 5} more
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* View all photos button */}
            <button
              onClick={() => setIsGalleryOpen(true)}
              className="absolute bottom-4 left-4 px-4 py-2 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 text-sm font-semibold hover:bg-white"
            >
              <IoExpand className="w-4 h-4" />
              <span>View all {photos.length}</span>
            </button>
          </div>
        ) : (
          <div className="h-[280px] sm:h-[400px] bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
            <BsImageAlt className="w-16 h-16 text-gray-300" />
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title Section - Compact on mobile */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {unit.unit_style && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-50 to-blue-50 text-emerald-700 rounded-full text-sm font-semibold border border-emerald-200">
                    <FaBed className="w-3.5 h-3.5" />
                    {formatUnitStyle(unit.unit_style)}
                  </span>
                )}
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${
                    isOccupied
                      ? "bg-red-50 text-red-700 border border-red-200"
                      : "bg-green-50 text-green-700 border border-green-200"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isOccupied
                        ? "bg-red-500 animate-pulse"
                        : "bg-green-500 animate-pulse"
                    }`}
                  />
                  {isOccupied ? "Occupied" : "Available"}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2">
                Unit {unit.unit_name}
              </h1>

              <p className="text-base sm:text-lg text-gray-600 mb-3">
                {unit.property_name}
              </p>

              <div className="flex items-center gap-2 text-gray-600 mb-3">
                <MdVerified className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium">Verified Property</span>
              </div>

              <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-2 rounded-lg w-fit">
                <FaMapMarkerAlt className="w-4 h-4 text-blue-600" />
                <span className="text-sm">
                  {unit.city},{" "}
                  {unit.province
                    ?.split("_")
                    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(" ")}
                </span>
              </div>
            </div>

            {/* Key Features - 2x2 on mobile */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="text-center p-4 sm:p-5 bg-white rounded-xl shadow-sm border border-gray-100">
                <FaRuler className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mx-auto mb-2" />
                <div className="text-base sm:text-lg font-bold text-gray-900">
                  {unit.unit_size}
                </div>
                <div className="text-xs text-gray-500">sqm</div>
              </div>

              <div className="text-center p-4 sm:p-5 bg-white rounded-xl shadow-sm border border-gray-100">
                <FaCouch className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 mx-auto mb-2" />
                <div className="text-sm font-semibold text-gray-900 capitalize">
                  {unit.furnish?.replace(/_/g, " ")}
                </div>
                <div className="text-xs text-gray-500">Furnishing</div>
              </div>

              <div className="text-center p-4 sm:p-5 bg-white rounded-xl shadow-sm border border-gray-100">
                <FaShieldAlt className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mx-auto mb-2" />
                <div className="text-base sm:text-lg font-bold text-gray-900">
                  {unit.sec_deposit}
                </div>
                <div className="text-xs text-gray-500">
                  month{unit.sec_deposit > 1 ? "s" : ""} deposit
                </div>
              </div>

              <div className="text-center p-4 sm:p-5 bg-white rounded-xl shadow-sm border border-gray-100">
                <FaCalendarAlt className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 mx-auto mb-2" />
                <div className="text-base sm:text-lg font-bold text-gray-900">
                  {unit.advanced_payment}
                </div>
                <div className="text-xs text-gray-500">
                  month{unit.advanced_payment > 1 ? "s" : ""} advance
                </div>
              </div>
            </div>

            {/* Description */}
            {unit.property_description && (
              <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <FaHome className="w-5 h-5 text-blue-600" />
                  About this property
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4 text-sm sm:text-base">
                  {unit.property_description}
                </p>
                <div className="inline-flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                  <FaBuilding className="w-4 h-4 text-blue-600" />
                  <span className="capitalize font-medium">
                    {unit.property_type?.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
            )}

            {/* Amenities */}
            {(amenities.length > 0 || propertyAmenities.length > 0) && (
              <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
                  What this place offers
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  {[...amenities, ...propertyAmenities].map(
                    (amenity, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-emerald-50 transition-all duration-200 border border-transparent hover:border-blue-100"
                      >
                        <div className="text-blue-600">
                          {getAmenityIcon(amenity)}
                        </div>
                        <span className="text-sm text-gray-700 font-medium">
                          {amenity}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

            {/* Payment Methods */}
            {paymentMethods.length > 0 && (
              <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <MdPayment className="w-5 h-5 text-blue-600" />
                  Payment options
                </h2>

                {unit.flexipay_enabled === 1 && (
                  <div className="mb-4 p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl flex items-center gap-3">
                    <RiShoppingBag3Fill className="w-6 h-6 text-purple-600 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-gray-900 text-sm sm:text-base">
                        FlexiPay Available
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600">
                        Pay in flexible installments
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {paymentMethods.map((method, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-emerald-50 rounded-xl border-2 border-blue-100 hover:border-blue-300 transition-all hover:shadow-md"
                    >
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                        <div className="text-blue-600">
                          {getPaymentIcon(method)}
                        </div>
                      </div>
                      <span className="text-sm sm:text-base font-semibold text-gray-900">
                        {method}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Location */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <FaMapMarkerAlt className="w-5 h-5 text-blue-600" />
                Where you'll be
              </h2>

              <div className="mb-4 p-3 sm:p-4 bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl border border-gray-200">
                <div className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">
                  {unit.property_name}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                  <p>{unit.street}</p>
                  {unit.brgy_district && <p>{unit.brgy_district}</p>}
                  <p>
                    {unit.city},{" "}
                    {unit.province
                      ?.split("_")
                      .map(
                        (w: string) => w.charAt(0).toUpperCase() + w.slice(1),
                      )
                      .join(" ")}
                  </p>
                </div>
              </div>

              {hasValidLocation && (
                <div className="w-full h-[250px] sm:h-[350px] rounded-xl overflow-hidden border-2 border-gray-200 shadow-lg">
                  <MapDisplay
                    latitude={Number(unit.latitude)}
                    longitude={Number(unit.longitude)}
                  />
                </div>
              )}
            </div>

            {/* Nearby Places */}
            {(nearbyData.places.length > 0 || nearbyLoading) && (
              <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <HiLocationMarker className="w-5 h-5 text-emerald-600" />
                  Explore the area
                </h2>

                {nearbyLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <>
                    {nearbyData.summary && (
                      <p className="text-sm text-gray-600 mb-4 bg-blue-50 p-3 rounded-lg">
                        {nearbyData.summary}
                      </p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      {nearbyData.places.map((place, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 bg-gradient-to-br from-gray-50 to-emerald-50/30 rounded-xl border border-gray-200"
                        >
                          {place.photoUrl ? (
                            <img
                              src={place.photoUrl}
                              alt={place.name}
                              className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-lg flex-shrink-0 border border-gray-200"
                            />
                          ) : (
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-gray-200 to-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <HiLocationMarker className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-xs sm:text-sm text-gray-900 truncate">
                              {place.name}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {place.vicinity}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Reviews */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <FaStar className="w-5 h-5 text-yellow-400" />
                Reviews
              </h2>
              <ReviewsList
                unit_id={unit.unit_id}
                landlord_id={unit.landlord_id}
              />
            </div>

            {/* Landlord */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
                Hosted by
              </h2>
              <LandlordCard landlord_id={unit?.landlord_id} />
            </div>
          </div>

          {/* Right Column - Booking Card (Desktop Only) */}
          <div className="hidden lg:block lg:col-span-1" ref={bookingRef}>
            <div className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
              <InquiryBooking
                tenant_id={user?.tenant_id}
                unit_id={unit?.unit_id}
                rent_amount={unit?.rent_amount}
                landlord_id={unit?.landlord_id}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* MOBILE STICKY BOTTOM BAR - Always Visible */}
      {/* ============================================ */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
        <div className="px-4 py-3 safe-area-pb">
          {/* Price row */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                ₱{unit.rent_amount?.toLocaleString()}
              </span>
              <span className="text-gray-500 text-sm ml-1">/month</span>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                isOccupied
                  ? "bg-red-100 text-red-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {isOccupied ? "Occupied" : "Available"}
            </span>
          </div>

          {/* Action Buttons - Large & Clear */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => openMobileSheet("inquire")}
              className="flex flex-col items-center justify-center py-3 px-2 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 rounded-xl transition-all active:scale-95"
            >
              <FaComments className="w-6 h-6 text-blue-600 mb-1" />
              <span className="text-xs font-bold text-blue-700">Ask</span>
            </button>

            <button
              onClick={() => openMobileSheet("schedule")}
              className="flex flex-col items-center justify-center py-3 px-2 bg-purple-50 hover:bg-purple-100 border-2 border-purple-200 rounded-xl transition-all active:scale-95"
            >
              <FaCalendarAlt className="w-6 h-6 text-purple-600 mb-1" />
              <span className="text-xs font-bold text-purple-700">Visit</span>
            </button>

            <button
              onClick={() => openMobileSheet("apply")}
              className="flex flex-col items-center justify-center py-3 px-2 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 rounded-xl transition-all active:scale-95 shadow-lg"
            >
              <FaFileContract className="w-6 h-6 text-white mb-1" />
              <span className="text-xs font-bold text-white">Apply</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* MOBILE BOTTOM SHEET */}
      {/* ============================================ */}
      {showMobileSheet && (
        <div className="lg:hidden fixed inset-0 z-[60]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowMobileSheet(false)}
          />

          {/* Sheet */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] overflow-hidden animate-slide-up">
            {/* Handle */}
            <div className="flex justify-center py-3">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </div>

            {/* Close button */}
            <button
              onClick={() => setShowMobileSheet(false)}
              className="absolute top-3 right-4 p-2 hover:bg-gray-100 rounded-full"
            >
              <IoClose className="w-6 h-6 text-gray-600" />
            </button>

            {/* Content */}
            <div className="px-4 pb-8 pt-2 overflow-y-auto max-h-[calc(85vh-4rem)]">
              <InquiryBooking
                tenant_id={user?.tenant_id}
                unit_id={unit?.unit_id}
                rent_amount={unit?.rent_amount}
                landlord_id={unit?.landlord_id}
                initialView={mobileSheetView}
              />
            </div>
          </div>
        </div>
      )}

      {/* Gallery Modal */}
      {isGalleryOpen && (
        <div className="fixed inset-0 z-[70] bg-black">
          <button
            onClick={() => setIsGalleryOpen(false)}
            className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white z-10 backdrop-blur-sm transition-all"
          >
            <IoClose className="w-6 h-6" />
          </button>

          <div className="h-full flex items-center justify-center p-4">
            <div className="relative w-full h-full max-w-6xl max-h-[90vh]">
              <Image
                src={photos[activeImage]}
                alt={`Image ${activeImage + 1}`}
                fill
                className="object-contain"
              />
            </div>
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-5 py-2.5 bg-white/90 backdrop-blur-md rounded-full text-gray-900 font-semibold shadow-lg">
            {activeImage + 1} / {photos.length}
          </div>

          {photos.length > 1 && (
            <>
              <button
                onClick={() =>
                  setActiveImage((prev) =>
                    prev === 0 ? photos.length - 1 : prev - 1,
                  )
                }
                className="absolute left-4 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-sm transition-all hover:scale-110"
              >
                ←
              </button>
              <button
                onClick={() =>
                  setActiveImage((prev) =>
                    prev === photos.length - 1 ? 0 : prev + 1,
                  )
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-sm transition-all hover:scale-110"
              >
                →
              </button>
            </>
          )}
        </div>
      )}

      {/* Animation styles */}
      <style jsx global>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        .safe-area-pb {
          padding-bottom: max(12px, env(safe-area-inset-bottom));
        }
      `}</style>
    </div>
  );
}
