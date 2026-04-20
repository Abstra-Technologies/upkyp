"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  FaRuler,
  FaCouch,
  FaBuilding,
  FaSwimmingPool,
  FaWifi,
  FaInfoCircle,
  FaMapMarkerAlt,
  FaEye,
  FaPhone,
  FaEnvelope,
} from "react-icons/fa";
import { FacebookShareButton, FacebookIcon } from "next-share";
import { BsImageAlt, BsCheckCircleFill } from "react-icons/bs";
import {
  MdVerified,
  MdOutlineApartment,
  MdClose,
  MdChevronLeft,
  MdChevronRight,
} from "react-icons/md";
import { IoArrowBackOutline } from "react-icons/io5";
import Swal from "sweetalert2";
import MapView from "../../components/landlord/properties/mapViewProp";
import LandlordCard from "../../components/landlord/properties/LandlordCard";
import Head from "next/head";

// Types
interface Unit {
  unit_id: string;
  unit_name: string;
  unit_size: number;
  rent_amount: number;
  furnish: string;
  effective_status: string;
  lease_status?: string;
  photos?: string[];
}

interface Property {
  property_id: string;
  property_name: string;
  property_type: string;
  city: string;
  province: string;
  floor_area: number;
  min_stay: number;
  late_fee: number;
  amenities: string;
  flexipay_enabled: number;
  accepted_payment_methods: string;
  description?: string;
  property_photo?: string[];
  latitude?: number;
  longitude?: number;
  landlord_id: string;
  units: Unit[];
}

interface NearbyPlace {
  name: string;
  vicinity?: string;
  address?: string;
  photoUrl?: string;
}

interface NearbyData {
  summary: string;
  places: NearbyPlace[];
}

