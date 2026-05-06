"use client";

import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  MapPin,
  CalendarDays,
  UserCheck,
  CalendarX,
  List,
  Grid3X3,
  X,
  Plus,
  Edit3,
  Trash2,
  AlertCircle,
} from "lucide-react";
import axios from "axios";
import useAuthStore from "@/zustand/authStore";

// ✅ Enable UTC plugin
dayjs.extend(utc);

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const BookingAppointment = () => {
  const { fetchSession, user } = useAuthStore();

  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(dayjs());

  const [showDisapprovalModal, setShowDisapprovalModal] = useState(false);
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [selectedVisitId, setSelectedVisitId] = useState<number | null>(null);
  const [disapprovalReason, setDisapprovalReason] = useState("");

  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [calendarItems, setCalendarItems] = useState<any[]>([]);
  const [itemForm, setItemForm] = useState({
    title: "",
    description: "",
    item_type: "task",
    category: "",
    item_date: "",
    item_time: "",
    end_date: "",
    end_time: "",
    all_day: false,
    priority: "medium",
    reminder: "none",
    repeat_rule: "none",
    location: "",
    meeting_link: "",
    color: "",
    property_id: "",
    unit_id: "",
  });

  const [properties, setProperties] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<"calendar" | "list">("calendar");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "task" | "event" | "reminder">("all");

  useEffect(() => {
    if (!user) {
      fetchSession();
      return;
    }
    if (user?.landlord_id) {
      fetchVisits();
      fetchCalendarItems();
      fetchProperties();
    }
  }, [user]);

  useEffect(() => {
    if (user?.landlord_id) {
      fetchCalendarItems();
    }
  }, [currentMonth]);

  const fetchVisits = async () => {
    try {
      const res = await axios.get(
        `/api/landlord/properties/getAllBookingVisits?landlord_id=${user?.landlord_id}`,
      );
      setVisits(res.data || []);
    } catch (err) {
      console.error("Error fetching visits:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCalendarItems = async () => {
    try {
      const startOfMonth = currentMonth.startOf("month").startOf("week").format("YYYY-MM-DD");
      const endOfMonth = currentMonth.endOf("month").endOf("week").format("YYYY-MM-DD");
      const res = await axios.get(
        `/api/landlord/calendar/events?landlord_id=${user?.landlord_id}&startDate=${startOfMonth}&endDate=${endOfMonth}`,
      );
      setCalendarItems(res.data.calendarItems || []);
    } catch (err) {
      console.error("Error fetching calendar items:", err);
    }
  };

  const fetchProperties = async () => {
    try {
      const res = await axios.get(
        `/api/landlord/${user?.landlord_id}/properties`,
      );
      setProperties(res.data.data || []);
    } catch (err) {
      console.error("Error fetching properties:", err);
    }
  };

  const fetchUnits = async (propertyId: string) => {
    try {
      const res = await axios.get(
        `/api/unitListing/getUnitListings?property_id=${propertyId}`,
      );
      setUnits(res.data || []);
    } catch (err) {
      console.error("Error fetching units:", err);
      setUnits([]);
    }
  };

  // ✅ FIXED: Use UTC to prevent timezone shift
  const visitsByDate = visits.reduce<Record<string, any[]>>((acc, visit) => {
    const key = dayjs.utc(visit.visit_date).format("YYYY-MM-DD");
    acc[key] = acc[key] || [];
    acc[key].push(visit);
    return acc;
  }, {});

  const statusCounts = visits.reduce<Record<string, number>>((acc, visit) => {
    acc[visit.status] = (acc[visit.status] || 0) + 1;
    return acc;
  }, {});

  const selectedDateVisits =
    visitsByDate[selectedDate.format("YYYY-MM-DD")] || [];

  const filteredVisits = visits.filter((visit) => {
    const matchesSearch =
      `${visit.tenant_first_name} ${visit.tenant_last_name}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      visit.property_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || visit.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredItems = (typeFilter === "all"
    ? calendarItems
    : calendarItems.filter((item) => item.item_type === typeFilter)
  ).filter((item) => {
    const matchesSearch =
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.property_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const updateStatus = async (
    visit_id: number,
    status: string,
    reason?: string,
  ) => {
    await axios.put("/api/landlord/properties/updateBookingStatus", {
      visit_id,
      status,
      reason,
    });
    setVisits((prev) =>
      prev.map((v) =>
        v.visit_id === visit_id
          ? { ...v, status, disapproval_reason: reason }
          : v,
      ),
    );
  };

  const handleCreateItem = async () => {
    try {
      await axios.post("/api/landlord/calendar/events", {
        landlord_id: user?.landlord_id,
        ...itemForm,
        item_date: itemForm.item_date || selectedDate.format("YYYY-MM-DD"),
        all_day: itemForm.all_day ? 1 : 0,
      });
      setShowItemModal(false);
      resetItemForm();
      fetchCalendarItems();
    } catch (err) {
      console.error("Error creating item:", err);
    }
  };

  const handleUpdateItem = async () => {
    try {
      await axios.put("/api/landlord/calendar/events", {
        item_id: editingItem.item_id,
        landlord_id: user?.landlord_id,
        ...itemForm,
        all_day: itemForm.all_day ? 1 : 0,
      });
      setShowItemModal(false);
      setEditingItem(null);
      resetItemForm();
      fetchCalendarItems();
    } catch (err) {
      console.error("Error updating item:", err);
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      await axios.delete(
        `/api/landlord/calendar/events?item_id=${itemId}&landlord_id=${user?.landlord_id}`,
      );
      fetchCalendarItems();
    } catch (err) {
      console.error("Error deleting item:", err);
    }
  };

  const openItemModal = (item?: any) => {
    if (item) {
      setEditingItem(item);
      setItemForm({
        title: item.title || "",
        description: item.description || "",
        item_type: item.item_type || "task",
        category: item.category || "",
        item_date: dayjs.utc(item.item_date).format("YYYY-MM-DD"),
        item_time: item.item_time || "",
        end_date: item.end_date ? dayjs.utc(item.end_date).format("YYYY-MM-DD") : "",
        end_time: item.end_time || "",
        all_day: item.all_day === 1,
        priority: item.priority || "medium",
        reminder: item.reminder || "none",
        repeat_rule: item.repeat_rule || "none",
        location: item.location || "",
        meeting_link: item.meeting_link || "",
        color: item.color || "",
        property_id: item.property_id || "",
        unit_id: item.unit_id || "",
      });
      if (item.property_id) fetchUnits(item.property_id);
    } else {
      setEditingItem(null);
      resetItemForm();
      setItemForm((prev) => ({
        ...prev,
        item_date: selectedDate.format("YYYY-MM-DD"),
      }));
    }
    setShowItemModal(true);
  };

  const resetItemForm = () => {
    setItemForm({
      title: "",
      description: "",
      item_type: "task",
      category: "",
      item_date: "",
      item_time: "",
      end_date: "",
      end_time: "",
      all_day: false,
      priority: "medium",
      reminder: "none",
      repeat_rule: "none",
      location: "",
      meeting_link: "",
      color: "",
      property_id: "",
      unit_id: "",
    });
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
      pending: "bg-amber-100 text-amber-700 border-amber-200",
      approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
      disapproved: "bg-orange-100 text-orange-700 border-orange-200",
      cancelled: "bg-red-100 text-red-700 border-red-200",
      in_progress: "bg-blue-100 text-blue-700 border-blue-200",
      completed: "bg-green-100 text-green-700 border-green-200",
      dismissed: "bg-gray-100 text-gray-700 border-gray-200",
    };
    return (
      <span
        className={`px-2.5 py-1 text-xs font-semibold rounded-lg border ${styles[status] || styles.pending}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")}
      </span>
    );
  };

  const ItemTypeBadge = ({ type }: { type: string }) => {
    const styles: Record<string, string> = {
      task: "bg-blue-100 text-blue-700 border-blue-200",
      event: "bg-purple-100 text-purple-700 border-purple-200",
      reminder: "bg-amber-100 text-amber-700 border-amber-200",
    };
    return (
      <span
        className={`px-2.5 py-1 text-xs font-semibold rounded-lg border ${styles[type] || styles.task}`}
      >
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    );
  };

  const PriorityBadge = ({ priority }: { priority: string }) => {
    const styles: Record<string, string> = {
      low: "bg-slate-100 text-slate-600",
      medium: "bg-amber-100 text-amber-600",
      high: "bg-red-100 text-red-600",
    };
    return (
      <span
        className={`px-2 py-0.5 text-[10px] font-semibold rounded ${styles[priority] || styles.low}`}
      >
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  };

  const handleItemStatusUpdate = async (itemId: number, status: string) => {
    try {
      await axios.put("/api/landlord/calendar/events", {
        item_id: itemId,
        landlord_id: user?.landlord_id,
        status,
      });
      fetchCalendarItems();
    } catch (err) {
      console.error("Error updating item status:", err);
    }
  };

  const CalendarItemCard = ({ item, compact = false }: any) => (
    <motion.div
      variants={fadeInUp}
      className="bg-white border border-gray-100 rounded-xl p-3 md:p-4 hover:shadow-lg hover:border-blue-200 transition-all duration-200"
    >
      <div className="flex justify-between gap-2 md:gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900 text-sm md:text-base">
              {item.title}
            </p>
            <ItemTypeBadge type={item.item_type} />
            <PriorityBadge priority={item.priority} />
          </div>
          {item.description && (
            <p className="text-[10px] md:text-xs text-gray-500 mt-1 line-clamp-2">
              {item.description}
            </p>
          )}
          <p className="text-[10px] md:text-xs text-gray-600 mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {dayjs.utc(item.item_date).format("MMM D, YYYY")}
            {item.all_day ? " • All day" : item.item_time && ` • ${item.item_time}`}
          </p>
          {item.property_name && (
            <p className="text-[10px] md:text-xs text-gray-500 flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3" />
              {item.property_name}
              {item.unit_name && ` • ${item.unit_name}`}
            </p>
          )}
          {item.location && (
            <p className="text-[10px] md:text-xs text-gray-500 flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3" />
              {item.location}
            </p>
          )}
          {item.meeting_link && (
            <p className="text-[10px] md:text-xs text-blue-500 mt-1">
              Meeting link available
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          {compact ? (
            <StatusBadge status={item.status} />
          ) : (
            <select
              value={item.status}
              onChange={(e) => handleItemStatusUpdate(item.item_id, e.target.value)}
              className={`px-2 py-1 text-xs font-semibold rounded-lg border cursor-pointer ${
                item.status === "completed"
                  ? "bg-green-100 text-green-700 border-green-200"
                  : item.status === "in_progress"
                    ? "bg-blue-100 text-blue-700 border-blue-200"
                    : item.status === "dismissed"
                      ? "bg-gray-100 text-gray-700 border-gray-200"
                      : "bg-amber-100 text-amber-700 border-amber-200"
              }`}
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="dismissed">Dismissed</option>
            </select>
          )}
          {!compact && (
            <div className="flex gap-1.5">
              <button
                onClick={() => openItemModal(item)}
                className="p-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <Edit3 className="w-4 h-4 text-blue-600" />
              </button>
              <button
                onClick={() => handleDeleteItem(item.item_id)}
                className="p-2 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  const VisitCard = ({ visit, compact = false }: any) => (
    <motion.div
      variants={fadeInUp}
      className="bg-white border border-gray-100 rounded-xl p-3 md:p-4 hover:shadow-lg hover:border-blue-200 transition-all duration-200"
    >
      <div className="flex justify-between gap-2 md:gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm md:text-base">
            {visit.tenant_first_name} {visit.tenant_last_name}
          </p>
          <p className="text-[10px] md:text-xs text-gray-500 flex items-center gap-1 mt-1">
            <MapPin className="w-3 h-3" />
            {visit.property_name} • {visit.unit_name}
          </p>
          {/* ✅ FIXED: Use UTC to display correct date */}
          <p className="text-[10px] md:text-xs text-gray-600 mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {dayjs.utc(visit.visit_date).format("MMM D, YYYY")} •{" "}
            {visit.visit_time}
          </p>
          {visit.disapproval_reason && (
            <p className="text-[10px] md:text-xs text-orange-600 mt-2 bg-orange-50 px-2 py-1 rounded-lg">
              Reason: {visit.disapproval_reason}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={visit.status} />

          {visit.status === "pending" && !compact && (
            <div className="flex gap-1.5">
              <button
                onClick={() => updateStatus(visit.visit_id, "approved")}
                className="p-2 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </button>
              <button
                onClick={() => {
                  setSelectedVisitId(visit.visit_id);
                  setShowDisapprovalModal(true);
                }}
                className="p-2 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
              >
                <XCircle className="w-4 h-4 text-red-600" />
              </button>
            </div>
          )}

          {visit.status === "approved" && !compact && (
            <button
              onClick={() => {
                setSelectedVisitId(visit.visit_id);
                setShowCancellationModal(true);
              }}
              className="p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <CalendarX className="w-4 h-4 text-gray-600" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );

  const itemsByDate = filteredItems.reduce<Record<string, any[]>>((acc, item) => {
    const key = dayjs.utc(item.item_date).format("YYYY-MM-DD");
    acc[key] = acc[key] || [];
    acc[key].push(item);
    return acc;
  }, {});

  const selectedDateItems = itemsByDate[selectedDate.format("YYYY-MM-DD")] || [];

  const CalendarView = () => {
    const start = currentMonth.startOf("month").startOf("week");
    const end = currentMonth.endOf("month").endOf("week");
    const days = [];
    let d = start;

    while (d.isBefore(end) || d.isSame(end, "day")) {
      days.push(d);
      d = d.add(1, "day");
    }

    return (
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
          <button
            onClick={() => setCurrentMonth(currentMonth.subtract(1, "month"))}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="font-bold text-gray-900">
            {currentMonth.format("MMMM YYYY")}
          </h2>
          <button
            onClick={() => setCurrentMonth(currentMonth.add(1, "month"))}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="grid grid-cols-7 p-3 text-xs font-semibold text-gray-500 text-center border-b border-gray-100">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 p-2 md:p-3">
          {days.map((date) => {
            const key = date.format("YYYY-MM-DD");
            const dayVisits = visitsByDate[key] || [];
            const isSelected = date.isSame(selectedDate, "day");
            const isToday = date.isSame(dayjs(), "day");
            const isCurrentMonth = date.month() === currentMonth.month();

            return (
              <button
                key={key}
                onClick={() => setSelectedDate(date)}
                className={`p-1 md:p-2 min-h-[36px] md:min-h-[70px] border rounded-lg md:rounded-xl transition-all duration-200 text-left ${
                  isSelected
                    ? "bg-gradient-to-br from-blue-50 to-emerald-50 border-blue-300 shadow-sm"
                    : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                } ${!isCurrentMonth ? "opacity-40" : ""}`}
              >
                <span
                  className={`text-[10px] md:text-sm font-medium ${
                    isToday
                      ? "w-4 h-4 md:w-7 md:h-7 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-full flex items-center justify-center"
                      : "text-gray-700"
                  }`}
                >
                  {date.date()}
                </span>

                {dayVisits.length > 0 && (
                  <div className="mt-0.5 md:mt-1.5 flex flex-wrap gap-0.5 md:gap-1">
                    {dayVisits.slice(0, 2).map((v, i) => (
                      <div
                        key={i}
                        className={`w-1 h-1 md:w-2 md:h-2 rounded-full ${
                          v.status === "approved"
                            ? "bg-emerald-500"
                            : v.status === "pending"
                              ? "bg-amber-500"
                              : "bg-gray-400"
                        }`}
                      />
                    ))}
                    {dayVisits.length > 2 && (
                      <span className="text-[7px] md:text-[10px] text-gray-500">
                        +{dayVisits.length - 2}
                      </span>
                    )}
                  </div>
                )}

                {(itemsByDate[key] || []).length > 0 && (
                  <div className="mt-0.5 md:mt-1 flex flex-wrap gap-0.5 md:gap-1">
                    {(itemsByDate[key] || []).slice(0, 2).map((t: any, i: number) => (
                      <div
                        key={i}
                        className={`w-1.5 h-1.5 md:w-2.5 md:h-2.5 rounded-sm ${
                          t.item_type === "task"
                            ? "bg-blue-500"
                            : t.item_type === "event"
                              ? "bg-purple-500"
                              : "bg-amber-500"
                        }`}
                      />
                    ))}
                    {(itemsByDate[key] || []).length > 2 && (
                      <span className="text-[7px] md:text-[10px] text-gray-500">
                        +{(itemsByDate[key] || []).length - 2}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 pt-20 pb-5 px-4 md:px-8">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse" />
            <div>
              <div className="h-7 bg-gray-200 rounded w-32 animate-pulse mb-2" />
              <div className="h-4 bg-gray-200 rounded w-48 animate-pulse" />
            </div>
          </div>
        </div>
        <div className="px-4 md:px-8 pt-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-24 bg-gray-200 rounded-xl animate-pulse"
              />
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-gray-200 pt-3 pb-3 md:pt-6 md:pb-5 px-4 md:px-8 lg:px-12 xl:px-16"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">My Calendar</h1>
              <p className="text-gray-600 text-sm">
                Manage property visit requests and scheduled tasks
              </p>
            </div>
          </div>
          <button
            onClick={() => openItemModal()}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-xl font-medium text-sm hover:shadow-lg transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-1.5 md:gap-2">
          <div className="bg-amber-50 rounded-lg border border-amber-200 p-2 md:p-3">
            <div className="flex flex-col items-center text-center">
              <Clock className="w-3 h-3 md:w-4 md:h-4 text-amber-600 mb-1" />
              <span className="text-base md:text-lg font-bold text-amber-700">
                {statusCounts.pending || 0}
              </span>
              <p className="text-[8px] md:text-[10px] text-amber-600 mt-0.5">Pending</p>
            </div>
          </div>
          <div className="bg-emerald-50 rounded-lg border border-emerald-200 p-2 md:p-3">
            <div className="flex flex-col items-center text-center">
              <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-emerald-600 mb-1" />
              <span className="text-base md:text-lg font-bold text-emerald-700">
                {statusCounts.approved || 0}
              </span>
              <p className="text-[8px] md:text-[10px] text-emerald-600 mt-0.5">Approved</p>
            </div>
          </div>
          <div className="bg-orange-50 rounded-lg border border-orange-200 p-2 md:p-3">
            <div className="flex flex-col items-center text-center">
              <XCircle className="w-3 h-3 md:w-4 md:h-4 text-orange-600 mb-1" />
              <span className="text-base md:text-lg font-bold text-orange-700">
                {statusCounts.disapproved || 0}
              </span>
              <p className="text-[8px] md:text-[10px] text-orange-600 mt-0.5">Declined</p>
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-2 md:p-3">
            <div className="flex flex-col items-center text-center">
              <CalendarDays className="w-3 h-3 md:w-4 md:h-4 text-blue-600 mb-1" />
              <span className="text-base md:text-lg font-bold text-blue-700">
                {visitsByDate[dayjs().format("YYYY-MM-DD")]?.length || 0}
              </span>
              <p className="text-[8px] md:text-[10px] text-blue-600 mt-0.5">Today</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="px-4 md:px-8 lg:px-12 xl:px-16 py-5 pb-24">
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5">
          <button
            onClick={() => setActiveTab("calendar")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === "calendar"
                ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Grid3X3 className="w-4 h-4" />
            Calendar View
          </button>
          <button
            onClick={() => setActiveTab("list")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === "list"
                ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <List className="w-4 h-4" />
            List View
          </button>
        </div>

        {/* Type Filter */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {(["all", "task", "event", "reminder"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                typeFilter === t
                  ? t === "task"
                    ? "bg-blue-50 border-blue-300 text-blue-700"
                    : t === "event"
                      ? "bg-purple-50 border-purple-300 text-purple-700"
                      : t === "reminder"
                        ? "bg-amber-50 border-amber-300 text-amber-700"
                        : "bg-gradient-to-r from-blue-600 to-emerald-600 border-transparent text-white"
                  : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
          {/* Main Area */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {activeTab === "calendar" && (
              <>
                <CalendarView />

                {/* Selected Date Visits */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
                >
                  <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900">
                        {selectedDate.format("MMMM D, YYYY")}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {selectedDateVisits.length} visit{selectedDateVisits.length !== 1 ? "s" : ""}
                        {selectedDateItems.length > 0 && `, ${selectedDateItems.length} item${selectedDateItems.length !== 1 ? "s" : ""}`}{" "}
                        scheduled
                      </p>
                    </div>
                    <button
                      onClick={() => openItemModal()}
                      className="p-2 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-lg hover:shadow-md transition-all"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-4 space-y-3">
                    {selectedDateVisits.length === 0 && selectedDateItems.length === 0 ? (
                      <div className="text-center py-8">
                        <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">
                          No visits or items scheduled for this day
                        </p>
                      </div>
                    ) : (
                      <>
                        {selectedDateVisits.map((v) => (
                          <VisitCard key={v.visit_id} visit={v} />
                        ))}
                        {selectedDateItems.map((item) => (
                          <CalendarItemCard key={item.item_id} item={item} />
                        ))}
                      </>
                    )}
                  </div>
                </motion.div>
              </>
            )}

            {activeTab === "list" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
              >
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm"
                      placeholder="Search visits and tasks..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="disapproved">Declined</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="dismissed">Dismissed</option>
                  </select>
                </div>

                <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
                  {filteredVisits.length === 0 && filteredItems.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No visits or items found</p>
                    </div>
                  ) : (
                    <>
                      {filteredVisits.map((v) => (
                        <VisitCard key={v.visit_id} visit={v} />
                      ))}
                      {filteredItems.map((item) => (
                        <CalendarItemCard key={item.item_id} item={item} />
                      ))}
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar - Desktop Only */}
          <div className="hidden lg:block lg:col-span-1 space-y-6">
            {/* Pending Requests */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
            >
              <div className="p-4 border-b border-gray-100 bg-amber-50 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-gray-900">Pending Requests</h3>
              </div>
              <div className="p-4 space-y-3">
                {visits.filter((v) => v.status === "pending").length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No pending requests
                  </p>
                ) : (
                  visits
                    .filter((v) => v.status === "pending")
                    .slice(0, 3)
                    .map((v) => (
                      <VisitCard key={v.visit_id} visit={v} compact />
                    ))
                )}
              </div>
            </motion.div>

            {/* Upcoming Visits */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
            >
              <div className="p-4 border-b border-gray-100 bg-emerald-50 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-gray-900">Upcoming Visits</h3>
              </div>
              <div className="p-4 space-y-3">
                {visits.filter(
                  (v) =>
                    v.status === "approved" &&
                    dayjs.utc(v.visit_date).isAfter(dayjs()),
                ).length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No upcoming visits
                  </p>
                ) : (
                  visits
                    .filter(
                      (v) =>
                        v.status === "approved" &&
                        dayjs.utc(v.visit_date).isAfter(dayjs()),
                    )
                    .slice(0, 3)
                    .map((v) => (
                      <VisitCard key={v.visit_id} visit={v} compact />
                    ))
                )}
              </div>
            </motion.div>

            {/* Upcoming Items */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
            >
              <div className="p-4 border-b border-gray-100 bg-blue-50 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900">Upcoming Tasks & Events</h3>
              </div>
              <div className="p-4 space-y-3">
                {calendarItems.filter(
                  (item) =>
                    (item.status === "pending" || item.status === "in_progress") &&
                    dayjs.utc(item.item_date).isAfter(dayjs().startOf("day")),
                ).length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No upcoming items
                  </p>
                ) : (
                  calendarItems
                    .filter(
                      (item) =>
                        (item.status === "pending" || item.status === "in_progress") &&
                        dayjs.utc(item.item_date).isAfter(dayjs().startOf("day")),
                    )
                    .slice(0, 3)
                    .map((item) => (
                      <CalendarItemCard key={item.item_id} item={item} compact />
                    ))
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Disapproval Modal */}
      <AnimatePresence>
        {showDisapprovalModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  Decline Visit
                </h2>
                <button
                  onClick={() => setShowDisapprovalModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <textarea
                className="w-full border border-gray-200 rounded-xl p-3 text-sm mb-4"
                rows={4}
                placeholder="Reason for declining..."
                value={disapprovalReason}
                onChange={(e) => setDisapprovalReason(e.target.value)}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDisapprovalModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    updateStatus(
                      selectedVisitId!,
                      "disapproved",
                      disapprovalReason,
                    );
                    setShowDisapprovalModal(false);
                    setDisapprovalReason("");
                  }}
                  className="flex-1 py-2.5 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-medium"
                >
                  Decline Visit
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancellation Modal */}
      <AnimatePresence>
        {showCancellationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
            >
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                Cancel Visit
              </h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to cancel this visit?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancellationModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
                >
                  Keep Visit
                </button>
                <button
                  onClick={() => {
                    updateStatus(selectedVisitId!, "cancelled");
                    setShowCancellationModal(false);
                  }}
                  className="flex-1 py-2.5 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-medium"
                >
                  Cancel Visit
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Item Modal */}
      <AnimatePresence>
        {showItemModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  {editingItem ? "Edit Item" : "Add New Item"}
                </h2>
                <button
                  onClick={() => {
                    setShowItemModal(false);
                    setEditingItem(null);
                    resetItemForm();
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Type <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["task", "event", "reminder"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setItemForm({ ...itemForm, item_type: type })}
                        className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
                          itemForm.item_type === type
                            ? type === "task"
                              ? "bg-blue-50 border-blue-300 text-blue-700"
                              : type === "event"
                                ? "bg-purple-50 border-purple-300 text-purple-700"
                                : "bg-amber-50 border-amber-300 text-amber-700"
                            : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm"
                    placeholder={
                      itemForm.item_type === "task"
                        ? "Task title..."
                        : itemForm.item_type === "event"
                          ? "Event name..."
                          : "Reminder..."
                    }
                    value={itemForm.title}
                    onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm"
                    rows={3}
                    placeholder="Description..."
                    value={itemForm.description}
                    onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <AlertCircle className="w-3 h-3 inline mr-1" />
                      Priority
                    </label>
                    <select
                      className="w-full border border-gray-200 rounded-xl p-3 text-sm"
                      value={itemForm.priority}
                      onChange={(e) => setItemForm({ ...itemForm, priority: e.target.value })}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Clock className="w-3 h-3 inline mr-1" />
                      Duration
                    </label>
                    <select
                      className="w-full border border-gray-200 rounded-xl p-3 text-sm"
                      value={itemForm.all_day ? "all_day" : "timed"}
                      onChange={(e) => setItemForm({ ...itemForm, all_day: e.target.value === "all_day" })}
                    >
                      <option value="timed">Timed</option>
                      <option value="all_day">All day</option>
                    </select>
                  </div>
                </div>

                {!itemForm.all_day && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        className="w-full border border-gray-200 rounded-xl p-3 text-sm"
                        value={itemForm.item_date}
                        onChange={(e) => setItemForm({ ...itemForm, item_date: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Time
                      </label>
                      <input
                        type="time"
                        className="w-full border border-gray-200 rounded-xl p-3 text-sm"
                        value={itemForm.item_time}
                        onChange={(e) => setItemForm({ ...itemForm, item_time: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {itemForm.all_day && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      className="w-full border border-gray-200 rounded-xl p-3 text-sm"
                      value={itemForm.item_date}
                      onChange={(e) => setItemForm({ ...itemForm, item_date: e.target.value })}
                    />
                  </div>
                )}

                {itemForm.item_type === "event" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        className="w-full border border-gray-200 rounded-xl p-3 text-sm"
                        value={itemForm.end_date}
                        onChange={(e) => setItemForm({ ...itemForm, end_date: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Time
                      </label>
                      <input
                        type="time"
                        className="w-full border border-gray-200 rounded-xl p-3 text-sm"
                        value={itemForm.end_time}
                        onChange={(e) => setItemForm({ ...itemForm, end_time: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Property
                  </label>
                  <select
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm"
                    value={itemForm.property_id}
                    onChange={(e) => {
                      setItemForm({ ...itemForm, property_id: e.target.value, unit_id: "" });
                      setUnits([]);
                      if (e.target.value) fetchUnits(e.target.value);
                    }}
                  >
                    <option value="">Select property (optional)</option>
                    {Array.isArray(properties) && properties.map((p: any) => (
                      <option key={p.property_id} value={p.property_id}>
                        {p.property_name}
                      </option>
                    ))}
                  </select>
                </div>

                {itemForm.property_id && units.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit
                    </label>
                    <select
                      className="w-full border border-gray-200 rounded-xl p-3 text-sm"
                      value={itemForm.unit_id}
                      onChange={(e) => setItemForm({ ...itemForm, unit_id: e.target.value })}
                    >
                      <option value="">Select unit (optional)</option>
                      {Array.isArray(units) && units.map((u: any) => (
                        <option key={u.unit_id} value={u.unit_id}>
                          {u.unit_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {(itemForm.item_type === "event" || itemForm.item_type === "task") && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <MapPin className="w-3 h-3 inline mr-1" />
                      Location
                    </label>
                    <input
                      type="text"
                      className="w-full border border-gray-200 rounded-xl p-3 text-sm"
                      placeholder="Location..."
                      value={itemForm.location}
                      onChange={(e) => setItemForm({ ...itemForm, location: e.target.value })}
                    />
                  </div>
                )}

                {itemForm.item_type === "event" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Meeting Link
                    </label>
                    <input
                      type="url"
                      className="w-full border border-gray-200 rounded-xl p-3 text-sm"
                      placeholder="https://..."
                      value={itemForm.meeting_link}
                      onChange={(e) => setItemForm({ ...itemForm, meeting_link: e.target.value })}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reminder
                  </label>
                  <select
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm"
                    value={itemForm.reminder}
                    onChange={(e) => setItemForm({ ...itemForm, reminder: e.target.value })}
                  >
                    <option value="none">No reminder</option>
                    <option value="5min">5 minutes before</option>
                    <option value="15min">15 minutes before</option>
                    <option value="30min">30 minutes before</option>
                    <option value="1hour">1 hour before</option>
                    <option value="1day">1 day before</option>
                    <option value="1week">1 week before</option>
                  </select>
                </div>

                {itemForm.item_type !== "reminder" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Repeat
                    </label>
                    <select
                      className="w-full border border-gray-200 rounded-xl p-3 text-sm"
                      value={itemForm.repeat_rule}
                      onChange={(e) => setItemForm({ ...itemForm, repeat_rule: e.target.value })}
                    >
                      <option value="none">No repeat</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Bi-weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowItemModal(false);
                    setEditingItem(null);
                    resetItemForm();
                  }}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={editingItem ? handleUpdateItem : handleCreateItem}
                  disabled={!itemForm.title || !itemForm.item_date}
                  className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingItem ? "Update" : "Create"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BookingAppointment;
