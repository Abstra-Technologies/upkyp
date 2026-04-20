"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Heart,
  Share2,
  MapPin,
  Maximize2,
  Sofa,
  ChevronLeft,
  ChevronRight,
  Eye,
  BadgeCheck,
  X,
  Copy,
  Check,
} from "lucide-react";
import { Unit } from "@/types/types";
import { formatCurrency, formatLocation, formatUnitStyle } from "./utils";

interface UnitCardProps {
  unit: Unit;
  onClick: () => void;
  index?: number;
  variant?: "default" | "compact" | "horizontal";
}

export default function UnitCard({
  unit,
  onClick,
  index = 0,
  variant = "default",
}: UnitCardProps) {
  const [currentImage, setCurrentImage] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchDelta, setTouchDelta] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const images = unit.photos?.length > 0 ? unit.photos : [];
  const hasMultipleImages = images.length > 1;

  // Preload next image
  useEffect(() => {
    if (hasMultipleImages && images.length > 1) {
      const nextIndex = (currentImage + 1) % images.length;
      const img = new window.Image();
      img.src = images[nextIndex];
    }
  }, [currentImage, images, hasMultipleImages]);

  // Touch handlers for image carousel
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!hasMultipleImages) return;
      setTouchStart(e.touches[0].clientX);
      setIsSwiping(true);
    },
    [hasMultipleImages]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isSwiping) return;
      const delta = e.touches[0].clientX - touchStart;
      const maxDelta = 100;
      setTouchDelta(Math.max(-maxDelta, Math.min(maxDelta, delta)));
    },
    [isSwiping, touchStart]
  );

  const handleTouchEnd = useCallback(() => {
    if (!isSwiping) return;
    if (touchDelta < -40) {
      setCurrentImage((prev) => (prev + 1) % images.length);
    } else if (touchDelta > 40) {
      setCurrentImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    }
    setIsSwiping(false);
    setTouchDelta(0);
  }, [isSwiping, touchDelta, images.length]);

  const handlePrevImage = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setCurrentImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    },
    [images.length]
  );

  const handleNextImage = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setCurrentImage((prev) => (prev + 1) % images.length);
    },
    [images.length]
  );

  const handleFavorite = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite((prev) => !prev);
  }, []);

  const handleShare = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowShare(true);
  }, []);

  const handleCopyLink = useCallback(async () => {
    const url = `${window.location.origin}/find-rent/${unit.property_id}/${unit.unit_id}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setShowShare(false);
    }, 1500);
  }, [unit]);

  const unitStyle = formatUnitStyle(unit.unit_style);

  // Compact variant for list views
  if (variant === "compact") {
    return (
      <article
        onClick={onClick}
        className="flex items-center gap-4 p-3 bg-white rounded-2xl border border-slate-200 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/5 cursor-pointer transition-all duration-300"
      >
        <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100">
          {images[0] ? (
            <Image
              src={images[0]}
              alt={unit.unit_name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <MapPin className="w-6 h-6 text-slate-300" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-900 truncate">
            {unit.unit_name}
          </h3>
          <p className="text-sm text-slate-500 truncate">
            {unit.property_name}
          </p>
          <p className="font-bold text-emerald-600 mt-1">
            {formatCurrency(Number(unit.rent_amount))}
            <span className="text-xs font-normal text-slate-400">/mo</span>
          </p>
        </div>
      </article>
    );
  }

  return (
    <>
      <article
        ref={containerRef}
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setIsPressed(false);
        }}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        className="group relative bg-white rounded-3xl overflow-hidden cursor-pointer flex flex-col h-full"
        style={{
          boxShadow: isHovered
            ? "0 25px 50px -12px rgba(0,0,0,0.12), 0 0 0 1px rgba(16,185,129,0.1)"
            : "0 4px 6px -1px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.03)",
          transform: isPressed
            ? "scale(0.98)"
            : isHovered
            ? "scale(1.02) translateY(-4px)"
            : "scale(1)",
          transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        {/* Image Carousel */}
        <div
          className="relative aspect-[4/3] overflow-hidden bg-slate-100"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {images.length > 0 ? (
            <div
              className="relative w-full h-full"
              style={{
                transform: isSwiping
                  ? `translateX(${touchDelta}px)`
                  : undefined,
                transition: isSwiping
                  ? "none"
                  : "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            >
              <Image
                src={images[currentImage]}
                alt={`${unit.unit_name} - Image ${currentImage + 1}`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className={`object-cover transition-all duration-700 ${
                  isHovered ? "scale-110" : "scale-100"
                } ${imageLoaded ? "opacity-100" : "opacity-0"}`}
                onLoad={() => setImageLoaded(true)}
                priority={index < 6}
              />
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 animate-pulse" />
              )}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
              <div className="text-center">
                <MapPin className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-sm text-slate-400 mt-2">No image</p>
              </div>
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Top Actions */}
          <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
            <div className="flex flex-col gap-2">
              {unit.is_verified && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-full shadow-lg">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  Verified
                </span>
              )}
              {unitStyle && (
                <span className="px-3 py-1.5 bg-white/95 backdrop-blur-sm text-slate-700 text-xs font-semibold rounded-full shadow-lg">
                  {unitStyle}
                </span>
              )}
            </div>

            <div
              className={`flex items-center gap-2 transition-all duration-300 ${
                isHovered
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 -translate-y-2"
              }`}
            >
              <button
                type="button"
                onClick={handleFavorite}
                className={`p-2.5 rounded-full backdrop-blur-sm transition-all duration-200 active:scale-90 ${
                  isFavorite
                    ? "bg-rose-500 text-white"
                    : "bg-white/90 text-slate-600 hover:bg-white"
                }`}
              >
                <Heart
                  className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`}
                />
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="p-2.5 rounded-full bg-white/90 backdrop-blur-sm text-slate-600 hover:bg-white transition-all duration-200 active:scale-90"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Image Navigation */}
          {hasMultipleImages && (
            <>
              <button
                type="button"
                onClick={handlePrevImage}
                className={`absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 backdrop-blur-sm shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ${
                  isHovered
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 -translate-x-4"
                }`}
              >
                <ChevronLeft className="w-5 h-5 text-slate-700" />
              </button>
              <button
                type="button"
                onClick={handleNextImage}
                className={`absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 backdrop-blur-sm shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ${
                  isHovered
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 translate-x-4"
                }`}
              >
                <ChevronRight className="w-5 h-5 text-slate-700" />
              </button>

              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-2 bg-black/40 backdrop-blur-md rounded-full">
                {images.slice(0, 5).map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImage(idx);
                    }}
                    className={`transition-all duration-300 rounded-full ${
                      idx === currentImage
                        ? "w-6 h-2 bg-white"
                        : "w-2 h-2 bg-white/50 hover:bg-white/75"
                    }`}
                  />
                ))}
                {images.length > 5 && (
                  <span className="text-white/80 text-xs font-medium ml-1">
                    +{images.length - 5}
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col p-5">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <MapPin className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-medium truncate">
              {formatLocation(unit.city, unit.province)}
            </span>
          </div>

          <h3 className="font-bold text-lg text-slate-900 mb-1 line-clamp-1 group-hover:text-emerald-700 transition-colors">
            {unit.unit_name}
          </h3>
          <p className="text-sm text-slate-500 mb-4 truncate">
            {unit.property_name}
          </p>

          <div className="flex items-center gap-4 mb-4">
            {unit.unit_size > 0 && (
              <div className="flex items-center gap-1.5 text-slate-600">
                <Maximize2 className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {unit.unit_size} sqm
                </span>
              </div>
            )}
            {unit.furnish && (
              <div className="flex items-center gap-1.5 text-slate-600">
                <Sofa className="w-4 h-4" />
                <span className="text-sm font-medium capitalize">
                  {unit.furnish.replace(/_/g, " ")}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1" />

          <div className="flex items-end justify-between pt-4 border-t border-slate-100">
            <div>
              <p className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                {formatCurrency(Number(unit.rent_amount))}
              </p>
              <p className="text-sm text-slate-400 font-medium">per month</p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-emerald-600/25 hover:shadow-xl hover:shadow-emerald-600/30 hover:scale-105 active:scale-95 transition-all duration-300"
            >
              <Eye className="w-4 h-4" />
              View
            </button>
          </div>
        </div>
      </article>

      {/* Share Modal */}
      {showShare && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowShare(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">Share</h3>
              <button
                type="button"
                onClick={() => setShowShare(false)}
                className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className={`w-full flex items-center justify-center gap-3 p-4 rounded-2xl font-semibold transition-all duration-300 ${
                copied
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  Copy Link
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
