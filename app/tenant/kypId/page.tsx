"use client";

import useSWR from "swr";
import axios from "axios";
import { useEffect, useState } from "react";
import useAuthStore from "@/zustand/authStore";
import {
  ChevronLeft,
  ChevronRight,
  QrCode,
  History,
  User,
  Mail,
  Home,
  Building,
  IdCard,
  Shield,
} from "lucide-react";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

type Tab = "id" | "history";

export default function TenantKypIdPage() {
  const { user, admin, fetchSession } = useAuthStore();

  const [ready, setReady] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("id");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<"left" | "right" | null>(null);

  /* ================= AUTH ================= */
  useEffect(() => {
    fetchSession().then(() => setReady(true));
  }, [fetchSession]);

  /* ================= DATA ================= */
  const { data, isLoading, error } = useSWR(
    ready && user?.tenant_id
      ? `/api/tenant/activeRent/kypId?tenant_id=${user.tenant_id}`
      : null,
    fetcher,
  );

  /* ================= GUARDS ================= */
  if (!ready || isLoading) return <LoadingState />;

  if (!user || admin || !user.tenant_id)
    return <Centered>Tenant access only</Centered>;

  if (error || !data)
    return <Centered error>Failed to load Tenant ID</Centered>;

  const { tenant, units } = data;
  const activeUnit = units[activeIndex];

  const next = () => {
    if (isAnimating || units.length <= 1) return;
    setDirection("left");
    setIsAnimating(true);
    setTimeout(() => {
      setActiveIndex((i) => (i + 1) % units.length);
      setIsAnimating(false);
      setDirection(null);
    }, 300);
  };

  const prev = () => {
    if (isAnimating || units.length <= 1) return;
    setDirection("right");
    setIsAnimating(true);
    setTimeout(() => {
      setActiveIndex((i) => (i - 1 + units.length) % units.length);
      setIsAnimating(false);
      setDirection(null);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-emerald-50">
      {/* HEADER */}
      <div className="px-5 pt-6 pb-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 mb-3 shadow-lg">
            <IdCard className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-800">
            Tenant Electronic ID
          </h1>
          <p className="text-xs text-gray-500">Know Your Person (KYP)</p>
        </div>
      </div>

      {/* TABS */}
      <div className="px-4 pb-3 sticky top-0 z-10 bg-gradient-to-b from-white to-transparent pt-2">
        <div className="flex bg-gray-100 rounded-xl p-1">
          <TabButton
            active={activeTab === "id"}
            onClick={() => setActiveTab("id")}
            icon={<QrCode className="w-4 h-4" />}
          >
            KYP ID
          </TabButton>
          <TabButton
            active={activeTab === "history"}
            onClick={() => setActiveTab("history")}
            icon={<History className="w-4 h-4" />}
          >
            Scan History
          </TabButton>
        </div>
      </div>

      {/* ================= ID TAB ================= */}
      {activeTab === "id" && (
        <div className="px-4 pb-6">
          {/* ID CARD */}
          <div className="relative overflow-hidden rounded-2xl">
            <div
              className={`transition-all duration-300 ease-out ${
                isAnimating
                  ? direction === "left"
                    ? "-translate-x-full opacity-0"
                    : "translate-x-full opacity-0"
                  : "translate-x-0 opacity-100"
              }`}
            >
              <KypCard unit={activeUnit} tenant={tenant} />
            </div>
          </div>

          {/* NAVIGATION */}
          {units.length > 1 && (
            <div className="flex items-center justify-center gap-4 mt-4">
              <NavButton onClick={prev} disabled={isAnimating}>
                <ChevronLeft className="w-5 h-5" />
              </NavButton>

              {/* PAGINATION DOTS */}
              <div className="flex items-center gap-2">
                {units.map((_: any, index: number) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (index !== activeIndex && !isAnimating) {
                        setDirection(index > activeIndex ? "left" : "right");
                        setIsAnimating(true);
                        setTimeout(() => {
                          setActiveIndex(index);
                          setIsAnimating(false);
                          setDirection(null);
                        }, 300);
                      }
                    }}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === activeIndex
                        ? "w-6 bg-gradient-to-r from-blue-500 to-emerald-500"
                        : "w-2 bg-gray-300"
                    }`}
                  />
                ))}
              </div>

              <NavButton onClick={next} disabled={isAnimating}>
                <ChevronRight className="w-5 h-5" />
              </NavButton>
            </div>
          )}

          {/* TENANT INFO CARDS */}
          {activeUnit && (
            <div className="mt-5 space-y-2">
              <InfoCard
                icon={<User className="w-4 h-4" />}
                label="Tenant"
                value={tenant.name}
              />
              <InfoCard
                icon={<Mail className="w-4 h-4" />}
                label="Email"
                value={tenant.email}
              />
              <InfoCard
                icon={<Building className="w-4 h-4" />}
                label="Property"
                value={activeUnit.property_name}
                subValue={activeUnit.city}
              />
              <InfoCard
                icon={<Home className="w-4 h-4" />}
                label="Unit"
                value={activeUnit.unit_name}
              />
              <InfoCard
                icon={<IdCard className="w-4 h-4" />}
                label="Tenant ID"
                value={`T-${user.tenant_id}`}
              />
            </div>
          )}

          {/* FOOTER NOTE */}
          <p className="text-center text-xs text-gray-400 mt-6">
            This QR verifies active tenancy only
          </p>
        </div>
      )}

      {/* ================= HISTORY TAB ================= */}
      {activeTab === "history" && (
        <div className="px-4 pb-6">
          <div className="bg-white rounded-2xl py-16 text-center shadow-sm border border-gray-100">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gray-100 mb-3">
              <History className="w-7 h-7 text-gray-400" />
            </div>
            <p className="font-medium text-gray-600">No scan history yet</p>
            <p className="text-xs text-gray-500 mt-1 px-8">
              Scan logs will appear here once your ID is used.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= CARD ================= */

function KypCard({ unit, tenant }: { unit: any; tenant: any }) {
  const isActive = unit.ekyp_status === "active";

  return (
    <div
      className={`
                rounded-2xl p-5 
                ${
                  isActive
                    ? "bg-gradient-to-br from-blue-600 via-blue-500 to-emerald-500"
                    : "bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900"
                }
            `}
    >
      {/* CARD HEADER */}
      <div className="flex items-center justify-between mb-4">
        <span
          className={`text-xs font-medium ${isActive ? "text-white/70" : "text-slate-500"}`}
        >
          UpKyp ID
        </span>
        <span
          className={`px-3 py-1 text-[10px] rounded-full font-bold uppercase tracking-wide
                        ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-slate-600 text-slate-400"
                        }
                    `}
        >
          {unit.ekyp_status}
        </span>
      </div>

      {/* QR CODE */}
      <div className="flex justify-center py-4">
        {isActive && unit.qr_url ? (
          <div className="bg-white p-3 rounded-2xl shadow-2xl">
            <img
              src={unit.qr_url}
              alt="KYP QR"
              className="w-36 h-36 rounded-lg"
            />
          </div>
        ) : (
          <div
            className="w-40 h-40 rounded-2xl
                            bg-slate-600/50 border-2 border-dashed border-slate-500
                            flex flex-col items-center justify-center gap-2"
          >
            <QrCode className="w-10 h-10 text-slate-400" />
            <span className="text-[10px] text-slate-400 text-center font-medium">
              ID NOT YET ACTIVATED
            </span>
          </div>
        )}
      </div>

      {/* UNIT INFO ON CARD */}
      <div className="text-center mt-2">
        <p
          className={`text-2xl font-bold ${isActive ? "text-white" : "text-slate-300"}`}
        >
          {unit.unit_name}
        </p>
        <p
          className={`text-sm mt-1 ${isActive ? "text-white/70" : "text-slate-500"}`}
        >
          {unit.property_name}
        </p>
        <p
          className={`text-xs ${isActive ? "text-white/50" : "text-slate-600"}`}
        >
          {unit.city}
        </p>
      </div>
    </div>
  );
}

/* ================= UI PARTS ================= */

function TabButton({
  active,
  children,
  onClick,
  icon,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2
                ${active ? "bg-white shadow-md text-gray-800" : "text-gray-500"}
            `}
    >
      {icon}
      {children}
    </button>
  );
}

function InfoCard({
  icon,
  label,
  value,
  subValue,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
}) {
  return (
    <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100">
      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-50 to-emerald-50 flex items-center justify-center text-blue-600 shrink-0">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-gray-400 uppercase tracking-wide">
          {label}
        </p>
        <p className="text-sm font-medium text-gray-800 truncate">{value}</p>
        {subValue && <p className="text-xs text-gray-500">{subValue}</p>}
      </div>
    </div>
  );
}

function NavButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200
                ${
                  disabled
                    ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                    : "bg-gradient-to-br from-blue-500 to-emerald-500 text-white shadow-lg active:scale-95"
                }
            `}
    >
      {children}
    </button>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-emerald-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 mx-auto mb-4 animate-pulse" />
        <p className="text-gray-500 text-sm">Loading Tenant ID…</p>
      </div>
    </div>
  );
}

function Centered({
  children,
  error,
}: {
  children: React.ReactNode;
  error?: boolean;
}) {
  return (
    <div
      className={`min-h-screen bg-gradient-to-b from-blue-50 via-white to-emerald-50 flex items-center justify-center text-sm
                ${error ? "text-red-500" : "text-gray-500"}
            `}
    >
      {children}
    </div>
  );
}
