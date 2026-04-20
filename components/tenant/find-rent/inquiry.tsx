"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Swal from "sweetalert2";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import ChatInquiry from "../chatInquiry";
import useAuthStore from "@/zustand/authStore";
import {
  FaCalendarAlt,
  FaClock,
  FaFileContract,
  FaComments,
  FaLock,
  FaCheckCircle,
} from "react-icons/fa";

type ViewType = "inquire" | "schedule" | "apply";

interface InquiryBookingProps {
  tenant_id: any;
  unit_id: any;
  rent_amount: any;
  landlord_id: any;
  initialView?: ViewType;
}

// ✅ Helper function to format date in local timezone
const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function InquiryBooking({
  tenant_id,
  unit_id,
  rent_amount,
  landlord_id,
  initialView = "inquire",
}: InquiryBookingProps) {
  const router = useRouter();
  const { user } = useAuthStore();

  const [view, setView] = useState<ViewType>(initialView);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [bookedDates, setBookedDates] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  const confirmRef = useRef<HTMLDivElement | null>(null);

  // Sync with initialView when it changes (for mobile sheet)
  useEffect(() => {
    setView(initialView);
  }, [initialView]);

  /* =====================================================
     AUTH GUARD
  ===================================================== */
  const requireAuth = (action: () => void) => {
    if (!user) {
      const callbackUrl = encodeURIComponent(
        window.location.pathname + window.location.search,
      );

      Swal.fire({
        icon: "info",
        title: "Login required",
        text: "Please log in to continue.",
        confirmButtonText: "Login",
        confirmButtonColor: "#3B82F6",
      }).then(() => {
        router.push(`/auth/login?callbackUrl=${callbackUrl}`);
      });

      return;
    }

    action();
  };

  /* =====================================================
     DATA
  ===================================================== */
  useEffect(() => {
    axios
      .get("/api/tenant/visits/booked-dates")
      .then((res) => setBookedDates(res.data.bookedDates || {}))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (view === "schedule" && selectedDate && selectedTime) {
      confirmRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedDate, selectedTime, view]);

  /* =====================================================
     HELPERS
  ===================================================== */
  const isTileDisabled = ({ date, view: calView }: any) => {
    if (calView !== "month") return false;
    // ✅ Use local date formatting for consistency
    const key = formatLocalDate(date);
    return bookedDates[key]?.count >= 1 || date < new Date();
  };

  const handleSchedule = async () => {
    requireAuth(async () => {
      if (!selectedDate || !selectedTime) {
        Swal.fire("Missing info", "Please select both date and time", "error");
        return;
      }

      try {
        setLoading(true);

        // ✅ FIXED: Use local date formatting to prevent timezone shift
        const visit_date = formatLocalDate(selectedDate);

        console.log("📅 Booking date:", visit_date); // Debug log

        await axios.post("/api/tenant/property-finder/schedVisitOnly", {
          tenant_id,
          unit_id,
          visit_date,
          visit_time: `${selectedTime}:00`,
        });

        await Swal.fire({
          icon: "success",
          title: "Visit Scheduled!",
          text: "The landlord will be notified.",
          confirmButtonColor: "#3B82F6",
        });

        // ⏳ Delay before redirect
        setTimeout(() => {
          router.push("/find-rent");
        }, 1200); // 1.2 seconds
      } catch {
        Swal.fire("Error", "Failed to schedule visit", "error");
      } finally {
        setLoading(false);
      }
    });
  };

  const handleApply = () => {
    requireAuth(() => {
      router.push(`/tenant/prospective/${unit_id}`);
    });
  };

  /* =====================================================
     UI
  ===================================================== */
  return (
    <>
      <style jsx global>{`
        .react-calendar {
          width: 100%;
          border-radius: 16px;
          border: 2px solid #e5e7eb;
          font-family: inherit;
        }
        .react-calendar__tile--active {
          background: linear-gradient(
            135deg,
            #3b82f6 0%,
            #10b981 100%
          ) !important;
          border-radius: 8px;
        }
        .react-calendar__tile:enabled:hover {
          background: #eff6ff;
          border-radius: 8px;
        }
        .react-calendar__navigation button:enabled:hover {
          background: #f3f4f6;
          border-radius: 8px;
        }
      `}</style>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
        {/* Price Header */}
        <div className="p-5 bg-gradient-to-r from-blue-600 to-emerald-600">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">
              ₱{rent_amount?.toLocaleString()}
            </span>
            <span className="text-white/80 text-base font-medium">/ month</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { id: "inquire", label: "Ask", icon: FaComments },
            { id: "schedule", label: "Visit", icon: FaCalendarAlt },
            { id: "apply", label: "Apply", icon: FaFileContract },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setView(id as ViewType)}
              className={`flex-1 py-4 font-semibold flex items-center justify-center gap-2 transition-all relative
                ${
                  view === id
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm sm:text-base">{label}</span>
              {view === id && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-emerald-500" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-5">
          {/* INQUIRE TAB - Original compact style */}
          {view === "inquire" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                <p className="font-semibold text-gray-900">Have questions?</p>
                <p className="text-sm text-gray-600">
                  Message the landlord directly.
                </p>
              </div>

              {!user ? (
                <button
                  onClick={() => requireAuth(() => {})}
                  className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold flex items-center justify-center gap-2"
                >
                  <FaLock /> Login to message
                </button>
              ) : (
                <ChatInquiry landlord_id={landlord_id} />
              )}
            </div>
          )}

          {/* SCHEDULE TAB - New color design */}
          {view === "schedule" && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200">
                <div className="flex items-start gap-3">
                  <FaClock className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">
                      Schedule a Visit
                    </p>
                    <p className="text-sm text-gray-600">
                      Pick a date and time to view this property.
                    </p>
                  </div>
                </div>
              </div>

              <Calendar
                value={selectedDate}
                onChange={(date) => setSelectedDate(date as Date)}
                tileDisabled={isTileDisabled}
                minDate={new Date()}
              />

              {selectedDate && (
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl text-base focus:border-purple-500 outline-none"
                >
                  <option value="">Select time (8AM – 8PM)</option>
                  {Array.from({ length: 25 }).map((_, i) => {
                    const hour = Math.floor(i / 2) + 8;
                    if (hour > 20) return null;
                    const minute = i % 2 === 0 ? "00" : "30";
                    return (
                      <option
                        key={`${hour}:${minute}`}
                        value={`${hour.toString().padStart(2, "0")}:${minute}`}
                      >
                        {`${hour}:${minute}`}
                      </option>
                    );
                  })}
                </select>
              )}

              <div ref={confirmRef}>
                <button
                  disabled={loading || !selectedDate || !selectedTime}
                  onClick={handleSchedule}
                  className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-white disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    "Scheduling..."
                  ) : (
                    <>
                      <FaCheckCircle className="w-4 h-4" />
                      Confirm Visit
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* APPLY TAB - New color design */}
          {view === "apply" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200">
                <div className="flex items-start gap-3">
                  <FaFileContract className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">
                      Ready to Apply?
                    </p>
                    <p className="text-sm text-gray-600">
                      Submit your application to rent this property.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
                <h4 className="font-semibold text-gray-900">
                  What you'll need:
                </h4>
                <ul className="space-y-2">
                  {[
                    "Valid government ID",
                    "Proof of income / employment",
                    "Personal references",
                  ].map((item, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 text-sm text-gray-700"
                    >
                      <FaCheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={handleApply}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-bold"
              >
                Start Application
              </button>

              <p className="text-xs text-gray-500 text-center">
                Accurate information is required to proceed.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
