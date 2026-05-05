"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  CheckCircle,
  Clock,
  Home,
  Tag,
  User,
  Wrench,
  Package,
  X,
  ChevronRight,
  AlertCircle,
  CalendarClock,
  MapPin,
  Mail,
  ExternalLink,
  Play,
  RotateCcw,
} from "lucide-react";

import {
  getStatusConfig,
  getPriorityConfig,
} from "@/components/landlord/maintenance_management/getStatusConfig";

// ============================================
// ANIMATION VARIANTS
// ============================================
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

const desktopModalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 25 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

// ============================================
// MAIN MODAL COMPONENT
// ============================================
export default function MaintenanceDetailsModal({
  selectedRequest,
  onClose,
  onStart,
  onComplete,
  onReschedule,
  updateStatus,
  isLocked,
}: {
  selectedRequest: any;
  onClose: () => void;
  onStart: () => void;
  onComplete: () => void;
  onReschedule: () => void;
  updateStatus: (id: string, status: string) => void;
  isLocked?: boolean;
}) {
  const status = getStatusConfig(selectedRequest.status);
  const priority = getPriorityConfig(selectedRequest.priority_level);
  const StatusIcon = status.icon;

  const formatDateTime = (dt: string) =>
    new Date(dt).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  const formatDate = (dt: string) =>
    new Date(dt).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  return (
    <AnimatePresence>
      <motion.div
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      >
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
          className="bg-white w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          style={{ maxHeight: "85vh" }}
        >
          {/* Header */}
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-emerald-500 flex-shrink-0">
            {/* Decorative Circles */}
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full" />

            {/* Mobile drag handle */}
            <div className="sm:hidden flex justify-center pt-2">
              <div className="w-10 h-1 rounded-full bg-white/30" />
            </div>

            <div className="relative p-4 sm:p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                    <span className="text-[11px] sm:text-xs text-white/70 font-medium">
                      #{selectedRequest.request_id}
                    </span>
                    <span className="w-1 h-1 bg-white/50 rounded-full" />
                    <span className="text-[11px] sm:text-xs text-white/70">
                      {formatDate(selectedRequest.created_at)}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3 leading-tight line-clamp-3 sm:line-clamp-none">
                    {selectedRequest.subject}
                  </h2>

                  {/* Status & Priority Badges */}
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold bg-white/20 backdrop-blur-sm text-white">
                      <StatusIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      {status.label}
                    </span>
                    <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold bg-white/20 backdrop-blur-sm text-white">
                      {selectedRequest.priority_level?.toLowerCase() ===
                        "urgent" && (
                        <motion.span
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ repeat: Infinity, duration: 1 }}
                          className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-400 rounded-full"
                        />
                      )}
                      ⚡ {priority.label}
                    </span>
                  </div>
                </div>

                {/* Close Button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-1.5 sm:p-2 hover:bg-white/20 rounded-xl transition-colors flex-shrink-0 ml-2"
                >
                  <X className="w-5 h-5 text-white" />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-3 sm:space-y-4"
          >
            {/* Description */}
            <motion.div
              variants={fadeInUp}
              className="bg-gray-50 rounded-xl p-3 sm:p-4"
            >
              <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                <Wrench className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold text-gray-900 text-sm">
                  Description
                </h3>
              </div>
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                {selectedRequest.description || "No description provided."}
              </p>
            </motion.div>

            {/* Timeline Cards */}
            <motion.div
              variants={fadeInUp}
              className="grid grid-cols-2 gap-2 sm:gap-3"
            >
              <TimelineCard
                icon={
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                }
                label="Submitted"
                value={formatDateTime(selectedRequest.created_at)}
              />
              <TimelineCard
                icon={
                  <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                }
                label="Category"
                value={selectedRequest.category}
              />
              {selectedRequest.schedule_date && (
                <TimelineCard
                  icon={
                    <CalendarClock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600" />
                  }
                  label="Scheduled"
                  value={formatDateTime(selectedRequest.schedule_date)}
                />
              )}
              {selectedRequest.completion_date && (
                <TimelineCard
                  icon={
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" />
                  }
                  label="Completed"
                  value={formatDateTime(selectedRequest.completion_date)}
                />
              )}
            </motion.div>

            {/* Photos */}
            {selectedRequest.photo_urls?.length > 0 && (
              <motion.div variants={fadeInUp}>
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <h3 className="font-semibold text-gray-900 text-sm">
                    Photos
                  </h3>
                  <span className="px-2 py-0.5 bg-gray-100 rounded-md text-xs text-gray-500">
                    {selectedRequest.photo_urls.length}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 sm:gap-2">
                  {selectedRequest.photo_urls.map(
                    (photo: string, i: number) => (
                      <motion.div
                        key={i}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => window.open(photo, "_blank")}
                        className="relative group cursor-pointer"
                      >
                        <img
                          src={photo}
                          alt={`Photo ${i + 1}`}
                          className="w-full h-16 sm:h-20 object-cover rounded-lg sm:rounded-xl border border-gray-200"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-lg sm:rounded-xl transition-all flex items-center justify-center">
                          <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </motion.div>
                    ),
                  )}
                </div>
              </motion.div>
            )}

            {/* Info Cards */}
            <motion.div
              variants={fadeInUp}
              className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3"
            >
              {/* Property */}
              <InfoCard
                icon={
                  <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                }
                title="Property"
                lines={[
                  selectedRequest.property_name || "Not specified",
                  selectedRequest.unit_name
                    ? `Unit: ${selectedRequest.unit_name}`
                    : null,
                ]}
              />

              {/* Tenant */}
              <InfoCard
                icon={
                  <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600" />
                }
                title="Tenant"
                lines={
                  selectedRequest.tenant_first_name
                    ? [
                        `${selectedRequest.tenant_first_name} ${selectedRequest.tenant_last_name}`,
                        selectedRequest.tenant_email,
                      ]
                    : ["No tenant linked"]
                }
              />

              {/* Asset */}
              <InfoCard
                icon={
                  <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                }
                title="Asset"
                lines={
                  selectedRequest.asset
                    ? [
                        selectedRequest.asset.asset_name,
                        selectedRequest.asset.model
                          ? `Model: ${selectedRequest.asset.model}`
                          : null,
                      ]
                    : ["No asset linked"]
                }
              />
            </motion.div>

            {/* Assigned To */}
            {selectedRequest.assigned_to && (
              <motion.div
                variants={fadeInUp}
                className="bg-gradient-to-r from-blue-50 to-emerald-50 rounded-xl p-3 sm:p-4"
              >
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-sm sm:text-base">
                      {selectedRequest.assigned_to.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] sm:text-xs text-gray-500">
                      Assigned To
                    </p>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                      {selectedRequest.assigned_to}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Action Footer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-4 sm:p-5 border-t border-gray-100 bg-white flex-shrink-0"
            style={{
              paddingBottom: "max(1rem, env(safe-area-inset-bottom, 1rem))",
            }}
          >
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              {/* PENDING */}
              {selectedRequest.status === "pending" && (
                <>
                  <ActionButton
                    onClick={() =>
                      updateStatus(selectedRequest.request_id, "approved")
                    }
                    variant="success"
                    icon={<CheckCircle className="w-4 h-4" />}
                  >
                    Approve
                  </ActionButton>
                  <ActionButton
                    onClick={() =>
                      updateStatus(selectedRequest.request_id, "rejected")
                    }
                    variant="danger"
                    icon={<X className="w-4 h-4" />}
                  >
                    Reject
                  </ActionButton>
                </>
              )}

              {/* APPROVED */}
              {selectedRequest.status === "approved" && (
                <ActionButton
                  onClick={onStart}
                  variant="primary"
                  icon={<CalendarClock className="w-4 h-4" />}
                >
                  Assign & Schedule
                </ActionButton>
              )}

              {/* SCHEDULED */}
              {selectedRequest.status === "scheduled" && (
                <>
                  <ActionButton
                    onClick={() =>
                      updateStatus(selectedRequest.request_id, "in-progress")
                    }
                    variant="primary"
                    icon={<Play className="w-4 h-4" />}
                  >
                    Start Work
                  </ActionButton>
                  <ActionButton
                    onClick={onReschedule}
                    variant="secondary"
                    icon={<RotateCcw className="w-4 h-4" />}
                  >
                    Reschedule
                  </ActionButton>
                </>
              )}

              {/* IN PROGRESS */}
              {selectedRequest.status === "in-progress" && (
                <ActionButton
                  onClick={onComplete}
                  variant="success"
                  icon={<CheckCircle className="w-4 h-4" />}
                >
                  Mark Complete
                </ActionButton>
              )}

              {/* DONE */}
              {(selectedRequest.status === "completed" ||
                selectedRequest.status === "rejected") && (
                <ActionButton
                  onClick={onClose}
                  variant="secondary"
                  icon={<X className="w-4 h-4" />}
                >
                  Close
                </ActionButton>
              )}
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function TimelineCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-lg sm:rounded-xl p-2.5 sm:p-3 shadow-sm">
      <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
        <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <span className="text-[10px] sm:text-[11px] text-gray-500 uppercase tracking-wide font-medium truncate">
          {label}
        </span>
      </div>
      <p className="text-xs sm:text-sm font-semibold text-gray-900 pl-[30px] sm:pl-9 truncate">
        {value}
      </p>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  lines,
}: {
  icon: React.ReactNode;
  title: string;
  lines: (string | null)[];
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <h4 className="text-xs sm:text-sm font-semibold text-gray-900">
          {title}
        </h4>
      </div>
      <div className="text-[11px] sm:text-xs text-gray-600 space-y-0.5 pl-9 sm:pl-10">
        {lines.filter(Boolean).map((line, i) => (
          <p key={i} className="truncate">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  variant,
  icon,
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant: "primary" | "secondary" | "success" | "danger";
  icon?: React.ReactNode;
}) {
  const variants = {
    primary:
      "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30",
    secondary: "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50",
    success:
      "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/30",
    danger:
      "bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-95 ${variants[variant]}`}
    >
      {icon}
      {children}
    </motion.button>
  );
}
