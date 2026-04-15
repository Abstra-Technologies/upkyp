import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  Home,
  FileText,
  Calendar,
  Wallet,
  DollarSign,
  Clock,
  Shield,
  ExternalLink,
  FileCog,
} from "lucide-react";

interface LeaseDetails {
  tenant_name?: string;
  email?: string;
  phoneNumber?: string;
  property_name?: string;
  unit_name?: string;
  property_id?: number;
  lease_id?: string;
  agreement_id?: string;
  start_date?: string;
  end_date?: string;
  agreement_url?: string;
  security_deposit_amount?: number;
  advance_payment_amount?: number;
  billing_due_day?: number;
  grace_period_days?: number;
  late_penalty_amount?: number;
  rent_amount?: number;
}

interface LeaseInfoProps {
  lease: LeaseDetails;
}

export default function LeaseInfo({ lease }: LeaseInfoProps) {
  const router = useRouter();

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return "₱0.00";
    return `₱${amount.toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleSetupLease = () => {
    const agreementId = lease.agreement_id || lease.lease_id;
    router.push(
      `/landlord/properties/${lease.property_id}/activeLease/setup?agreement_id=${agreementId}`
    );
  };

  const hasAgreement = !!lease.agreement_url;

  return (
    <div className="w-full space-y-4">
      {/* Grid: Stack on mobile, 3 columns on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* TENANT INFORMATION */}
        <div className="bg-gradient-to-br from-white to-slate-50 border border-gray-100 rounded-xl p-4 sm:p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Tenant Information
              </h3>
              <p className="text-xs text-gray-500">Contact details</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                Full Name
              </p>
              <p className="text-base font-semibold text-gray-900">
                {lease.tenant_name || (
                  <span className="text-gray-400 font-normal">
                    Not provided
                  </span>
                )}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                <Mail className="w-3 h-3" /> Email
              </p>
              {lease.email ? (
                <a
                  href={`mailto:${lease.email}`}
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium break-all"
                >
                  {lease.email}
                </a>
              ) : (
                <span className="text-sm text-gray-400">Not provided</span>
              )}
            </div>

            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3" /> Phone
              </p>
              {lease.phoneNumber ? (
                <a
                  href={`tel:${lease.phoneNumber}`}
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium"
                >
                  {lease.phoneNumber}
                </a>
              ) : (
                <span className="text-sm text-gray-400">Not provided</span>
              )}
            </div>
          </div>
        </div>

        {/* LEASE OVERVIEW */}
        <div className="bg-gradient-to-br from-white to-slate-50 border border-gray-100 rounded-xl p-4 sm:p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
              <Home className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Lease Overview
              </h3>
              <p className="text-xs text-gray-500">Property details</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                Property / Unit
              </p>
              <p className="text-base font-semibold text-gray-900">
                {lease.property_name || "N/A"}
              </p>
              <p className="text-sm text-gray-600">
                {lease.unit_name || "N/A"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Lease Period
              </p>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-gray-900">
                  {formatDate(lease.start_date)}
                </span>
                <span className="text-gray-400">→</span>
                <span className="font-medium text-gray-900">
                  {formatDate(lease.end_date)}
                </span>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                <FileText className="w-3 h-3" /> Agreement Document
              </p>
              {hasAgreement ? (
                <a
                  href={lease.agreement_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium group"
                >
                  View Document
                  <ExternalLink className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </a>
              ) : (
                <div className="flex flex-col gap-2">
                  <span className="text-sm text-gray-400">Not uploaded</span>
                  <button
                    onClick={handleSetupLease}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-400 hover:bg-gray-500 text-white text-xs font-medium rounded-lg transition-colors w-fit"
                  >
                    <FileCog className="w-3.5 h-3.5" />
                    Setup Lease Agreement
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FINANCIAL TERMS */}
        <div className="bg-gradient-to-br from-white to-slate-50 border border-gray-100 rounded-xl p-4 sm:p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-sm">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Financial Terms
              </h3>
              <p className="text-xs text-gray-500">Payment settings</p>
            </div>
          </div>

          <div className="space-y-3">
            <FinancialRow
              icon={<Shield className="w-4 h-4 text-gray-400" />}
              label="Security Deposit"
              value={formatCurrency(lease.security_deposit_amount)}
            />

            <FinancialRow
              icon={<DollarSign className="w-4 h-4 text-gray-400" />}
              label="Advance Payment"
              value={formatCurrency(lease.advance_payment_amount)}
            />

            <FinancialRow
              icon={<Clock className="w-4 h-4 text-gray-400" />}
              label="Billing Due Day"
              value={
                lease.billing_due_day
                  ? `Day ${lease.billing_due_day}`
                  : "Not set"
              }
            />

            <FinancialRow
              icon={<Clock className="w-4 h-4 text-gray-400" />}
              label="Grace Period"
              value={`${lease.grace_period_days ?? 0} days`}
            />

            <FinancialRow
              icon={<DollarSign className="w-4 h-4 text-red-400" />}
              label="Late Penalty"
              value={`${formatCurrency(lease.late_penalty_amount)} /day`}
              valueClassName="text-red-600"
            />

            {/* Monthly Rent - Highlighted */}
            <div className="pt-3 mt-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    Monthly Rent
                  </span>
                </div>
                <span className="text-xl font-bold text-emerald-600">
                  {formatCurrency(lease.rent_amount)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────── Financial Row Component ───────── */
function FinancialRow({
  icon,
  label,
  value,
  valueClassName = "",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <span className={`text-sm font-semibold text-gray-900 ${valueClassName}`}>
        {value}
      </span>
    </div>
  );
}