// Custom hooks
const useProperty = (id: string) => {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/properties/findRent/viewPropertyDetails?id=${id}`
        );

        if (!res.ok) {
          throw new Error(`Failed to fetch property: ${res.status}`);
        }

        const data = await res.json();
        setProperty(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error occurred");
        console.error("Error fetching property:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProperty();
    }
  }, [id]);

  return { property, loading, error };
};

const useNearbyPlaces = (id: string) => {
  const [nearby, setNearby] = useState<NearbyData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchNearby = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const res = await fetch(
          `/api/properties/findRent/nearbyPlaces?id=${id}`
        );

        if (res.ok) {
          const data = await res.json();
          setNearby(data);
        }
      } catch (err) {
        console.error("Error fetching nearby places:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNearby();
  }, [id]);

  return { nearby, loading };
};

// Utility functions
const parseAmenities = (amenitiesString: string): string[] => {
  if (!amenitiesString) return [];
  return amenitiesString
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const parsePaymentMethods = (paymentString: string): string[] => {
  if (!paymentString) return [];

  try {
    // First try to parse as JSON
    const parsed = JSON.parse(paymentString);
    if (Array.isArray(parsed)) {
      return parsed.filter((method) => method && method.trim().length > 0);
    }
  } catch {
    // If JSON parsing fails, treat as comma-separated string
    return paymentString
      .split(",")
      .map((method) => method.trim())
      .filter((method) => method.length > 1); // Filter out single characters
  }

  return [];
};

const getAmenityIcon = (amenity: string) => {
  const lower = amenity.toLowerCase();
  if (lower.includes("pool"))
    return <FaSwimmingPool className="text-emerald-600" />;
  if (lower.includes("wifi") || lower.includes("internet"))
    return <FaWifi className="text-emerald-600" />;
  return <BsCheckCircleFill className="text-emerald-600" />;
};

const formatCurrency = (amount: number): string => {
  return `₱${amount.toLocaleString()}`;
};

const formatLocation = (city: string, province: string): string => {
  const formattedProvince = province
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  return `${city}, ${formattedProvince}`;
};

// Components
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-emerald-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
      <p className="text-gray-600">Loading property details...</p>
    </div>
  </div>
);

const ErrorState = ({ onRetry }: { onRetry: () => void }) => {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-emerald-50">
      <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md mx-4">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FaInfoCircle className="text-red-500 text-2xl" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Property Not Found
        </h2>
        <p className="text-gray-600 mb-6">
          We couldn't find the property you're looking for.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onRetry}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => router.push("/find-rent")}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Browse Properties
          </button>
        </div>
      </div>
    </div>
  );
};

const ImageGallery = ({
  images,
  propertyName,
}: {
  images: string[];
  propertyName: string;
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  const nextImage = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prevImage = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isGalleryOpen) return;

      switch (e.key) {
        case "ArrowRight":
          nextImage();
          break;
        case "ArrowLeft":
          prevImage();
          break;
        case "Escape":
          setIsGalleryOpen(false);
          break;
      }
    },
    [isGalleryOpen, nextImage, prevImage]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Body scroll lock
  useEffect(() => {
    if (isGalleryOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isGalleryOpen]);

  if (!images.length) {
    return (
      <div className="w-full h-64 md:h-96 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center rounded-xl">
        <div className="text-center">
          <BsImageAlt className="text-4xl text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No Property Images Available</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Main Gallery */}
      <div className="relative">
        <div
          className="w-full h-64 md:h-96 rounded-xl overflow-hidden shadow-lg relative cursor-pointer group"
          onClick={() => setIsGalleryOpen(true)}
        >
          <Image
            src={images[activeIndex]}
            alt={`${propertyName} - Image ${activeIndex + 1}`}
            fill
            sizes="(max-width: 768px) 100vw, 66vw"
            className="object-cover transition-transform group-hover:scale-105"
            priority={activeIndex === 0}
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <FaEye className="text-white text-2xl mb-2 mx-auto block" />
              <p className="text-white text-sm font-medium">
                Click to view gallery
              </p>
            </div>
          </div>

          {/* Image Counter */}
          <div className="absolute top-4 right-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-sm">
            {activeIndex + 1} / {images.length}
          </div>
        </div>

        {/* Thumbnail Navigation */}
        {images.length > 1 && (
          <div className="flex mt-4 space-x-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-emerald-300">
            {images.map((image, index) => (
              <button
                key={index}
                className={`relative w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden flex-shrink-0 transition-all ${
                  activeIndex === index
                    ? "ring-2 ring-emerald-500 opacity-100"
                    : "opacity-60 hover:opacity-80"
                }`}
                onClick={() => setActiveIndex(index)}
              >
                <Image
                  src={image}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Full Screen Gallery Modal */}
      {isGalleryOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {/* Close Button */}
            <button
              onClick={() => setIsGalleryOpen(false)}
              className="absolute top-4 right-4 z-10 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-colors"
            >
              <MdClose className="text-2xl" />
            </button>

            {/* Navigation Buttons */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-3 rounded-full transition-colors z-10"
                >
                  <MdChevronLeft className="text-2xl" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-3 rounded-full transition-colors z-10"
                >
                  <MdChevronRight className="text-2xl" />
                </button>
              </>
            )}

            {/* Main Image */}
            <div className="relative w-full h-full max-w-4xl max-h-full">
              <Image
                src={images[activeIndex]}
                alt={`${propertyName} - Image ${activeIndex + 1}`}
                fill
                sizes="100vw"
                className="object-contain"
                priority
              />
            </div>

            {/* Image Counter */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-60 text-white px-4 py-2 rounded-full">
              {activeIndex + 1} of {images.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const PropertyCard = ({
  title,
  children,
  icon: Icon,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  icon: React.ComponentType<any>;
  className?: string;
}) => (
  <div
    className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}
  >
    <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
      <Icon className="mr-3 text-emerald-600 text-lg" />
      {title}
    </h2>
    {children}
  </div>
);

const UnitCard = ({
  unit,
  onSelect,
}: {
  unit: Unit;
  onSelect: (id: string) => void;
}) => {
  const isAvailable =
    unit.effective_status === "available" &&
    (!unit.lease_status || !["occupied", "active"].includes(unit.lease_status));

  const statusConfig = useMemo(() => {
    if (isAvailable) {
      return {
        label: "Available",
        className: "bg-emerald-100 text-emerald-700 border-emerald-200",
        cardClassName:
          "border-emerald-200 hover:border-emerald-300 bg-emerald-50 hover:bg-emerald-100 cursor-pointer",
      };
    }

    return {
      label: unit.lease_status === "active" ? "Active" : "Occupied",
      className: "bg-red-100 text-red-700 border-red-200",
      cardClassName: "border-red-200 bg-red-50 opacity-60 cursor-not-allowed",
    };
  }, [isAvailable, unit.lease_status]);

  const handleClick = useCallback(() => {
    if (isAvailable) {
      onSelect(unit.unit_id);
    }
  }, [isAvailable, onSelect, unit.unit_id]);

  return (
    <div
      className={`border p-4 rounded-lg transition-all duration-200 ${
        statusConfig.cardClassName
      } ${
        isAvailable ? "hover:shadow-md transform hover:-translate-y-0.5" : ""
      }`}
      onClick={handleClick}
      role={isAvailable ? "button" : undefined}
      tabIndex={isAvailable ? 0 : -1}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          handleClick();
        }
      }}
    >
      <div className="flex flex-col md:flex-row gap-4">
        {/* Unit Image */}
        <div className="w-full md:w-32 flex-shrink-0">
          {unit.photos?.[0] ? (
            <div className="relative h-24 w-full rounded-lg overflow-hidden">
              <Image
                src={unit.photos[0]}
                alt={unit.unit_name}
                fill
                sizes="(max-width: 768px) 100vw, 128px"
                className="object-cover"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="h-24 w-full bg-gray-200 rounded-lg flex items-center justify-center">
              <BsImageAlt className="text-gray-400 text-xl" />
            </div>
          )}
        </div>

        {/* Unit Details */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-lg text-gray-800 truncate">
                {unit.unit_name}
              </h3>

              <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <FaRuler className="mr-1.5 text-emerald-600" />
                  <span>{unit.unit_size} sqm</span>
                </div>
                <div className="flex items-center">
                  <FaCouch className="mr-1.5 text-emerald-600" />
                  <span>
                    {unit.furnish
                      .split("_")
                      .map(
                        (word) => word.charAt(0).toUpperCase() + word.slice(1)
                      )
                      .join(" ")}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right flex-shrink-0">
              <div className="font-bold text-xl text-gray-800">
                {formatCurrency(unit.rent_amount)}
                <span className="text-sm text-gray-500 font-normal">
                  /month
                </span>
              </div>

              <span
                className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${statusConfig.className}`}
              >
                {statusConfig.label}
              </span>
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-4 flex justify-end">
            <button
              disabled={!isAvailable}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isAvailable
                  ? "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isAvailable ? "View Details" : "Not Available"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Component
