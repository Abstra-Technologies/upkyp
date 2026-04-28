"use client";

import { CITIZENSHIPS } from "@/constant/citizenship";
import occupations from "@/constant/occupations";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Edit3,
  Save,
  Shield,
  Clock,
  AlertCircle,
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  User,
  Calendar,
  Briefcase,
  Globe,
  Heart,
  Sparkles,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import axios from "axios";
import { logEvent } from "@/utils/gtag";
import DeleteAccountButton from "../authentication/deleteAccountButton";
import useAuthStore from "@/zustand/authStore";
import LoadingScreen from "@/components/loadingScreen";

/* ===============================
   Types
=============================== */
interface ProfileData {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  civil_status: string;
  occupation: string;
  citizenship: string;
  birthDate: string;
  address: string;
}

interface FormData {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  occupation: string;
  citizenship: string;
  civil_status: string;
  birthDate?: string;
  address: string;
}

type VerificationStatus =
  | "approved"
  | "pending"
  | "not verified"
  | null;

type MobileTab = "personal" | "subscription" | "settings";

/* ===============================
   Animation Variants
=============================== */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20,
    },
  },
};

const profileImageVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20,
      delay: 0.2,
    },
  },
};

const tabContentVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    x: 10,
    transition: { duration: 0.15 },
  },
};

/* ===============================
   Default Profile Image
=============================== */
const DEFAULT_PROFILE_IMG =
  "https://res.cloudinary.com/dptmeluy0/image/upload/v1766715365/" +
  "profile-icon-design-free-vector_la6rgj.jpg";

/* ===============================
   Reusable Field Renderer
=============================== */
interface FieldProps {
  label: string;
  value: string | undefined;
  editElement: React.ReactNode;
  icon?: React.ReactNode;
}

function Field({ label, value, editElement, icon }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-500 uppercase
        tracking-wide flex items-center gap-1.5"
      >
        {icon}
        {label}
      </label>
      {editElement || (
        <div className="px-3 py-2.5 bg-gray-50 rounded-lg text-sm
          text-gray-900 font-medium min-h-[36px]"
        >
          {value || (
            <span className="text-gray-400">Not provided</span>
          )}
        </div>
      )}
    </div>
  );
}

/* ===============================
   Card Header Component
=============================== */
interface CardHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  danger?: boolean;
}

