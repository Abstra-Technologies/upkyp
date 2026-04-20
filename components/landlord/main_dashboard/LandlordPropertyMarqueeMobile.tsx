"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { MapPin, Home, Eye } from "lucide-react";
import usePropertyStore from "@/zustand/property/usePropertyStore";

interface Props {
  landlordId: number | undefined;
}

export default function LandlordPropertyMarqueeMobile({ landlordId }: Props) {
  const router = useRouter();
  const { properties, loading, fetchAllProperties } = usePropertyStore();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (landlordId) fetchAllProperties(landlordId);
  }, [landlordId, fetchAllProperties]);

  if (loading) {
    return (
      <div className="px-4">
        <div className="h-[480px] rounded-3xl bg-gray-100 animate-pulse" />
      </div>
    );
  }

  if (!properties || properties.length === 0) {
    return (
      <div className="px-4">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Home className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No Properties Yet</h3>
          <p className="text-sm text-gray-500">Add your first property to get started</p>
        </div>
      </div>
    );
  }

  const currentProperty = properties[currentIndex];
  const nextProperty = properties[currentIndex + 1];

  const handleNext = () => {
    if (currentIndex < properties.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  return (
    <div className="block md:hidden px-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-gray-900">Your Properties</h2>
        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
          {currentIndex + 1} / {properties.length}
        </span>
      </div>

      <div className="relative">
        <AnimatePresence mode="popLayout">
          {nextProperty && (
            <motion.div
              key={`next-${nextProperty.property_id}`}
              className="absolute inset-0 z-0"
              initial={{ scale: 0.95, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0.5 }}
            >
              <PropertyCard property={nextProperty} router={router} isNext />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="popLayout">
          <motion.div
            key={currentProperty.property_id}
            layoutId={currentProperty.property_id}
            className="relative z-10"
            initial={{ scale: 0.95, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: -50 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <PropertyCard 
              property={currentProperty} 
              router={router} 
              onNext={handleNext}
              onPrev={handlePrev}
              isFirst={currentIndex === 0}
              isLast={currentIndex === properties.length - 1}
            />
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-center gap-3 mt-4">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              currentIndex === 0
                ? "bg-gray-100 text-gray-300"
                : "bg-white shadow-lg border border-gray-100 text-gray-700 active:scale-90"
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => router.push(`/landlord/properties/${currentProperty.property_id}`)}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center shadow-lg active:scale-90 transition-transform"
          >
            <Eye className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={handleNext}
            disabled={currentIndex === properties.length - 1}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              currentIndex === properties.length - 1
                ? "bg-gray-100 text-gray-300"
                : "bg-white shadow-lg border border-gray-100 text-gray-700 active:scale-90"
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-3">
          Tap to view • Swipe to browse
        </p>
      </div>
    </div>
  );
}

function PropertyCard({
  property,
  router,
  isNext,
  onNext,
  onPrev,
  isFirst,
  isLast,
}: any) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, 0, 200], [0.5, 1, 0.5]);

  return (
    <motion.div
      style={{ x, rotate, opacity }}
      drag={!isNext ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={(_, info) => {
        if (info.offset.x < -100 && onNext && !isLast) {
          onNext();
        } else if (info.offset.x > 100 && onPrev && !isFirst) {
          onPrev();
        }
      }}
      className={`bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100 ${isNext ? "pointer-events-none" : "cursor-grab active:cursor-grabbing"}`}
    >
      <div
        onClick={() => !isNext && router.push(`/landlord/properties/${property.property_id}`)}
        className="relative aspect-[4/5] bg-gradient-to-br from-gray-100 to-gray-200"
      >
        {property.photos?.[0]?.photo_url ? (
          <Image
            src={property.photos[0].photo_url}
            alt={property.property_name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw"
            priority={!isNext}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
            <Home className="w-16 h-16 mb-2" />
            <span className="text-sm font-medium">No image</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h3 className="text-xl font-bold text-white mb-2">{property.property_name}</h3>
          <div className="flex items-start gap-2 text-white/90">
            <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
            <p className="text-sm">
              {[property.street, property.city, property.province].filter(Boolean).join(", ") || "Address not specified"}
            </p>
          </div>
        </div>

        {isNext && (
          <div className="absolute inset-0 bg-black/20" />
        )}
      </div>
    </motion.div>
  );
}