export default function PropertyDetails() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { property, loading, error } = useProperty(id);
  const { nearby } = useNearbyPlaces(id);

  // Memoized values
  const amenities = useMemo(
    () => (property ? parseAmenities(property.amenities) : []),
    [property?.amenities]
  );

  const paymentMethods = useMemo(
    () =>
      property ? parsePaymentMethods(property.accepted_payment_methods) : [],
    [property?.accepted_payment_methods]
  );

  const shareUrl = useMemo(
    () => `${process.env.NEXT_PUBLIC_BASE_URL}/find-rent/${id}`,
    [id]
  );

  const availableUnits = useMemo(
    () =>
      property?.units.filter(
        (unit) =>
          unit.effective_status === "available" &&
          (!unit.lease_status ||
            !["occupied", "active"].includes(unit.lease_status))
      ) || [],
    [property?.units]
  );

  // Event handlers
  const handleUnitSelection = useCallback(
    (unitId: string) => {
      Swal.fire({
        title: "Redirecting...",
        text: "Please wait while we load the unit details...",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading(),
      });

      setTimeout(() => {
        Swal.close();
        router.push(`/find-rent/${id}/${unitId}`);
      }, 1000);
    },
    [id, router]
  );

  const handleContactSupport = useCallback(() => {
    router.push("/contact-us");
  }, [router]);

  const handleBackClick = useCallback(() => {
    router.back();
  }, [router]);

  const handleRetry = useCallback(() => {
    window.location.reload();
  }, []);

  // Render states
  if (loading) return <LoadingSpinner />;
  if (error || !property) return <ErrorState onRetry={handleRetry} />;

  return (
    <>
      <Head>
        <title>{property.property_name} | FindRent</title>
        <meta property="og:title" content={property.property_name} />
        <meta
          property="og:description"
          content={
            property.description
              ? property.description.slice(0, 150) + "..."
              : "Check out this rental property on FindRent."
          }
        />
        <meta
          property="og:image"
          content={
            property.property_photo?.[0] ||
            `${process.env.NEXT_PUBLIC_BASE_URL}/default-property.jpg`
          }
        />
        <meta property="og:url" content={shareUrl} />
        <meta property="og:type" content="website" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="bg-gradient-to-br from-blue-50 to-emerald-50 min-h-screen pb-8">
        {/* Header */}
        <div className="w-full bg-white shadow-sm sticky top-0 z-40 border-b border-gray-100">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center min-w-0 flex-1">
                <button
                  onClick={handleBackClick}
                  className="mr-3 p-2 hover:bg-gray-100 rounded-lg transition-colors md:hidden"
                  aria-label="Go back"
                >
                  <IoArrowBackOutline className="text-xl" />
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center">
                    <h1 className="text-lg md:text-2xl font-bold text-gray-800 truncate">
                      {property.property_name}
                    </h1>
                    <MdVerified className="ml-2 text-emerald-600 text-xl flex-shrink-0" />
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatLocation(property.city, property.province)}
                  </p>
                </div>
              </div>

              <FacebookShareButton
                url={shareUrl}
                quote={`Check out this property: ${property.property_name}`}
                hashtag="#FindRent"
                className="ml-4"
              >
                <FacebookIcon size={32} round />
              </FacebookShareButton>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          {/* Image Gallery */}
          <div className="mb-8">
            <ImageGallery
              images={property.property_photo || []}
              propertyName={property.property_name}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Back Button - Desktop */}
              <div className="hidden md:block">
                <button
                  onClick={handleBackClick}
                  className="flex items-center text-gray-700 hover:text-emerald-600 transition-colors group"
                >
                  <IoArrowBackOutline className="text-2xl mr-2 group-hover:-translate-x-1 transition-transform" />
                  <span className="text-lg font-medium">Back to listings</span>
                </button>
              </div>

              {/* Property Overview */}
              <PropertyCard title="Property Overview" icon={FaBuilding}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-gray-700 mb-1">
                      Property Type
                    </h3>
                    <p className="text-gray-800 font-medium">
                      {property.property_type.charAt(0).toUpperCase() +
                        property.property_type.slice(1)}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-700 mb-1">
                      Floor Area
                    </h3>
                    <p className="text-gray-800 font-medium">
                      {property.floor_area} sqm
                    </p>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-700 mb-1">
                      Minimum Stay
                    </h3>
                    <p className="text-gray-800 font-medium">
                      {property.min_stay} month(s)
                    </p>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-700 mb-1">Late Fee</h3>
                    <p className="text-gray-800 font-medium">
                      {property.late_fee}%
                    </p>
                  </div>
                </div>

                {/* Amenities & Payment */}
                {(amenities.length > 0 ||
                  property.flexipay_enabled ||
                  paymentMethods.length > 0) && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    {amenities.length > 0 && (
                      <div className="mb-4">
                        <h3 className="font-medium text-gray-700 mb-3">
                          Amenities
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {amenities.map((amenity, index) => (
                            <div
                              key={index}
                              className="flex items-center bg-emerald-50 text-emerald-700 px-3 py-2 rounded-full text-sm border border-emerald-200"
                            >
                              {getAmenityIcon(amenity)}
                              <span className="ml-2">{amenity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Payment Methods and FlexiPay */}
                    <div className="flex flex-wrap gap-3">
                      {property.flexipay_enabled === 1 && (
                        <div className="flex items-center bg-green-50 text-green-700 px-3 py-2 rounded-full text-sm border border-green-200">
                          <BsCheckCircleFill className="mr-2" />
                          <span>FlexiPay Available</span>
                        </div>
                      )}

                      {paymentMethods.length > 0 && (
                        <div className="w-full">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            Accepted Payment Methods:
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {paymentMethods.map((method, idx) => (
                              <span
                                key={idx}
                                className="bg-blue-50 text-blue-700 px-3 py-2 rounded-full text-sm border border-blue-200 capitalize"
                              >
                                {method}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </PropertyCard>

              {/* Property Description */}
              {property.description && (
                <PropertyCard title="About This Property" icon={FaInfoCircle}>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {property.description}
                    </p>
                  </div>
                </PropertyCard>
              )}

              {/* Available Units */}
              <PropertyCard title="Available Units" icon={MdOutlineApartment}>
                {property.units.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <MdOutlineApartment className="text-4xl text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">
                      No units available at this time
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-gray-600">
                        {availableUnits.length} of {property.units.length} units
                        available
                      </p>
                    </div>

                    {property.units.map((unit) => (
                      <UnitCard
                        key={unit.unit_id}
                        unit={unit}
                        onSelect={handleUnitSelection}
                      />
                    ))}
                  </div>
                )}
              </PropertyCard>

              {/* Nearby Places */}
              {nearby && (
                <PropertyCard title="Nearby Places" icon={FaMapMarkerAlt}>
                  <p className="text-gray-700 leading-relaxed mb-6">
                    {nearby.summary}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {nearby.places.slice(0, 8).map((place, idx) => (
                      <div
                        key={idx}
                        className="flex bg-gray-50 rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        <div className="w-20 h-20 flex-shrink-0">
                          {place.photoUrl ? (
                            <img
                              src={place.photoUrl}
                              alt={place.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                              <FaMapMarkerAlt className="text-gray-500 text-lg" />
                            </div>
                          )}
                        </div>
                        <div className="p-3 flex-1 min-w-0">
                          <h4 className="font-medium text-gray-800 truncate text-sm">
                            {place.name}
                          </h4>
                          <p className="text-gray-500 text-xs mt-1 line-clamp-2">
                            {place.vicinity || place.address}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </PropertyCard>
              )}

              {/* Location Map */}
              {property.latitude && property.longitude && (
                <PropertyCard title="Location" icon={FaMapMarkerAlt}>
                  <div className="mb-4">
                    <MapView
                      lat={property.latitude}
                      lng={property.longitude}
                      height="320px"
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    Coordinates: {property.latitude}, {property.longitude}
                  </p>
                </PropertyCard>
              )}

              {/* Landlord Card */}
              <LandlordCard landlord_id={property.landlord_id} />
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
                {/* Quick Stats */}
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">
                    Quick Information
                  </h2>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Total Units</span>
                      <span className="font-semibold text-gray-800">
                        {property.units.length}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Available</span>
                      <span className="font-semibold text-emerald-600">
                        {availableUnits.length}
                      </span>
                    </div>

                    {availableUnits.length > 0 && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Starting Price</span>
                        <span className="font-semibold text-gray-800">
                          {formatCurrency(
                            Math.min(
                              ...availableUnits.map((u) => u.rent_amount)
                            )
                          )}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600">Property Size</span>
                      <span className="font-semibold text-gray-800">
                        {property.floor_area} sqm
                      </span>
                    </div>
                  </div>
                </div>

                {/* Unit Status Guide */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Unit Status Guide
                  </h3>

                  <div className="space-y-3">
                    <div className="flex items-center p-3 border-l-4 border-emerald-500 bg-emerald-50 rounded-r">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 mr-3"></div>
                      <div>
                        <p className="text-emerald-800 font-medium text-sm">
                          Available
                        </p>
                        <p className="text-emerald-600 text-xs">
                          Ready for booking
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center p-3 border-l-4 border-red-500 bg-red-50 rounded-r">
                      <div className="w-3 h-3 rounded-full bg-red-500 mr-3"></div>
                      <div>
                        <p className="text-red-800 font-medium text-sm">
                          Occupied
                        </p>
                        <p className="text-red-600 text-xs">Currently rented</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Actions */}
                <div className="space-y-3">
                  <button
                    onClick={handleContactSupport}
                    className="w-full flex items-center justify-center py-3 bg-gradient-to-r from-emerald-600 to-blue-600 text-white rounded-lg hover:from-emerald-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 font-medium"
                  >
                    <FaPhone className="mr-2" />
                    Contact Support
                  </button>

                  <div className="text-center">
                    <p className="text-gray-600 text-sm mb-2">
                      Need help with booking?
                    </p>
                    <p className="text-gray-500 text-xs">
                      Our team is here to assist you with unit selection and
                      scheduling visits.
                    </p>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-start">
                      <FaInfoCircle className="text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-blue-800 text-sm mb-1">
                          Viewing Tips
                        </h4>
                        <p className="text-blue-700 text-xs leading-relaxed">
                          Click on available units to view detailed information,
                          photos, and schedule a visit. All inquiries are
                          handled directly by our verified landlords.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