function CardHeader({
  icon,
  title,
  subtitle,
  danger = false,
}: CardHeaderProps) {
  return (
    <div className={`px-6 py-5 border-b
      ${danger ? "border-red-100 bg-red-50"
        : "border-gray-100 bg-gradient-to-r from-gray-50 to-white"}`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl
          ${danger ? "bg-red-100" : "bg-blue-100"}`}
        >
          {icon}
        </div>
        <div>
          <h3 className={`text-lg font-semibold
            ${danger ? "text-red-900" : "text-gray-900"}`}
          >
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ===============================
   Verification Badge
=============================== */
function VerificationBadge({
  status,
}: {
  status: VerificationStatus;
}) {
  if (status === "approved") {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="inline-flex items-center gap-1.5 px-2.5
          py-1 rounded-full text-xs font-semibold
          bg-emerald-100 text-emerald-700 border border-emerald-200"
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
        Verified
      </motion.div>
    );
  }

  if (status === "pending") {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="inline-flex items-center gap-1.5 px-2.5
          py-1 rounded-full text-xs font-semibold
          bg-amber-100 text-amber-700 border border-amber-200"
      >
        <Clock className="w-3.5 h-3.5" />
        Pending
      </motion.div>
    );
  }

  if (status === "not verified") {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="inline-flex items-center gap-1.5 px-2.5
          py-1 rounded-full text-xs font-semibold
          bg-gray-100 text-gray-600 border border-gray-200"
      >
        <AlertCircle className="w-3.5 h-3.5" />
        Not Verified
      </motion.div>
    );
  }

  return null;
}

/* ===============================
   Profile Hero Section
=============================== */
interface ProfileHeroProps {
  user: any;
  profilePicture: string;
  profileData: ProfileData;
  editing: boolean;
  isSaving: boolean;
  uploadingImage: boolean;
  verificationStatus: VerificationStatus;
  onEditToggle: () => void;
  onSave: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function ProfileHero({
  user,
  profilePicture,
  profileData,
  editing,
  isSaving,
  uploadingImage,
  verificationStatus,
  onEditToggle,
  onSave,
  onFileChange,
}: ProfileHeroProps) {
  return (
    <motion.div
      variants={cardVariants}
      className="relative bg-white rounded-2xl lg:rounded-3xl
        shadow-sm border border-gray-100 overflow-hidden
        mb-4 lg:mb-8"
    >
      {/* Gradient Banner */}
      <div className="relative h-28 sm:h-44 lg:h-52
        bg-gradient-to-br from-blue-600 via-blue-500
        to-emerald-500"
      >
        <div className="absolute inset-0 bg-cover
          bg-center opacity-50"
          style={{
            backgroundImage: `url("data:image/svg+xml,
              %3Csvg width='60' height='60' viewBox='0 0 60 60'
              xmlns='http://www.w3.org/2000/svg'%3E
              %3Cg fill='none' fill-rule='evenodd'%3E
              %3Cg fill='%23ffffff' fill-opacity='0.08'%3E
              %3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4z
              m0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2
              h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E
              %3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="absolute bottom-0 left-0 right-0
          h-20 bg-gradient-to-t from-white to-transparent"
        />
      </div>

      {/* Profile Content */}
      <div className="relative px-4 sm:px-8 lg:px-10
        pb-4 lg:pb-8 -mt-16 sm:-mt-24 lg:-mt-28"
      >
        <div className="flex flex-col sm:flex-row
          items-center sm:items-end gap-3 sm:gap-6 lg:gap-8"
        >
          {/* Profile Picture */}
          <motion.div
            variants={profileImageVariants}
            className="relative group flex-shrink-0"
          >
            <label className="cursor-pointer block">
              <div className="relative">
                <div className="w-24 h-24 sm:w-36 sm:h-36
                  lg:w-44 lg:h-44 rounded-2xl lg:rounded-3xl
                  overflow-hidden border-4 border-white
                  shadow-xl bg-white"
                >
                  <img
                    src={profilePicture || DEFAULT_PROFILE_IMG}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Hover Overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  className="absolute inset-0 bg-black/50
                    rounded-2xl lg:rounded-3xl flex items-center
                    justify-center transition-opacity"
                >
                  {uploadingImage ? (
                    <div className="w-8 h-8 border-3 border-white
                      border-t-transparent rounded-full animate-spin"
                    />
                  ) : (
                    <div className="text-center text-white">
                      <Camera className="w-7 h-7 lg:w-8 lg:h-8
                        mx-auto mb-1"
                      />
                      <span className="text-sm font-medium">
                        Change Photo
                      </span>
                    </div>
                  )}
                </motion.div>

                {/* Online Indicator */}
                <div className="absolute -bottom-1 -right-1
                  w-5 h-5 lg:w-8 lg:h-8 bg-emerald-500
                  rounded-full border-4 border-white"
                />
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={onFileChange}
                className="hidden"
                disabled={uploadingImage}
              />
            </label>
          </motion.div>

          {/* User Info */}
          <div className="flex-1 text-center sm:text-left">
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row sm:items-center
                gap-1.5 sm:gap-4 mb-2"
            >
              <h1 className="text-xl sm:text-3xl lg:text-4xl
                font-bold text-gray-900"
              >
                {user?.firstName || "User"}
                {" "}
                {user?.lastName || ""}
              </h1>
              {user?.userType === "landlord" && (
                <VerificationBadge
                  status={verificationStatus}
                />
              )}
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="flex flex-wrap justify-center
                sm:justify-start gap-2 sm:gap-4 lg:gap-5
                text-xs sm:text-sm lg:text-base text-gray-600"
            >
              <span className="inline-flex items-center
                gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700
                rounded-full font-medium capitalize"
              >
                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {user?.userType}
              </span>
              {profileData?.email && (
                <span className="hidden sm:inline-flex
                  items-center gap-2"
                >
                  <Mail className="w-4 h-4 lg:w-5 lg:h-5
                    text-gray-400"
                  />
                  <span className="truncate
                    max-w-[200px] lg:max-w-[300px]"
                  >
                    {profileData.email}
                  </span>
                </span>
              )}
              {profileData?.phoneNumber && (
                <span className="hidden sm:inline-flex
                  items-center gap-2"
                >
                  <Phone className="w-4 h-4 lg:w-5 lg:h-5
                    text-gray-400"
                  />
                  {profileData.phoneNumber}
                </span>
              )}
            </motion.div>
          </div>

          {/* Edit Buttons */}
          <EditButtons
            editing={editing}
            isSaving={isSaving}
            onEditToggle={onEditToggle}
            onSave={onSave}
          />
        </div>
      </div>
    </motion.div>
  );
}

/* ===============================
   Edit Buttons (Desktop + Mobile)
=============================== */
interface EditButtonsProps {
  editing: boolean;
  isSaving: boolean;
  onEditToggle: () => void;
  onSave: () => void;
}

function EditButtons({
  editing,
  isSaving,
  onEditToggle,
  onSave,
}: EditButtonsProps) {
  return (
    <>
      {/* Desktop */}
      <motion.div
        variants={itemVariants}
        className="hidden sm:block"
      >
        <AnimatePresence mode="wait">
          {editing ? (
            <motion.div
              key="editing"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex gap-3"
            >
              <button
                onClick={onEditToggle}
                disabled={isSaving}
                className="px-5 py-2.5 lg:px-6 lg:py-3 text-sm
                  lg:text-base font-medium text-gray-700 bg-white
                  border border-gray-200 rounded-xl hover:bg-gray-50
                  hover:border-gray-300 transition-all duration-200
                  disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={onSave}
                disabled={isSaving}
                className="px-5 py-2.5 lg:px-6 lg:py-3 text-sm
                  lg:text-base font-semibold text-white
                  bg-gradient-to-r from-blue-600 to-emerald-600
                  rounded-xl hover:shadow-lg
                  hover:shadow-blue-500/25 transition-all
                  duration-200 flex items-center gap-2
                  disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 lg:w-5 lg:h-5 border-2
                      border-white border-t-transparent rounded-full
                      animate-spin"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 lg:w-5 lg:h-5" />
                    Save Changes
                  </>
                )}
              </button>
            </motion.div>
          ) : (
            <motion.button
              key="edit"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onClick={onEditToggle}
              className="px-6 py-2.5 lg:px-8 lg:py-3 text-sm
                lg:text-base font-semibold text-white
                bg-gradient-to-r from-blue-600 to-emerald-600
                rounded-xl hover:shadow-lg
                hover:shadow-blue-500/25 transition-all
                duration-200 flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4 lg:w-5 lg:h-5" />
              Edit Profile
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Mobile */}
      <motion.div
        variants={itemVariants}
        className="sm:hidden mt-4"
      >
        <AnimatePresence mode="wait">
          {editing ? (
            <motion.div
              key="editing-mobile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex gap-2"
            >
              <button
                onClick={onEditToggle}
                disabled={isSaving}
                className="flex-1 px-3 py-2.5 text-xs font-medium
                  text-gray-700 bg-gray-100 rounded-lg
                  hover:bg-gray-200 transition-colors
                  disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={onSave}
                disabled={isSaving}
                className="flex-1 px-3 py-2.5 text-xs font-semibold
                  text-white bg-gradient-to-r from-blue-600
                  to-emerald-600 rounded-lg flex items-center
                  justify-center gap-1.5 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white
                      border-t-transparent rounded-full animate-spin"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    Save
                  </>
                )}
              </button>
            </motion.div>
          ) : (
            <motion.button
              key="edit-mobile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onClick={onEditToggle}
              className="w-full px-3 py-2.5 text-xs font-semibold
                text-white bg-gradient-to-r from-blue-600
                to-emerald-600 rounded-lg flex items-center
                justify-center gap-1.5 hover:shadow-lg
                hover:shadow-blue-500/25 transition-all"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Profile
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}

/* ===============================
   Mobile Tab Navigation
=============================== */
const MOBILE_TABS: {
  id: MobileTab;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "personal",
    label: "Personal",
    icon: <User className="w-4 h-4" />,
  },
  {
    id: "subscription",
    label: "Subscription",
    icon: <Sparkles className="w-4 h-4" />,
  },
  {
    id: "settings",
    label: "Settings",
    icon: <Shield className="w-4 h-4" />,
  },
];

function MobileTabNav({
  activeTab,
  onChange,
}: {
  activeTab: MobileTab;
  onChange: (tab: MobileTab) => void;
}) {
  return (
    <div className="lg:hidden mb-4">
      <div className="bg-white rounded-xl shadow-sm border
        border-gray-100 p-1"
      >
        <div className="flex gap-1">
          {MOBILE_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex-1 flex items-center justify-center
                gap-1.5 px-2 py-2.5 text-xs font-medium rounded-lg
                transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ===============================
   Verification Banner
=============================== */
function VerificationBanner({
  router,
}: {
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <motion.div
      variants={cardVariants}
      className="bg-gradient-to-r from-blue-50 to-emerald-50
        border border-blue-200 rounded-2xl p-6"
    >
      <div className="flex items-start gap-4">
        <div className="p-3 bg-blue-100 rounded-xl
          flex-shrink-0"
        >
          <Shield className="w-6 h-6 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-base font-semibold
            text-gray-900 mb-1"
          >
            Verify Your Identity
          </h4>
          <p className="text-sm text-gray-600 mb-4">
            Build trust with tenants by verifying your account.
            Verified landlords get more inquiries.
          </p>
          <button
            onClick={() =>
              router.push("/landlord/verification")
            }
            className="inline-flex items-center gap-2 px-5
              py-2.5 text-sm font-semibold text-white
              bg-gradient-to-r from-blue-600 to-emerald-600
              rounded-xl hover:shadow-md transition-all"
          >
            Start Verification
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ===============================
   Personal Info Card (Mobile)
=============================== */
function MobilePersonalInfo({
  profileData,
  formData,
  editing,
  onChange,
}: {
  profileData: ProfileData;
  formData: FormData;
  editing: boolean;
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => void;
}) {
  return (
    <div className="space-y-3">
      {/* Personal Information */}
      <div className="bg-white rounded-xl shadow-sm border
        border-gray-100 overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-gray-100
          bg-gradient-to-r from-gray-50 to-white"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">
              Personal Information
            </h3>
          </div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="First Name"
              value={profileData?.firstName}
              editElement={
                editing ? (
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={onChange}
                    className="w-full px-3 py-2.5 text-sm border
                      border-gray-200 rounded-lg focus:ring-2
                      focus:ring-blue-500/20 focus:border-blue-500
                      transition-all outline-none"
                    placeholder="First name"
                  />
                ) : undefined
              }
            />
            <Field
              label="Last Name"
              value={profileData?.lastName}
              editElement={
                editing ? (
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={onChange}
                    className="w-full px-3 py-2.5 text-sm border
                      border-gray-200 rounded-lg focus:ring-2
                      focus:ring-blue-500/20 focus:border-blue-500
                      transition-all outline-none"
                    placeholder="Last name"
                  />
                ) : undefined
              }
            />
            <Field
              label="Birth Date"
              value={profileData?.birthDate}
              icon={<Calendar className="w-3.5 h-3.5" />}
              editElement={
                editing ? (
                  <input
                    type="date"
                    name="birthDate"
                    value={formData.birthDate || ""}
                    onChange={onChange}
                    className="w-full px-3 py-2.5 text-sm border
                      border-gray-200 rounded-lg focus:ring-2
                      focus:ring-blue-500/20 focus:border-blue-500
                      transition-all outline-none"
                  />
                ) : undefined
              }
            />
            <Field
              label="Civil Status"
              value={profileData?.civil_status}
              icon={<Heart className="w-3.5 h-3.5" />}
              editElement={
                editing ? (
                  <select
                    name="civil_status"
                    value={formData.civil_status}
                    onChange={onChange}
                    className="w-full px-3 py-2.5 text-sm border
                      border-gray-200 rounded-lg focus:ring-2
                      focus:ring-blue-500/20 focus:border-blue-500
                      transition-all outline-none bg-white"
                  >
                    <option value="">Select</option>
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="widowed">Widowed</option>
                    <option value="divorced">Divorced</option>
                    <option value="separated">Separated</option>
                    <option value="other">Other</option>
                  </select>
                ) : undefined
              }
            />
          </div>
        </div>
      </div>

      {/* Professional Details */}
      <div className="bg-white rounded-xl shadow-sm border
        border-gray-100 overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-gray-100
          bg-gradient-to-r from-gray-50 to-white"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Briefcase className="w-4 h-4 text-emerald-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">
              Professional Details
            </h3>
          </div>
        </div>
        <div className="p-4 space-y-3">
          <Field
            label="Occupation"
            value={
              occupations.find(
                (o) => o.value === profileData?.occupation,
              )?.label
            }
            editElement={
              editing ? (
                <select
                  name="occupation"
                  value={formData.occupation}
                  onChange={onChange}
                  className="w-full px-3 py-2.5 text-sm border
                    border-gray-200 rounded-lg focus:ring-2
                    focus:ring-blue-500/20 focus:border-blue-500
                    transition-all outline-none bg-white"
                >
                  <option value="">Select</option>
                  {occupations.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : undefined
            }
          />
          <Field
            label="Citizenship"
            value={
              CITIZENSHIPS.find(
                (c) => c.value === profileData?.citizenship,
              )?.label
            }
            icon={<Globe className="w-3.5 h-3.5" />}
            editElement={
              editing ? (
                <select
                  name="citizenship"
                  value={formData.citizenship}
                  onChange={onChange}
                  className="w-full px-3 py-2.5 text-sm border
                    border-gray-200 rounded-lg focus:ring-2
                    focus:ring-blue-500/20 focus:border-blue-500
                    transition-all outline-none bg-white"
                >
                  <option value="">Select</option>
                  {CITIZENSHIPS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              ) : undefined
            }
          />
          <Field
            label="Address"
            value={profileData?.address}
            icon={<MapPin className="w-3.5 h-3.5" />}
            editElement={
              editing ? (
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={onChange}
                  rows={2}
                  className="w-full px-3 py-2.5 text-sm border
                    border-gray-200 rounded-lg focus:ring-2
                    focus:ring-blue-500/20 focus:border-blue-500
                    transition-all outline-none resize-none"
                  placeholder="Enter address"
                />
              ) : undefined
            }
          />
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-xl shadow-sm border
        border-gray-100 overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-gray-100
          bg-gradient-to-r from-gray-50 to-white"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-violet-100 rounded-lg">
              <Mail className="w-4 h-4 text-violet-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">
              Contact Information
            </h3>
          </div>
        </div>
        <div className="p-4 space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500
              uppercase tracking-wide"
            >
              Email Address
            </label>
            <div className="px-3 py-2.5 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-sm
                text-gray-900 font-medium"
              >
                <Mail className="w-4 h-4 text-gray-400
                  flex-shrink-0"
                />
                <span className="truncate">
                  {profileData?.email}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-400 flex items-center
              gap-1"
            >
              <Shield className="w-3 h-3" />
              Protected - cannot be changed
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500
              uppercase tracking-wide"
            >
              Phone Number
            </label>
            {editing ? (
              <input
                type="text"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={onChange}
                className="w-full px-3 py-2.5 text-sm border
                  border-gray-200 rounded-lg focus:ring-2
                  focus:ring-blue-500/20 focus:border-blue-500
                  transition-all outline-none"
                placeholder="Enter phone number"
              />
            ) : (
              <div className="px-3 py-2.5 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm
                  text-gray-900 font-medium"
                >
                  <Phone className="w-4 h-4 text-gray-400
                    flex-shrink-0"
                  />
                  {profileData?.phoneNumber || (
                    <span className="text-gray-400">
                      Not provided
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===============================
   Mobile Subscription Tab
=============================== */
function MobileSubscriptionTab({
  user,
  verificationStatus,
  subscriptionPlan,
  router,
}: {
  user: any;
  verificationStatus: VerificationStatus;
  subscriptionPlan: string | null;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <div className="space-y-3">
      {/* Verification Banner */}
      <AnimatePresence>
        {user?.userType === "landlord" &&
          verificationStatus === "not verified" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="bg-gradient-to-r from-blue-50
                to-emerald-50 border border-blue-200
                rounded-xl p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg
                    flex-shrink-0"
                  >
                    <Shield className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold
                      text-gray-900 mb-1"
                    >
                      Verify Your Identity
                    </h4>
                    <p className="text-xs text-gray-600 mb-3">
                      Build trust with tenants by verifying
                      your account.
                    </p>
                    <button
                      onClick={() =>
                        router.push("/landlord/verification")
                      }
                      className="inline-flex items-center
                        gap-1.5 px-3 py-2 text-xs font-semibold
                        text-white bg-gradient-to-r from-blue-600
                        to-emerald-600 rounded-lg hover:shadow-md
                        transition-all"
                    >
                      Start Verification
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
      </AnimatePresence>

      {/* Subscription Card */}
      <div className="relative overflow-hidden rounded-xl">
        <div className="absolute inset-0 bg-gradient-to-br
          from-blue-600 to-emerald-600"
        />
        <div className="absolute inset-0 bg-cover bg-center
          opacity-50"
          style={{
            backgroundImage: `url("data:image/svg+xml,
              %3Csvg width='60' height='60' viewBox='0 0 60 60'
              xmlns='http://www.w3.org/2000/svg'%3E
              %3Cg fill='none' fill-rule='evenodd'%3E
              %3Cg fill='%23ffffff' fill-opacity='0.1'%3E
              %3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4z
              m0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2
              h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E
              %3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-white/20 backdrop-blur
              rounded-lg"
            >
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-white/80">
                {user?.userType === "landlord"
                  ? "Subscription Plan"
                  : "Account Type"}
              </h3>
              <p className="text-lg font-bold text-white
                capitalize"
              >
                {user?.userType === "landlord" && subscriptionPlan
                  ? subscriptionPlan
                  : user?.userType}
              </p>
            </div>
          </div>
          {user?.userType === "landlord" && (
            <button
              onClick={() =>
                router.push(
                  "/commons/landlord/subscription",
                )
              }
              className="w-full px-3 py-2.5 text-xs font-semibold
                text-blue-600 bg-white rounded-lg hover:bg-blue-50
                transition-colors flex items-center justify-center
                gap-1.5"
            >
              View Subscription
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ===============================
   Mobile Settings Tab
=============================== */
function MobileSettingsTab({
  userId,
  userType,
}: {
  userId: string;
  userType: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border
      border-red-100 overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-red-100
        bg-red-50"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <h3 className="text-sm font-semibold text-red-900">
            Danger Zone
          </h3>
        </div>
      </div>
      <div className="p-4">
        <p className="text-xs text-gray-600 mb-3">
          Once you delete your account, there is no going back.
        </p>
        <DeleteAccountButton
          user_id={userId}
          userType={userType}
        />
      </div>
    </div>
  );
}

/* ===============================
   Desktop Personal Info Card
=============================== */
function DesktopPersonalInfo({
  profileData,
  formData,
  editing,
  onChange,
}: {
  profileData: ProfileData;
  formData: FormData;
  editing: boolean;
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => void;
}) {
  return (
    <motion.div
      variants={cardVariants}
      className="bg-white rounded-3xl shadow-sm border
        border-gray-100 overflow-hidden"
    >
      <CardHeader
        icon={<User className="w-6 h-6 text-blue-600" />}
        title="Personal Information"
        subtitle="Your basic profile details"
      />
      <div className="p-6">
        <div className="grid grid-cols-2 gap-6">
          <Field
            label="First Name"
            value={profileData?.firstName}
            editElement={
              editing ? (
                <motion.input
                  initial={{ borderColor: "#e5e7eb" }}
                  whileFocus={{ borderColor: "#3b82f6" }}
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={onChange}
                  className="w-full px-4 py-3.5 text-sm border
                    border-gray-200 rounded-xl focus:ring-2
                    focus:ring-blue-500/20 focus:border-blue-500
                    transition-all outline-none"
                  placeholder="Enter first name"
                />
              ) : undefined
            }
          />
          <Field
            label="Last Name"
            value={profileData?.lastName}
            editElement={
              editing ? (
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={onChange}
                  className="w-full px-4 py-3.5 text-sm border
                    border-gray-200 rounded-xl focus:ring-2
                    focus:ring-blue-500/20 focus:border-blue-500
                    transition-all outline-none"
                  placeholder="Enter last name"
                />
              ) : undefined
            }
          />
          <Field
            label="Birth Date"
            value={profileData?.birthDate}
            icon={<Calendar className="w-4 h-4" />}
            editElement={
              editing ? (
                <input
                  type="date"
                  name="birthDate"
                  value={formData.birthDate || ""}
                  onChange={onChange}
                  className="w-full px-4 py-3.5 text-sm border
                    border-gray-200 rounded-xl focus:ring-2
                    focus:ring-blue-500/20 focus:border-blue-500
                    transition-all outline-none"
                />
              ) : undefined
            }
          />
          <Field
            label="Civil Status"
            value={profileData?.civil_status}
            icon={<Heart className="w-4 h-4" />}
            editElement={
              editing ? (
                <select
                  name="civil_status"
                  value={formData.civil_status}
                  onChange={onChange}
                  className="w-full px-4 py-3.5 text-sm border
                    border-gray-200 rounded-xl focus:ring-2
                    focus:ring-blue-500/20 focus:border-blue-500
                    transition-all outline-none bg-white"
                >
                  <option value="">Select status</option>
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="widowed">Widowed</option>
                  <option value="divorced">Divorced</option>
                  <option value="separated">Separated</option>
                  <option value="other">Other</option>
                </select>
              ) : undefined
            }
          />
        </div>
      </div>
    </motion.div>
  );
}

/* ===============================
   Desktop Professional Details
=============================== */
function DesktopProfessionalDetails({
  profileData,
  formData,
  editing,
  onChange,
}: {
  profileData: ProfileData;
  formData: FormData;
  editing: boolean;
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => void;
}) {
  return (
    <motion.div
      variants={cardVariants}
      className="bg-white rounded-3xl shadow-sm border
        border-gray-100 overflow-hidden"
    >
      <CardHeader
        icon={
          <Briefcase className="w-6 h-6 text-emerald-600" />
        }
        title="Professional Details"
        subtitle="Work and location information"
      />
      <div className="p-6 space-y-6">
        <Field
          label="Occupation"
          value={
            occupations.find(
              (o) => o.value === profileData?.occupation,
            )?.label
          }
          editElement={
            editing ? (
              <select
                name="occupation"
                value={formData.occupation}
                onChange={onChange}
                className="w-full px-4 py-3.5 text-sm border
                  border-gray-200 rounded-xl focus:ring-2
                  focus:ring-blue-500/20 focus:border-blue-500
                  transition-all outline-none bg-white"
              >
                <option value="">Select occupation</option>
                {occupations.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : undefined
          }
        />
        <Field
          label="Citizenship"
          value={
            CITIZENSHIPS.find(
              (c) => c.value === profileData?.citizenship,
            )?.label
          }
          icon={<Globe className="w-4 h-4" />}
          editElement={
            editing ? (
              <select
                name="citizenship"
                value={formData.citizenship}
                onChange={onChange}
                className="w-full px-4 py-3.5 text-sm border
                  border-gray-200 rounded-xl focus:ring-2
                  focus:ring-blue-500/20 focus:border-blue-500
                  transition-all outline-none bg-white"
              >
                <option value="">Select citizenship</option>
                {CITIZENSHIPS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            ) : undefined
          }
        />
        <Field
          label="Address"
          value={profileData?.address}
          icon={<MapPin className="w-4 h-4" />}
          editElement={
            editing ? (
              <textarea
                name="address"
                value={formData.address}
                onChange={onChange}
                rows={3}
                className="w-full px-4 py-3.5 text-sm border
                  border-gray-200 rounded-xl focus:ring-2
                  focus:ring-blue-500/20 focus:border-blue-500
                  transition-all outline-none resize-none"
                placeholder="Enter your address"
              />
            ) : undefined
          }
        />
      </div>
    </motion.div>
  );
}

/* ===============================
   Desktop Contact Card
=============================== */
function DesktopContactCard({
  profileData,
  formData,
  editing,
  onChange,
}: {
  profileData: ProfileData;
  formData: FormData;
  editing: boolean;
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => void;
}) {
  return (
    <motion.div
      variants={cardVariants}
      className="bg-white rounded-3xl shadow-sm border
        border-gray-100 overflow-hidden"
    >
      <CardHeader
        icon={<Mail className="w-6 h-6 text-violet-600" />}
        title="Contact"
      />
      <div className="p-6 space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-500
            uppercase tracking-wide"
          >
            Email Address
          </label>
          <div className="px-4 py-3.5 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-2 text-sm
              text-gray-900 font-medium"
            >
              <Mail className="w-5 h-5 text-gray-400
                flex-shrink-0"
              />
              <span className="truncate">
                {profileData?.email}
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-400 flex items-center
            gap-1"
          >
            <Shield className="w-3.5 h-3.5" />
            Protected - cannot be changed
          </p>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-500
            uppercase tracking-wide"
          >
            Phone Number
          </label>
          {editing ? (
            <input
              type="text"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={onChange}
              className="w-full px-4 py-3.5 text-sm border
                border-gray-200 rounded-xl focus:ring-2
                focus:ring-blue-500/20 focus:border-blue-500
                transition-all outline-none"
              placeholder="Enter phone number"
            />
          ) : (
            <div className="px-4 py-3.5 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2 text-sm
                text-gray-900 font-medium"
              >
                <Phone className="w-5 h-5 text-gray-400
                  flex-shrink-0"
                />
                {profileData?.phoneNumber || (
                  <span className="text-gray-400">
                    Not provided
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ===============================
   Desktop Subscription Card
=============================== */
function DesktopSubscriptionCard({
  user,
  subscriptionPlan,
  router,
}: {
  user: any;
  subscriptionPlan: string | null;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <motion.div
      variants={cardVariants}
      className="relative overflow-hidden rounded-3xl"
    >
      <div className="absolute inset-0 bg-gradient-to-br
        from-blue-600 to-emerald-600"
      />
      <div className="absolute inset-0 bg-cover bg-center
        opacity-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,
            %3Csvg width='60' height='60' viewBox='0 0 60 60'
            xmlns='http://www.w3.org/2000/svg'%3E
            %3Cg fill='none' fill-rule='evenodd'%3E
            %3Cg fill='%23ffffff' fill-opacity='0.1'%3E
            %3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4z
            m0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2
            h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E
            %3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      <div className="relative p-6">
        <div className="flex items-center gap-4 mb-5">
          <div className="p-3 bg-white/20 backdrop-blur
            rounded-xl"
          >
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white/80">
              {user?.userType === "landlord"
                ? "Subscription Plan"
                : "Account Type"}
            </h3>
            <p className="text-2xl font-bold text-white
              capitalize"
            >
              {user?.userType === "landlord" && subscriptionPlan
                ? subscriptionPlan
                : user?.userType}
            </p>
          </div>
        </div>
        {user?.userType === "landlord" && (
          <button
            onClick={() =>
              router.push("/commons/landlord/subscription")
            }
            className="w-full px-4 py-3 text-sm font-semibold
              text-blue-600 bg-white rounded-xl hover:bg-blue-50
              transition-colors flex items-center justify-center
              gap-2"
          >
            View Subscription
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

/* ===============================
   Desktop Danger Zone Card
=============================== */
function DesktopDangerZone({
  userId,
  userType,
}: {
  userId: string;
  userType: string;
}) {
  return (
    <motion.div
      variants={cardVariants}
      className="bg-white rounded-3xl shadow-sm border
        border-red-100 overflow-hidden"
    >
      <CardHeader
        icon={
          <AlertTriangle className="w-6 h-6 text-red-600" />
        }
        title="Danger Zone"
        danger
      />
      <div className="p-6">
        <p className="text-sm text-gray-600 mb-5">
          Once you delete your account, there is no going back.
          Please be certain.
        </p>
        <DeleteAccountButton
          user_id={userId}
          userType={userType}
        />
      </div>
    </motion.div>
  );
}

/* ===============================
   Main Profile Page
=============================== */
export default function ProfilePage() {
  const { user, loading, fetchSession } = useAuthStore();
  const router = useRouter();
  const userId = user?.user_id;
  const userType = user?.userType;

  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
    civil_status: "",
    occupation: "",
    citizenship: "",
    birthDate: "",
    address: "",
  });

  const [profilePicture, setProfilePicture] = useState("");
  const [editing, setEditing] = useState(false);
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus>(null);
  const [subscriptionPlan, setSubscriptionPlan] = useState<
    string | null
  >(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeMobileTab, setActiveMobileTab] =
    useState<MobileTab>("personal");

  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    occupation: "",
    citizenship: "",
    civil_status: "",
    address: "",
  });

  /* ---- Load session ---- */
  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        await fetchSession();
      }
      setIsInitialLoad(false);
    }
    loadProfile();
  }, [user, fetchSession]);

  /* ---- Populate form ---- */
  useEffect(() => {
    if (!user) return;

    setProfileData(user as ProfileData);
    setProfilePicture(
      user.profilePicture || "https://via.placeholder.com/150",
    );
    setFormData({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      phoneNumber: user.phoneNumber || "",
      occupation: user.occupation || "",
      citizenship: user.citizenship || "",
      civil_status: user.civil_status || "",
      birthDate: user.birthDate || "",
      address: user.address || "",
    });
  }, [user]);

  /* ---- Fetch verification status ---- */
  useEffect(() => {
    if (user?.userType !== "landlord") return;

    axios
      .get("/api/landlord/verification/status")
      .then((res) => {
        setVerificationStatus(
          res.data.status || "not verified",
        );
      })
      .catch((err) => {
        console.error(
          "Failed to fetch verification status:",
          err,
        );
        setVerificationStatus("not verified");
      });
  }, [user]);

  /* ---- Fetch subscription ---- */
  useEffect(() => {
    if (user?.userType !== "landlord" || !user?.landlord_id) {
      return;
    }

    axios
      .get(
        `/api/landlord/subscription/active/${user.landlord_id}`,
      )
      .then((res) => {
        if (res.data?.plan_name) {
          setSubscriptionPlan(res.data.plan_name);
        }
      })
      .catch((err) => {
        if (err.response?.status === 404) {
          setSubscriptionPlan("FREE");
          return;
        }
        console.error(
          "Failed to fetch subscription info:",
          err,
        );
      });
  }, [user]);

  /* ---- Handlers ---- */
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setProfilePicture(URL.createObjectURL(file));

    const uploadFormData = new FormData();
    uploadFormData.append("file", file);

    try {
      const res = await axios.post(
        "/api/profile/uploadProfilePic",
        uploadFormData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      const newUrl = res.data.imageUrl;
      setProfilePicture(newUrl);
      setProfileData((prev) => ({
        ...prev,
        profilePicture: newUrl,
      }));
      useAuthStore.getState().updateUser({
        profilePicture: newUrl,
      });
      Swal.fire({
        icon: "success",
        title: "Photo Updated!",
        text: "Your profile picture has been updated.",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Upload failed:", err);
      Swal.fire({
        icon: "error",
        title: "Upload Failed",
        text: "Failed to upload profile picture.",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUpdateProfile = async () => {
    setIsSaving(true);
    logEvent(
      "Profile Update",
      "User Interaction",
      "User Updated Profile",
      1,
    );

    try {
      await axios.post(
        "/api/commons/profile/user_profile/update",
        formData,
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        },
      );

      Swal.fire({
        icon: "success",
        title: "Profile Updated!",
        text: "Your profile has been updated.",
        timer: 2000,
        showConfirmButton: false,
      });
      setProfileData((prev) => ({ ...prev, ...formData }));
      useAuthStore.getState().updateUser({
        ...useAuthStore.getState().user,
        ...formData,
      });
      setEditing(false);
    } catch (err) {
      console.error("Profile update failed:", err);
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: "Failed to update profile.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  /* ---- Loading states ---- */
  if (isInitialLoad || loading) {
    return (
      <LoadingScreen message="Loading your profile..." />
    );
  }

  if (!user) {
    return (
      <LoadingScreen message="Redirecting to login..." />
    );
  }

  /* ---- Render ---- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50
      via-blue-50/30 to-emerald-50/30"
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="px-4 sm:px-6 lg:px-8 xl:px-12
          py-4 lg:py-8"
      >
        {/* Profile Hero */}
        <ProfileHero
          user={user}
          profilePicture={profilePicture}
          profileData={profileData}
          editing={editing}
          isSaving={isSaving}
          uploadingImage={uploadingImage}
          verificationStatus={verificationStatus}
          onEditToggle={() => setEditing((v) => !v)}
          onSave={handleUpdateProfile}
          onFileChange={handleFileChange}
        />

        {/* Mobile Tab Navigation */}
        <MobileTabNav
          activeTab={activeMobileTab}
          onChange={setActiveMobileTab}
        />

        {/* Mobile Tab Content */}
        <div className="lg:hidden pb-20">
          <AnimatePresence mode="wait">
            {activeMobileTab === "personal" && (
              <motion.div
                key="personal"
                variants={tabContentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <MobilePersonalInfo
                  profileData={profileData}
                  formData={formData}
                  editing={editing}
                  onChange={handleChange}
                />
              </motion.div>
            )}
            {activeMobileTab === "subscription" && (
              <motion.div
                key="subscription"
                variants={tabContentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <MobileSubscriptionTab
                  user={user}
                  verificationStatus={verificationStatus}
                  subscriptionPlan={subscriptionPlan}
                  router={router}
                />
              </motion.div>
            )}
            {activeMobileTab === "settings" && (
              <motion.div
                key="settings"
                variants={tabContentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <MobileSettingsTab
                  userId={userId}
                  userType={userType}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Desktop Content Grid */}
        <div className="hidden lg:grid lg:grid-cols-5
          gap-8 pb-8"
        >
          {/* Left Column */}
          <div className="lg:col-span-3 space-y-8">
            <DesktopPersonalInfo
              profileData={profileData}
              formData={formData}
              editing={editing}
              onChange={handleChange}
            />
            <DesktopProfessionalDetails
              profileData={profileData}
              formData={formData}
              editing={editing}
              onChange={handleChange}
            />
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-8">
            <AnimatePresence>
              {user?.userType === "landlord" &&
                verificationStatus === "not verified" && (
                  <VerificationBanner router={router} />
                )}
            </AnimatePresence>
            <DesktopContactCard
              profileData={profileData}
              formData={formData}
              editing={editing}
              onChange={handleChange}
            />
            <DesktopSubscriptionCard
              user={user}
              subscriptionPlan={subscriptionPlan}
              router={router}
            />
            <DesktopDangerZone
              userId={userId}
              userType={userType}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
